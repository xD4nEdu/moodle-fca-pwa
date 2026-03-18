import os
import time
import re
import requests
from dotenv import load_dotenv

# Configuración
# Cargar .env desde la ruta absoluta para PM2
ENV_PATH = os.path.expanduser('~/moodle-bot/.env')
load_dotenv(ENV_PATH)

LOG_FILE = os.path.expanduser('~/moodle-bot/tunnel.log')
LAST_URL_FILE = os.path.expanduser('~/moodle-bot/last_url.txt')
RESEND_API_KEY = os.getenv('RESEND_API_KEY')
TARGET_EMAIL = 'alanisraelg@comunidad.unam.mx'

def send_email(new_url):
    print(f'Enviando email de cambio de URL: {new_url}')
    if not RESEND_API_KEY:
        print('❌ Error: RESEND_API_KEY no configurada. No se pudo enviar el correo.')
        return
        
    url = 'https://api.resend.com/emails'
    headers = {
        'Authorization': f'Bearer {RESEND_API_KEY}',
        'Content-Type': 'application/json'
    }
    data = {
        'from': 'Moodle Bot <onboarding@resend.dev>',
        'to': TARGET_EMAIL,
        'subject': '⚠️ ¡El link de tu API ha cambiado!',
        'html': f'''
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h1 style="color: #d32f2f;">⚠️ Link de API Actualizado</h1>
            <p>Se ha detectado un cambio en el link de tu bot.</p>
            <p style="background: #f5f5f5; padding: 15px; border-radius: 5px; font-family: monospace;">
                <strong>Nuevo Link:</strong> <a href="{new_url}">{new_url}</a>
            </p>
            <p><strong>Acción requerida:</strong></p>
            <ol>
                <li>Actualiza la variable <code>VITE_API_URL</code> en Vercel.</li>
                <li>Realiza un <b>Redeploy</b> en el dashboard de Vercel.</li>
            </ol>
            <hr>
            <p style="font-size: 0.8em; color: #666;">Este es un mensaje automático del monitor de túneles.</p>
        </div>
        '''
    }
    try:
        response = requests.post(url, headers=headers, json=data, timeout=10)
        if response.status_code in [200, 201]:
            print('✅ Email enviado con éxito.')
        else:
            print(f'❌ Error al enviar email (Status {response.status_code}): {response.text}')
    except Exception as e:
        print(f'❌ Error de red al enviar email: {e}')

def get_last_url():
    if os.path.exists(LAST_URL_FILE):
        try:
            with open(LAST_URL_FILE, 'r') as f:
                return f.read().strip()
        except Exception:
            return None
    return None

def save_last_url(url):
    try:
        with open(LAST_URL_FILE, 'w') as f:
            f.write(url)
    except Exception as e:
        print(f'❌ Error guardando last_url: {e}')

def monitor():
    print('--- INICIANDO MONITOR DE TÚNEL ---')
    print(f'Log file: {LOG_FILE}')
    print(f'Target Email: {TARGET_EMAIL}')
    
    if not RESEND_API_KEY:
        print('⚠️ ADVERTENCIA: RESEND_API_KEY no detectada.')
    else:
        print(f'API Key detectada: {RESEND_API_KEY[:6]}...')

    last_url = get_last_url()
    print(f'Último URL registrado: {last_url}')

    while True:
        if os.path.exists(LOG_FILE):
            try:
                # Abrir en binario para evitar errores de encoding
                with open(LOG_FILE, 'rb') as f:
                    # Ir al final y leer los últimos 16KB
                    f.seek(0, 2)
                    size = f.tell()
                    f.seek(max(0, size - 16384))
                    raw_content = f.read()
                    content = raw_content.decode('utf-8', errors='ignore')
                    
                    # Buscar el link de Cloudflare
                    links = re.findall(r'https://[a-zA-Z0-9-]+\.trycloudflare\.com', content)
                    if links:
                        current_url = links[-1]
                        if current_url != last_url:
                            print(f'🔔 ¡CAMBIO! {last_url} -> {current_url}')
                            if last_url is not None:
                                send_email(current_url)
                            else:
                                print('Primer registro (o tras borrado), guardando sin enviar email.')
                            
                            last_url = current_url
                            save_last_url(current_url)
            except Exception as e:
                print(f'Error en loop de monitoreo: {e}')
        else:
            print(f'Esperando a que aparezca {LOG_FILE}...')
        
        time.sleep(30)

if __name__ == '__main__':
    monitor()
