import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.models import Base

# Utilizaremos SQLite por defecto. Para Termux es muy ligero.
# Si a futuro necesitas migrar a PostgreSQL o MySQL, solo cambias esta ruta:
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./bot_fca.db")

engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    # Crea las tablas si no existen
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
