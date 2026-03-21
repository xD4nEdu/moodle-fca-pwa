from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, ForeignKey, Text, desc
from sqlalchemy.orm import Session, relationship, sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime, timedelta
from pydantic import BaseModel
from cryptography.fernet import Fernet
import json
import os
import asyncio
import logging

# --- LOGS ---
logger = logging.getLogger("bot")
logging.basicConfig(level=logging.INFO)

# --- ENTORNO Y LLAVES REALES ---
API_KEY = "1531"
SECRET_ENCRYPTION_KEY = os.getenv("SECRET_ENCRYPTION_KEY", "qYSSXrUitSkBJWLNj6jTl4-_KWWsziRK8RP9vMSleS4=")
VAPID_PUBLIC_KEY = os.getenv("VAPID_PUBLIC_KEY", "BHTVz9fwKybXNasmAtEM-K7Cebkayuhsctrv7tZ0_IsaI3dMWO2n3U3CbtNcSJMf5B7JebXroYsM1RTs145XO8c")
VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY", "iIG-apAQhmRwEe2oSzzTPMplb12qN_sNVj9sLChX5cE")
VAPID_CLAIMS = {"sub": "mailto:botadmin@fca.unam.mx"}

# Cifrado Fernet Real con fallback a texto plano
cipher_suite = Fernet(SECRET_ENCRYPTION_KEY.encode())

def encrypt_password(plain: str) -> str: return cipher_suite.encrypt(plain.encode()).decode()
def decrypt_password(enc: str) -> str:
    if not enc: return ""
    try:
        return cipher_suite.decrypt(enc.encode()).decode()
    except Exception:
        return enc

# --- DB & MODELS ---
DB_URL = os.getenv("DATABASE_URL", "sqlite:///./data/bot_fca.db")
Base = declarative_base()

class ClientUser(Base):
    __tablename__ = "clients"
    id = Column(Integer, primary_key=True, index=True)
    faculty = Column(String)
    moodle_username = Column(String, unique=True, index=True)
    moodle_password = Column(String)
    moodle_token = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    devices = relationship("UserDevice", back_populates="user", cascade="all, delete-orphan")

class UserDevice(Base):
    __tablename__ = "user_devices"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("clients.id"))
    device_name = Column(String)
    push_subscription = Column(Text)
    last_used = Column(DateTime, default=datetime.utcnow)
    user = relationship("ClientUser", back_populates="devices")

