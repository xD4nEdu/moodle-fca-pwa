from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, ForeignKey, Text, desc
from sqlalchemy.orm import Session, relationship, sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import json
import os

# --- SETTINGS ---
API_KEY = "1531"
VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY", "M6S7C-lZ5v8I9S_3H5Z8m3c4L8r8V8L8c4r8V8L8c4r")
VAPID_CLAIMS = {"sub": "mailto:admin@fca-pwa.com"}

# --- DB ---
DB_URL = os.getenv("DATABASE_URL", "sqlite:///./bot_fca.db")
Base = declarative_base()

class ClientUser(Base):
    __tablename__ = "client_users"
    id = Column(Integer, primary_key=True, index=True)
    faculty = Column(String)
    moodle_username = Column(String, unique=True, index=True)
    moodle_password = Column(String)
    is_active = Column(Boolean, default=True)
    devices = relationship("UserDevice", back_populates="user")

class UserDevice(Base):
    __tablename__ = "user_devices"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("client_users.id"))
    device_name = Column(String)
    push_subscription = Column(Text)
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

engine = create_engine(DB_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- APP ---
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

def verify_api_key(request: Request):
    key = request.headers.get("X-API-Key") or request.headers.get("Authorization")
    if key and key.startswith("Bearer "): key = key.split(" ")[1]
    if key != API_KEY: raise HTTPException(401, "Error Auth")

@app.api_route("/api/users", methods=["GET", "POST"])
async def get_users(request: Request, db: Session = Depends(get_db)):
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

@app.get("/api/notifications")
async def get_notifs(user_id: int, db: Session = Depends(get_db)):
    ns = db.query(NotificationHistory).filter(NotificationHistory.user_id == user_id).order_by(desc(NotificationHistory.created_at)).limit(20).all()
    return {"notifications": [{"id": n.id, "title": n.title, "body": n.body, "is_read": n.is_read} for n in ns]}

@app.api_route("/api/notifications/{n_id}/read", methods=["GET", "POST"])
async def read(n_id: int, db: Session = Depends(get_db)):
    n = db.query(NotificationHistory).filter(NotificationHistory.id == n_id).first()
    if n:
        n.is_read = True
        db.commit()
        return {"status": "ok"}
    return {"status": "error"}

@app.get("/")
def home():
    return {"status": "online", "message": "FCA PWA Bot is running on Fly.io!", "version": "2.1.0"}

@app.get("/health")
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=9000)
