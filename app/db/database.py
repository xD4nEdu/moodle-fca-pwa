import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.models import Base

# Fly.io usa /data/ para persistencia. Termux usa ./data/
# Le daremos preferencia a la variable de entorno, de lo contrario un path seguro para Fly.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/bot_fca.db")

engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    # Crea las tablas si no existen según el plano CENTRAL
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
