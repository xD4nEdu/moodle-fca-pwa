import os
import base64
import ecdsa

def generate_vapid_keys():
    private_key = ecdsa.SigningKey.generate(curve=ecdsa.NIST256p)
    public_key = private_key.get_verifying_key()

    # Formato crudo en Base64 URL Safe (VAPID format)
    raw_pub = b"\x04" + public_key.to_string()
    
    vapid_private = base64.urlsafe_b64encode(private_key.to_string()).decode('utf-8').strip("=")
    vapid_public = base64.urlsafe_b64encode(raw_pub).decode('utf-8').strip("=")

    print("=== VAPID KEYS ===")
    print(f"VAPID_PUBLIC_KEY={vapid_public}")
    print(f"VAPID_PRIVATE_KEY={vapid_private}")
    print("==================")
    print("Guarda estos valores en tu entorno (.env) o en el backend.")

if __name__ == "__main__":
    generate_vapid_keys()
