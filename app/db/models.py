from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class ClientUser(Base):
    __tablename__ = 'clients'

    id = Column(Integer, primary_key=True, index=True)
    faculty = Column(String, nullable=False)
    moodle_username = Column(String, unique=True, index=True, nullable=False)
    moodle_password = Column(String, nullable=False) # Guardaremos cifrado simétrico
    moodle_token = Column(String, nullable=True) # Token cacheado
    push_subscription = Column(String, nullable=True) # JSON de Web Push guardado como string
    is_active = Column(Boolean, default=True)

class ProcessedItem(Base):
    """
    Guarda los ítems (tareas, recursos) que ya se enviaron por Notificación Push a un usuario,
    para evitar enviar duplicados.
    """
    __tablename__ = 'processed_items'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('clients.id'), nullable=False)
    course_id = Column(Integer, nullable=False)
    item_type = Column(String, nullable=False) # 'assign', 'resource', 'forum', etc.
    item_id = Column(Integer, nullable=False)  # El ID interno del recurso/tarea en Moodle

class MutedCourse(Base):
    __tablename__ = 'muted_courses'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('clients.id'), nullable=False)
    course_id = Column(Integer, nullable=False)

from datetime import datetime
from sqlalchemy import DateTime

class NotificationHistory(Base):
    __tablename__ = 'notification_history'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('clients.id'), nullable=False)
    message = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
