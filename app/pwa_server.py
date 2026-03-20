from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, ForeignKey, Text, desc
from sqlalchemy.orm import Session, relationship, sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime, timedelta
from pydantic import BaseModel
import json
import os

# --- SETTINGS ---
API_KEY = "1531"
VAPID_PUBLIC_KEY = os.getenv("VAPID_PUBLIC_KEY", "BDXz7_m-hVQ... (Opcional si usas env)")
VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY", "M6S7C-lZ5v8I9S_3H5Z8m3c4L8r8V8L8c4r8V8L8c4r")
VAPID_CLAIMS = {"sub": "mailto:admin@fca-pwa.com"}

# --- DB & MODELS ---
DB_URL = os.getenv("DATABASE_URL", "sqlite:///./data/bot_fca.db")
Base = declarative_base()

class ClientUser(Base):
    __tablename__ = "client_users"
    id = Column(Integer, primary_key=True, index=True)
    faculty = Column(String)
    moodle_username = Column(String, unique=True, index=True)
    moodle_password = Column(String) # Guardado en texto plano o cifrado (Termux usaba cifrado)
    is_active = Column(Boolean, default=True)
    devices = relationship("UserDevice", back_populates="user", cascade="all, delete-orphan")

class UserDevice(Base):
    __tablename__ = "user_devices"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("client_users.id"))
    device_name = Column(String)
    push_subscription = Column(Text)
    last_used = Column(DateTime, default=datetime.utcnow)
    user = relationship("ClientUser", back_populates="devices")

class NotificationHistory(Base):
    __tablename__ = "notification_history"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    title = Column(String)
    body = Column(String)
    url = Column(String)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

# Cifrado simple para mantener compatibilidad si es necesario
def encrypt_password(password: str) -> str: return password # Por ahora directo para simplificar despliegue
def decrypt_password(password: str) -> str: return password

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

def verify_api_key(request: Request):
    key = request.headers.get("X-API-Key") or request.headers.get("Authorization")
    if key and key.startswith("Bearer "): key = key.split(" ")[1]
    if key != API_KEY: raise HTTPException(401, "Error Auth")

# --- PUBLIC ROUTES ---
@app.get("/")
def home():
    return {"status": "online", "message": "FCA PWA Bot Profesh is running on Fly.io!", "version": "2.1.2"}

@app.get("/api/vapid-public-key")
def get_vapid():
    return {"vapid_public_key": os.getenv("VAPID_PUBLIC_KEY", "BJm6_hEw...") }

@app.post("/api/users")
async def register(data: UserCreate, db: Session = Depends(get_db)):
    # Lógica de registro real
    existing = db.query(ClientUser).filter(ClientUser.moodle_username == data.moodle_username).first()
    if existing:
        if existing.moodle_password == data.moodle_password:
            return {"status": "exists", "user_id": existing.id, "device_count": len(existing.devices)}
        raise HTTPException(400, "Usuario ya existe con otra clave")
    
    new_u = ClientUser(faculty=data.faculty, moodle_username=data.moodle_username, moodle_password=data.moodle_password)
    db.add(new_u)
    db.commit()
    return {"status": "success", "user_id": new_u.id}

@app.post("/api/subscribe")
async def subscribe(data: PushSubscribe, db: Session = Depends(get_db)):
    u = db.query(ClientUser).filter(ClientUser.id == data.user_id).first()
    if not u: raise HTTPException(404, "User not found")
    
    if data.replace_existing:
        db.query(UserDevice).filter(UserDevice.user_id == u.id).delete()
    
    new_d = UserDevice(user_id=u.id, device_name=data.device_name, push_subscription=json.dumps(data.subscription))
    db.add(new_d)
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

# --- ADMIN ROUTES (Protected by 1531) ---
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
