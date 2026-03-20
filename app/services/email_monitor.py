import os
import sqlite3
import imaplib
import email
import asyncio
from datetime import datetime
import json
import requests
import time

# --- SETTINGS ---
IMAP_SERVER = os.getenv("IMAP_SERVER", "imap.gmail.com")
IMAP_USER = os.getenv("IMAP_USER")
IMAP_PASSWORD = os.getenv("IMAP_PASSWORD")
API_URL = os.getenv("API_INTERNAL_URL", "http://localhost:9000")
API_KEY = "1531"

async def check_moodle_emails():
    print(f"[{datetime.now()}] Escaneando correos de Moodle...")
    try:
        mail = imaplib.IMAP4_SSL(IMAP_SERVER)
        mail.login(IMAP_USER, IMAP_PASSWORD)
        mail.select("inbox")
        
        # Buscar correos no leídos de Moodle
        status, messages = mail.search(None, '(UNSEEN SUBJECT "Moodle")')
        if status != "OK": return

        for msg_id in messages[0].split():
            res, msg_data = mail.fetch(msg_id, "(RFC822)")
            for response_part in msg_data:
                if isinstance(response_part, tuple):
                    msg = email.message_from_bytes(response_part[1])
                    subject = msg["subject"]
                    body = ""
                    if msg.is_multipart():
                        for part in msg.walk():
                            if part.get_content_type() == "text/plain":
                                body = part.get_payload(decode=True).decode()
                    else:
                        body = msg.get_payload(decode=True).decode()
                    
                    print(f"Correo detectado: {subject}")
                    # Aquí llamaríamos a la API para enviar el Push
                    # (Lógica simplificada para el ejemplo de Fly.io)
                    
        mail.logout()
    except Exception as e:
        print(f"Error en monitor: {e}")

async def main():
    while True:
        await check_moodle_emails()
        await asyncio.sleep(60) # Cada minuto

if __name__ == "__main__":
    asyncio.run(main())
