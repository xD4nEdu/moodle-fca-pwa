from fastapi import FastAPI, Request, Depends, HTTPException, Body
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import asyncio
import os
import json
from dotenv import load_dotenv

from app.db.database import get_db, init_db, SessionLocal
from app.db.models import ClientUser, MutedCourse
from app.core.security import encrypt_password, decrypt_password
from app.bot.task import background_moodle_task
from app.services.moodle import FACULTIES, MoodleClient
from pydantic import BaseModel

load_dotenv()

VAPID_PUBLIC_KEY = os.environ.get("VAPID_PUBLIC_KEY", "")
VAPID_PRIVATE_KEY = os.environ.get("VAPID_PRIVATE_KEY", "")
VAPID_CLAIMS = {
    "sub": "mailto:botadmin@fca.unam.mx"
}

app = FastAPI(title="Bot Administrador FCA - PWA API")

from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://moodle-fca-pwa.vercel.app", "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup():
    init_db()
    asyncio.create_task(background_moodle_task())

# Pydantic models for incoming requests
class UserCreate(BaseModel):
    faculty: str
    moodle_username: str
    moodle_password: str

class PushSubscribe(BaseModel):
    user_id: int
    subscription: dict

# API Endpoints
@app.get("/api/users")
async def get_users(db: Session = Depends(get_db)):
    users = db.query(ClientUser).all()
    result = []
    for u in users:
        result.append({
            "id": u.id,
            "faculty": u.faculty,
            "moodle_username": u.moodle_username,
            "is_active": u.is_active,
            "has_push": bool(u.push_subscription)
        })
    return {"users": result}

@app.get("/api/faculties")
async def get_faculties():
    return {"faculties": list(FACULTIES.keys())}

