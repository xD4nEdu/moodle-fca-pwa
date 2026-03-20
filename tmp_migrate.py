from app.db.database import engine
from sqlalchemy import text
import sys

print("Iniciando migración de base de datos...")
try:
    with engine.connect() as con:
        # Intentamos añadir la columna si no existe
        try:
            con.execute(text('ALTER TABLE notification_history ADD COLUMN is_read BOOLEAN DEFAULT 0'))
            con.commit()
            print("¡Columna is_read añadida con éxito!")
        except Exception as e:
            if "duplicate column name" in str(e).lower():
                print("La columna ya existe. Todo bien.")
            else:
                print(f"Error al añadir columna: {e}")
except Exception as e:
    print(f"Error general: {e}")
    sys.exit(1)
print("Migración finalizada.")
