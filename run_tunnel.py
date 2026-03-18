import subprocess
import re
import sys
import os

def run():
    print('Iniciando tu servidor en internet de forma segura...')
    # Prioridad: variable de entorno, argumento CLI, o default
    tunnel_target = os.environ.get('TUNNEL_TARGET', sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8000')
    
    # Detectar binario correcto según el sistema
    cmd = 'cloudflared' if os.name != 'nt' else 'cloudflared.exe'
    
    print(f'Usando binario: {cmd} hacia {tunnel_target}')
    
    p = subprocess.Popen(
        [cmd, 'tunnel', '--protocol', 'http2', '--url', tunnel_target],
        stderr=subprocess.PIPE,
        stdout=subprocess.PIPE,
        text=True,
        encoding='utf-8',
        errors='replace'
    )
    
    url = None
    print('Esperando al link público...')
    
    try:
        # Cloudflare suele escribir el link en stderr
        while True:
            line = p.stderr.readline()
            if not line:
                break
            
            # Mostrar la línea para que PM2 la capture
            sys.stdout.write(line)
            sys.stdout.flush()
            
            match = re.search(r'https://[a-zA-Z0-9-]+\.trycloudflare\.com', line)
            if match:
                url = match.group(0)
                # Guardar el link público en un archivo para referencia rápida
                with open(os.path.expanduser('~/moodle-bot/mi_link_publico.txt'), 'w', encoding='utf-8') as f:
                    f.write(url)
                print(f'\n✅ LINK DETECTADO: {url}\n')
                # No hacemos break para que el proceso siga vivo y el túnel abierto
    except KeyboardInterrupt:
        p.terminate()
    except Exception as e:
        print(f'Error en el túnel: {e}')
    finally:
        p.wait()

if __name__ == '__main__':
    run()
