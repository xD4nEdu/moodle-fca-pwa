from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class ClientUser(Base):
    __tablename__ = 'clients'

    id = Column(Integer, primary_key=True, index=True)
    faculty = Column(String, nullable=False)
    moodle_username = Column(String, unique=True, index=True, nullable=False)
    moodle_password = Column(String, nullable=False) # Guardaremos cifrado simétrico
    moodle_token = Column(String, nullable=True) # Token cacheado
    is_active = Column(Boolean, default=True)
    
    # Relación con sus dispositivos vinculados
    devices = relationship("UserDevice", back_populates="user", cascade="all, delete-orphan")

class UserDevice(Base):
    """
    Representa un dispositivo vinculado para notificaciones Push.
    Un usuario puede tener múltiples dispositivos (Multidispositivo).
    """
    __tablename__ = 'user_devices'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('clients.id'), nullable=False)
    device_name = Column(String, nullable=False) # ej: "iPhone 13 (Safari)"
    push_subscription = Column(String, nullable=False) # JSON de Web Push guardado como string
    last_used = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("ClientUser", back_populates="devices")

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

class NotificationHistory(Base):
    __tablename__ = 'notification_history'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('clients.id'))
    message = Column(String)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