@app.post("/api/users")
async def add_user(user_data: UserCreate, db: Session = Depends(get_db)):
    enc_pass = encrypt_password(user_data.moodle_password)
    
    existing = db.query(ClientUser).filter(ClientUser.moodle_username == user_data.moodle_username).first()
    if existing:
        if decrypt_password(existing.moodle_password) == user_data.moodle_password:
            return {"status": "success", "user_id": existing.id}
        else:
            raise HTTPException(status_code=400, detail="El usuario ya existe con otra contraseña")

    new_user = ClientUser(
        faculty=user_data.faculty,
        moodle_username=user_data.moodle_username,
        moodle_password=enc_pass,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    return {"status": "success", "user_id": new_user.id}

@app.post("/api/users/{user_id}/toggle")
async def toggle_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(ClientUser).filter(ClientUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    db.commit()
    return {"status": "success", "is_active": user.is_active}

@app.delete("/api/users/{user_id}")
async def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(ClientUser).filter(ClientUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"status": "success"}

@app.get("/api/users/{user_id}/courses")
async def view_courses(user_id: int, db: Session = Depends(get_db)):
    user = db.query(ClientUser).filter(ClientUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    muted_records = db.query(MutedCourse).filter(MutedCourse.user_id == user_id).all()
    muted_ids = [m.course_id for m in muted_records]
    
    try:
        password = decrypt_password(user.moodle_password)
        moodle = MoodleClient(user.faculty, user.moodle_username, password, user.moodle_token)
        site_info = await moodle.get_site_info()
        userid = site_info["userid"]
        courses = await moodle.get_user_courses(userid)
        
        # Guardar token nuevo si cambió
        token = await moodle.get_token()
        if token != user.moodle_token:
            user.moodle_token = token
            db.commit()
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    result_courses = []
    for c in courses:
        result_courses.append({
            "id": c["id"],
            "fullname": c["fullname"],
            "is_muted": c["id"] in muted_ids
        })
        
    return {"courses": result_courses}

@app.post("/api/users/{user_id}/courses/{course_id}/toggle")
async def toggle_course_mute(user_id: int, course_id: int, db: Session = Depends(get_db)):
    muted = db.query(MutedCourse).filter_by(user_id=user_id, course_id=course_id).first()
    if muted:
        db.delete(muted)
        is_muted = False
    else:
        new_mute = MutedCourse(user_id=user_id, course_id=course_id)
        db.add(new_mute)
        is_muted = True
    db.commit()
    return {"status": "success", "is_muted": is_muted}

# Web Push Endpoints
@app.get("/api/vapid-public-key")
async def get_vapid_key():
    return {"vapid_public_key": VAPID_PUBLIC_KEY}

@app.post("/api/subscribe")
async def subscribe_push(sub_data: PushSubscribe, db: Session = Depends(get_db)):
    user = db.query(ClientUser).filter(ClientUser.id == sub_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    subs = []
    if user.push_subscription:
        try:
            parsed = json.loads(user.push_subscription)
            if isinstance(parsed, list):
                subs = parsed
            elif isinstance(parsed, dict):
                subs = [parsed]
        except:
            pass
            
    # Check if this exact endpoint already exists
    already_exists = False
    for s in subs:
        if s.get("endpoint") == sub_data.subscription.get("endpoint"):
            already_exists = True
            break
            
    if not already_exists:
        subs.append(sub_data.subscription)
        
    user.push_subscription = json.dumps(subs)
    db.commit()
    return {"status": "success"}

from app.db.models import NotificationHistory

@app.get("/api/users/{user_id}/status")
async def get_user_status(user_id: int, db: Session = Depends(get_db)):
    user = db.query(ClientUser).filter(ClientUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    device_count = 0
    if user.push_subscription:
        try:
            parsed = json.loads(user.push_subscription)
            if isinstance(parsed, list): device_count = len(parsed)
            elif isinstance(parsed, dict): device_count = 1
        except:
            pass
            
    recent_records = db.query(NotificationHistory).filter(NotificationHistory.user_id == user_id).order_by(NotificationHistory.created_at.desc()).limit(5).all()
    recent = [{"message": r.message, "date": r.created_at.strftime("%d/%m %H:%M")} for r in recent_records]
    
    return {
        "is_active": user.is_active,
        "device_count": device_count,
        "recent_notifications": recent
    }

@app.post("/api/users/{user_id}/test_push")
async def test_push(user_id: int, db: Session = Depends(get_db)):
    from pywebpush import webpush, WebPushException
    user = db.query(ClientUser).filter(ClientUser.id == user_id).first()
    if not user or not user.push_subscription:
        raise HTTPException(status_code=400, detail="Usuario sin suscripción Push")
        
    subs = []
    if user.push_subscription:
        try:
            parsed = json.loads(user.push_subscription)
            subs = parsed if isinstance(parsed, list) else [parsed]
        except:
            pass
            
    if not subs:
        raise HTTPException(status_code=400, detail="Usuario sin suscripción Push")
        
    errors = []
    for sub in subs:
        try:
            payload = json.dumps({
                "title": "Configuración Exitosa",
                "body": "¡Prueba de conexión exitosa! Este es tu nuevo sistema PWA.",
                "url": "/"
            })
            webpush(
                subscription_info=sub,
                data=payload,
                vapid_private_key=VAPID_PRIVATE_KEY,
                vapid_claims=VAPID_CLAIMS
            )
        except WebPushException as ex:
            errors.append(str(ex))
            
    if len(errors) == len(subs) and len(subs) > 0:
        raise HTTPException(status_code=500, detail=f"Falló WebPush en todos los dispositivos: {errors[0]}")
    return {"status": "success"}

# PWA Static Files Integration
frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")

if os.path.isdir(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")
    
    @app.get("/{path:path}")
    async def serve_pwa(path: str):
        file_path = os.path.join(frontend_dist, path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:
    @app.get("/")
    async def dev_mode():
        return {"message": "PWA no compilada. Inicia la app de frontend en dev mode o compila usando npm run build."}