class NotificationHistory(Base):
    __tablename__ = "notification_history"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    title = Column(String, nullable=True)
    body = Column(String)
    url = Column(String, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class ProcessedItem(Base):
    __tablename__ = "processed_items"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    course_id = Column(Integer, index=True)
    item_type = Column(String)
    item_id = Column(Integer)
    processed_at = Column(DateTime, default=datetime.utcnow)

class MutedCourse(Base):
    __tablename__ = "muted_courses"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    course_id = Column(Integer, index=True)

engine = create_engine(DB_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

# --- PYDANTIC ---
class UserCreate(BaseModel):
    faculty: str
    moodle_username: str
    moodle_password: str

class PushSubscribe(BaseModel):
    user_id: int
    subscription: dict
    device_name: str
    replace_existing: bool = False

# --- APP ---
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.on_event("startup")
async def startup_event():
    # Arrancar el motor de búsqueda en segundo plano
    logger.info("⚡ ARRANCANDO MOTOR DE BÚSQUEDA MOODLE...")
    from app.bot.task import background_moodle_task
    asyncio.create_task(background_moodle_task())

def verify_api_key(request: Request):
    key = request.headers.get("X-API-Key") or request.headers.get("Authorization")
    if key and key.startswith("Bearer "): key = key.split(" ")[1]
    if key != API_KEY: raise HTTPException(401, "Error Auth")

# --- PUBLIC ROUTES ---
@app.get("/")
def home():
    return {"status": "online", "message": "FCA PWA Bot TOTAL (Motor Activo) is running on Fly.io!", "version": "2.2.2-ROCKET"}

@app.get("/api/faculties")
def get_facs():
    return {"faculties": ["contaduria", "administracion", "informatica", "negociosinternacionales", "empresariales"]}

@app.get("/api/vapid-public-key")
def get_vapid():
    return {"vapid_public_key": VAPID_PUBLIC_KEY}

@app.post("/api/users")
async def register(data: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(ClientUser).filter(ClientUser.moodle_username == data.moodle_username).first()
    if existing:
        if decrypt_password(existing.moodle_password) == data.moodle_password:
            if existing.moodle_password == data.moodle_password:
                existing.moodle_password = encrypt_password(data.moodle_password)
                db.commit()
            return {"status": "exists", "user_id": existing.id, "device_count": len(existing.devices)}
        raise HTTPException(400, "Contraseña incorrecta para el usuario existente")
    
    new_u = ClientUser(
        faculty=data.faculty, 
        moodle_username=data.moodle_username, 
        moodle_password=encrypt_password(data.moodle_password)
    )
    db.add(new_u)
    db.commit()
    return {"status": "success", "user_id": new_u.id}

@app.post("/api/subscribe")
async def subscribe(data: PushSubscribe, db: Session = Depends(get_db)):
    u = db.query(ClientUser).filter(ClientUser.id == data.user_id).first()
    if not u: raise HTTPException(404, "User not found")
    
    if data.replace_existing:
        db.query(UserDevice).filter(UserDevice.user_id == u.id).delete()
    
    sub_json = json.dumps(data.subscription)
    existing_dev = db.query(UserDevice).filter_by(user_id=u.id, push_subscription=sub_json).first()
    if not existing_dev:
        new_d = UserDevice(user_id=u.id, device_name=data.device_name, push_subscription=sub_json)
        db.add(new_d)
    else:
        existing_dev.last_used = datetime.utcnow()
    
    db.commit()
    return {"status": "success"}

@app.get("/api/users/{user_id}/status")
async def get_status(user_id: int, db: Session = Depends(get_db)):
    u = db.query(ClientUser).filter(ClientUser.id == user_id).first()
    if not u: raise HTTPException(404)
    
    cutoff = datetime.utcnow() - timedelta(hours=24)
    notifs = db.query(NotificationHistory).filter(
        NotificationHistory.user_id == user_id, 
        NotificationHistory.created_at >= cutoff
    ).order_by(desc(NotificationHistory.created_at)).all()
    
    return {
        "is_active": u.is_active,
        "device_count": len(u.devices),
        "recent_notifications": [{"id":n.id,"message":n.body,"is_read":n.is_read,"date":n.created_at.strftime("%H:%M")} for n in notifs]
    }

@app.get("/api/users/{user_id}/devices")
async def list_devs(user_id: int, db: Session = Depends(get_db)):
    devs = db.query(UserDevice).filter_by(user_id=user_id).all()
    return {"devices": [{"id":d.id, "name":d.device_name, "last_used":d.last_used.strftime("%d/%m %H:%M")} for d in devs]}

# --- ADMIN ROUTES (Protected) ---
@app.get("/api/users")
async def list_users(request: Request, db: Session = Depends(get_db)):
    verify_api_key(request)
    users = db.query(ClientUser).all()
    return {"status": "ok", "users": [{
        "id": u.id, "faculty": u.faculty, "moodle_username": u.moodle_username,
        "is_active": u.is_active, "device_count": len(u.devices)
    } for u in users]}

@app.api_route("/api/users/{user_id}/toggle", methods=["GET", "POST"])
async def toggle(user_id: int, request: Request, db: Session = Depends(get_db)):
    verify_api_key(request)
    u = db.query(ClientUser).filter(ClientUser.id == user_id).first()
    if u:
        u.is_active = not u.is_active
        db.commit()
        return {"status": "success", "new_state": u.is_active}
    return {"status": "error"}

@app.api_route("/api/users/{user_id}", methods=["GET", "POST", "DELETE"])
async def delete_user(user_id: int, request: Request, db: Session = Depends(get_db)):
    if request.method in ["POST", "DELETE"] or (request.method == "GET" and request.query_params.get("action") == "delete"):
        verify_api_key(request)
    
    u = db.query(ClientUser).filter(ClientUser.id == user_id).first()
    if u:
        db.delete(u)
        db.commit()
        return {"status": "success", "message": "User deleted successfully"}
    return {"status": "not_found"}

@app.api_route("/api/users/{user_id}/test_push", methods=["GET", "POST"])
async def test_push(user_id: int, request: Request, db: Session = Depends(get_db)):
    verify_api_key(request)
    from pywebpush import webpush
    u = db.query(ClientUser).filter(ClientUser.id == user_id).first()
    if not u or not u.devices: return {"status": "error"}
    for d in u.devices:
        sub = json.loads(d.push_subscription)
        try:
            webpush(subscription_info=sub, data=json.dumps({"title":"PRUEBA","body":"Bot OK","url":"/"}), 
                    vapid_private_key=VAPID_PRIVATE_KEY, vapid_claims=VAPID_CLAIMS)
        except: pass
    return {"status": "success"}

@app.get("/api/notifications/{n_id}/read")
async def read_notif(n_id: int, db: Session = Depends(get_db)):
    n = db.query(NotificationHistory).filter(NotificationHistory.id == n_id).first()
    if n:
        n.is_read = True
        db.commit()
        return {"status": "ok"}
    return {"status": "error"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=9000)
