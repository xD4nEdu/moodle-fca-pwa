import os
from cryptography.fernet import Fernet
from dotenv import load_dotenv

load_dotenv()

import sys
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("security")

# Usar una variable de entorno para la clave de encriptación.
# IMPORTANTE: No la cambies una vez creadas cuentas o no podrás desencriptar contraseñas antiguas.
# Fail-Fast: Si no hay llave definida en producción, el sistema se detendrá para evitar corrupción de contraseñas.
raw_key = os.getenv("SECRET_ENCRYPTION_KEY")

if not raw_key or not raw_key.strip():
    logger.critical("¡FAIL-FAST ACTIVADO! No se encontró la variable SECRET_ENCRYPTION_KEY en el archivo .env o está vacía. El sistema no puede arrancar por seguridad.")
    sys.exit(1)

ENCRYPTION_KEY_STR = raw_key.strip()

try:
    cipher_suite = Fernet(ENCRYPTION_KEY_STR.encode())
except ValueError:
    logger.critical("¡FAIL-FAST ACTIVADO! La llave SECRET_ENCRYPTION_KEY en tu .env es inválida o está mutilada. Debe ser una llave Fernet de base64 de 32 bytes.")
    sys.exit(1)

def encrypt_password(plain_password: str) -> str:
    """Encripta la contraseña de Moodle antes de guardarla en DB."""
    return cipher_suite.encrypt(plain_password.encode()).decode()

def decrypt_password(encrypted_password: str) -> str:
    """Desencripta la contraseña para enviarla a token.php si el token caduca."""
    return cipher_suite.decrypt(encrypted_password.encode()).decode()

def encrypt_token(token: str) -> str:
    """Cifra el token de Moodle antes de guardarlo en DB."""
    if not token:
        return token
    return cipher_suite.encrypt(token.encode()).decode()

def decrypt_token(encrypted_token: str) -> str:
    """Descifra el token. Si falla, asume texto plano (migración transparente)."""
    if not encrypted_token:
        return encrypted_token
    try:
        return cipher_suite.decrypt(encrypted_token.encode()).decode()
    except Exception:
        return encrypted_token  # Token viejo en texto plano

