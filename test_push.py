import os
from pywebpush import webpush
from dotenv import load_dotenv
import json

load_dotenv()

VAPID_PRIVATE_KEY = os.environ.get("VAPID_PRIVATE_KEY", "")
VAPID_CLAIMS = {
    "sub": "mailto:botadmin@fca.unam.mx"
}

sub_info = json.loads('{"endpoint": "https://fcm.googleapis.com/fcm/send/foo", "expirationTime": null, "keys": {"p256dh": "dummy", "auth": "dummy"}}')
# Actually, let's just use the real one from DB
from app.db.database import SessionLocal
from app.db.models import ClientUser
user = SessionLocal().query(ClientUser).first()
if user and user.push_subscription:
    sub_info = json.loads(user.push_subscription)
    payload = json.dumps({"title": "Test", "body": "123", "url": "/"})
    try:
        webpush(
            subscription_info=sub_info,
            data=payload,
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims=VAPID_CLAIMS
        )
        print("Success")
    except Exception as e:
        if hasattr(e, 'response'):
            print(e.response.text)
        else:
            print(e)
