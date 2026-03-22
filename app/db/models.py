from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class ClientUser(Base):
    __tablename__ = 'clients'
    id = Column(Integer, primary_key=True, index=True)
    faculty = Column(String, nullable=False)
    moodle_username = Column(String, unique=True, index=True, nullable=False)
    moodle_password = Column(String, nullable=False)
    moodle_token = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    devices = relationship("UserDevice", back_populates="user", cascade="all, delete-orphan")

class UserDevice(Base):
    __tablename__ = 'user_devices'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('clients.id'), nullable=False)
    device_name = Column(String, nullable=False)
    push_subscription = Column(Text, nullable=False)
    last_used = Column(DateTime, default=datetime.utcnow)
    user = relationship("ClientUser", back_populates="devices")

class ProcessedItem(Base):
    __tablename__ = 'processed_items'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('clients.id'), nullable=False)
    course_id = Column(Integer, nullable=False)
    item_type = Column(String, nullable=False)
    item_id = Column(Integer, nullable=False)
    processed_at = Column(DateTime, default=datetime.utcnow)

class MutedCourse(Base):
    __tablename__ = 'muted_courses'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('clients.id'), nullable=False)
    course_id = Column(Integer, nullable=False)

class NotificationHistory(Base):
    __tablename__ = 'notification_history'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('clients.id'))
    title = Column(String)
    body = Column(String)
    url = Column(String, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
