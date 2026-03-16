import subprocess
import re
import sys
import threading
import time

def run():
    print("Iniciando tu servidor en internet de forma segura...")
    # Usar 127.0.0.1 y protocolo http2 previene freeze sockets en Win/Cloudflare
    p = subprocess.Popen(
        [r"cloudflared.exe", "tunnel", "--protocol", "http2", "--url", "http://192.168.0.111:8000"],
        stderr=subprocess.PIPE,
        stdout=subprocess.PIPE,
        text=True,
        encoding='utf-8',
        errors='replace'
    )
    
    url = None
    
    for line in iter(p.stderr.readline, ''):
        match = re.search(r'https://[a-zA-Z0-9-]+\.trycloudflare\.com', line)
        if match:
            url = match.group(0)
            break
            
    if url:
        with open('mi_link_publico.txt', 'w', encoding='utf-8') as f:
            f.write(url)
            
        print("\n" + "="*50)
        print("✅ ¡LISTO! Tu link público ha sido generado.")
        print("Abre esta dirección desde el navegador (Chrome) de tu celular:")
        print(f"\n👉 {url} 👈\n")
        print("="*50)
    else:
        print("Hubo un problema detectando el link. Intenta de nuevo.")

    p.wait()

if __name__ == "__main__":
    run()
