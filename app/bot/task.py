import asyncio
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from app.db.database import get_db, SessionLocal
from app.db.models import ClientUser, ProcessedItem, MutedCourse
from app.services.moodle import MoodleClient
from app.core.security import decrypt_password, encrypt_token, decrypt_token
import json
import os
from pywebpush import webpush, WebPushException

VAPID_PRIVATE_KEY = os.environ.get("VAPID_PRIVATE_KEY", "")
VAPID_CLAIMS = {"sub": "mailto:botadmin@fca.unam.mx"}
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("bot_task")

import re

def get_item_format(item_type: str) -> tuple[str, str]:
    mapping = {
        "assign": ("📝", "Tarea"),
        "resource": ("📄", "Archivo/PDF"),
        "folder": ("📁", "Carpeta"),
        "url": ("🔗", "Enlace"),
        "forum": ("💬", "Foro"),
        "quiz": ("⏱️", "Cuestionario"),
        "page": ("📖", "Página"),
        "label": ("🏷️", "Etiqueta/Aviso")
    }
    return mapping.get(item_type, ("📌", item_type.capitalize()))

def clean_html(raw_html: str) -> str:
    cleantext = re.sub(r'<br\s*/?>', '\n', raw_html)
    cleantext = re.sub(r'<[^>]+>', '', cleantext)
    return cleantext.strip()

