from app.db.database import SessionLocal
from app.db.models import NotificationHistory
import sys

print("Iniciando marcación de lectura forzada...")
try:
    db = SessionLocal()
    # Marcamos los primeros que existan como leídos para probar
    notifs = db.query(NotificationHistory).all()
    if not notifs:
        print("No hay avisos para marcar.")
    else:
        for n in notifs:
            n.is_read = True
            print(f"Marcando aviso {n.id} como leído.")
        db.commit()
        print("¡TODO MARCADO CON ÉXITO EN LA BASE DE DATOS!")
except Exception as e:
    print(f"ERROR FATAL AL GUARDAR: {e}")
    sys.exit(1)
finally:
    db.close()
