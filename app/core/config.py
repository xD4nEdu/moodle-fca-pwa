import os

# --- LLAVES Y ENTORNO ---
API_KEY = "1531"
SECRET_ENCRYPTION_KEY = os.getenv("SECRET_ENCRYPTION_KEY", "qYSSXrUitSkBJWLNj6jTl4-_KWWsziRK8RP9vMSleS4=")
VAPID_PUBLIC_KEY = os.getenv("VAPID_PUBLIC_KEY", "BHTVz9fwKybXNasmAtEM-K7Cebkayuhsctrv7tZ0_IsaI3dMWO2n3U3CbtNcSJMf5B7JebXroYsM1RTs145XO8c")
VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY", "iIG-apAQhmRwEe2oSzzTPMplb12qN_sNVj9sLChX5cE")
VAPID_CLAIMS = {"sub": "mailto:botadmin@fca.unam.mx"}

# Configuración de base de datos
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/bot_fca.db")