async def check_user_moodle(user_id: int, semaphore: asyncio.Semaphore):
    async with semaphore:
        db: Session = SessionLocal()
        mensajes_pendientes = []
        push_sub = None
        is_first_sync = True
        try:
            user = db.query(ClientUser).filter(ClientUser.id == user_id).first()
            if not user:
                return

            password = decrypt_password(user.moodle_password)
            decrypted_token = decrypt_token(user.moodle_token)
            moodle = MoodleClient(user.faculty, user.moodle_username, password, decrypted_token)
            token = await moodle.get_token()
            
            if token != decrypted_token:
                user.moodle_token = encrypt_token(token)
                db.commit()
            
            site_info = await moodle.get_site_info()
            userid = site_info["userid"]
            
            is_first_sync = db.query(ProcessedItem).filter(ProcessedItem.user_id == user.id).count() == 0
            is_first_msg_sync = db.query(ProcessedItem).filter_by(user_id=user.id, item_type="mensaje").count() == 0
            is_first_notif_sync = db.query(ProcessedItem).filter_by(user_id=user.id, item_type="notificacion").count() == 0
            push_sub = user.push_subscription
                
            # 1. Verificar Cursos (Archivos, Tareas, etc)
            courses = await moodle.get_user_courses(userid)
            all_assignments_data = await moodle.get_assignments()
            assignments_map = {}
            if "courses" in all_assignments_data:
                for asg_course in all_assignments_data["courses"]:
                    for asg in asg_course.get("assignments", []):
                        assignments_map[asg["cmid"]] = asg["duedate"]
    
            # Obtener ids de cursos muteados
            muted_courses = db.query(MutedCourse).filter(MutedCourse.user_id == user.id).all()
            muted_ids = {m.course_id for m in muted_courses}
    
            for course in courses:
                course_id = course["id"]
                if course_id in muted_ids:
                    continue
                    
                contents = await moodle.get_course_contents(course_id)
                
                for section in contents:
                    section_name = clean_html(section.get("name", "General"))
                    for module in section.get("modules", []):
                        mod_id = module["id"]
                        mod_type = module["modname"]
                        
                        if not db.query(ProcessedItem).filter_by(user_id=user.id, course_id=course_id, item_type=mod_type, item_id=mod_id).first():
                            db.add(ProcessedItem(user_id=user.id, course_id=course_id, item_type=mod_type, item_id=mod_id))
                            
                            if not is_first_sync:
                                icon, type_name = get_item_format(mod_type)
                                subject_short = course['fullname'].split(' - ')[0]
                                summary = f"*{subject_short}* - {module['name']}"
                                
                                # Ajuste a Hora CDMX (GMT-6)
                                cdmx_now = datetime.now(timezone(timedelta(hours=-6)))
                                
                                # Formato estructurado para la BD
                                details = f"📂 Apartado: {section_name}\n"
                                details += f"{icon} Tipo: {type_name}\n"
                                details += f"⏰ Avisado: {cdmx_now.strftime('%H:%M %p')}\n"
                                
                                if mod_type == "assign" and mod_id in assignments_map:
                                    # Moodle timestamp (UTC) a CDMX (GMT-6)
                                    due_utc = datetime.fromtimestamp(assignments_map[mod_id], tz=timezone.utc)
                                    due_cdmx = due_utc.astimezone(timezone(timedelta(hours=-6)))
                                    details += f"⏳ *VENCE:* {due_cdmx.strftime('%d/%m/%Y %H:%M')}\n"
                                
                                text = f"{summary} [DETAILS] {details}"
                                mensajes_pendientes.append(text)
                                
            # 2. Verificar Mensajes Directos (Conversaciones)
            conversations_data = await moodle.get_conversations(userid)
            if "conversations" in conversations_data:
                for conv in conversations_data["conversations"]:
                    for msg in conv.get("messages", []):
                        msg_id = msg["id"]
                        if not db.query(ProcessedItem).filter_by(user_id=user.id, course_id=0, item_type="mensaje", item_id=msg_id).first():
                            db.add(ProcessedItem(user_id=user.id, course_id=0, item_type="mensaje", item_id=msg_id))
                            if not is_first_sync and not is_first_msg_sync and msg.get("useridfrom") != userid:
                                sender_name = "Alguien"
                                for member in conv.get("members", []):
                                    if member["id"] == msg.get("useridfrom"):
                                        sender_name = member.get("fullname", "Alguien")
                                        break
                                
                                msg_text = clean_html(msg.get("text", ""))
                                summary = f"💬 Mensaje de {sender_name}"
                                text = f"{summary} [DETAILS] {msg_text}"
                                mensajes_pendientes.append(text)
                                
            # 3. Verificar Correos / Notificaciones (Eventos)
            notifications_data = await moodle.get_notifications(userid)
            if "notifications" in notifications_data:
                for notif in notifications_data["notifications"]:
                    notif_id = notif["id"]
                    if not db.query(ProcessedItem).filter_by(user_id=user.id, course_id=0, item_type="notificacion", item_id=notif_id).first():
                        db.add(ProcessedItem(user_id=user.id, course_id=0, item_type="notificacion", item_id=notif_id))
                        
                        subject = clean_html(notif.get("subject", "Nueva Notificación"))
                        if subject.startswith("Usted ha realizado su entrega de"):
                            continue
                            
                        if not is_first_sync and not is_first_notif_sync:
                            # Usar smallmessage o limpiar el html completo
                            full_msg = clean_html(notif.get("fullmessagehtml", notif.get("text", "")))
                            
                            # Acotar mensajes enormes
                            if len(full_msg) > 300:
                                full_msg = full_msg[:300] + "..."
                            
                            summary = f"🔔 {subject}"
                            details = full_msg if full_msg and full_msg != subject else "Sin detalles adicionales."
                            text = f"{summary} [DETAILS] {details}"
                            
                            mensajes_pendientes.append(text)
    
            if is_first_sync:
                 mensajes_pendientes.append("Bot FCA en linea 🤖, notificaciones de Moodle activadas.")
                 
            # Guardado global en Base de Datos de todos los recursos y mensajes procesados.
            db.commit()
             
        except Exception as e:
            logger.error(f"Error procesando usuario {user_id}: {str(e)}")
            db.rollback()
            # Cortar falsos positivos: limpiar RAM para no mandar basura
            mensajes_pendientes.clear()
        finally:
            db.close()

        # Solo si el guardado SQL fue exitoso (no hubo errores ni warnings de red), 
        # enviamos los mensajes pendientes (Anti-Spam).
        if not is_first_sync and push_sub and VAPID_PRIVATE_KEY and mensajes_pendientes:
            db_hist = SessionLocal()
            from app.db.models import NotificationHistory
            try:
                parsed = json.loads(push_sub)
                subs = parsed if isinstance(parsed, list) else [parsed]
                
                for msg in mensajes_pendientes:
                    db_hist.add(NotificationHistory(user_id=user_id, message=msg))
                    
                    # El cuerpo de la notificación push solo lleva el resumen
                    push_body = msg.split(" [DETAILS] ")[0] if " [DETAILS] " in msg else msg
                    
                    payload = json.dumps({
                        "title": "Aviso de Moodle 🎓",
                        "body": push_body,
                        "url": "/"
                    })
                    
                    for sub_info in subs:
                        try:
                            webpush(
                                subscription_info=sub_info,
                                data=payload,
                                vapid_private_key=VAPID_PRIVATE_KEY,
                                vapid_claims=VAPID_CLAIMS
                            )
                        except Exception as e_push:
                            logger.error(f"WebPush Error en dispositivo de usuario {user_id}: {e_push}")
                    
                    await asyncio.sleep(1)
                db_hist.commit()
            except Exception as e:
                logger.error(f"Error en flujo de Notificaciones para usuario {user_id}: {e}")
            finally:
                db_hist.close()


async def background_moodle_task():
    """Bucle infinito que ejecuta la revisión cada minuto."""
    logger.info("Iniciando servicio en segundo plano de Moodle (Optimizado con Concurrencia y Lotes)...")
    concurrency_limit = 3  # Protege la red de Moodle y base de datos
    semaphore = asyncio.Semaphore(concurrency_limit)
    
    while True:
        db_main = SessionLocal()
        try:
            active_users = db_main.query(ClientUser).filter(ClientUser.is_active == True).all()
            active_user_ids = [user.id for user in active_users]
        except Exception as e:
            logger.error(f"Error al obtener usuarios: {e}")
            active_user_ids = []
        finally:
            db_main.close()
            
        if active_user_ids:
            # Lanza todas las tareas, el semáforo limitará cuántas corren simultáneamente
            tasks = [check_user_moodle(uid, semaphore) for uid in active_user_ids]
            await asyncio.gather(*tasks)
            
        # Esperar 60 segundos antes de volver iterar
        await asyncio.sleep(60)
