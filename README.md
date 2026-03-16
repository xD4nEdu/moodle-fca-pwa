# Moodle FCA Notifier - PWA & Web Push Bot

Este es un bot diseñado para revisar la plataforma Moodle de la FCA UNAM (Administración, Contaduría, e Informática) cada minuto y notificar a los usuarios en tiempo real a través de **Notificaciones Nativas Web Push**.

Cuenta con una **Progressive Web App (PWA)** desarrollada en React + Vite, y un Backend asíncrono en FastAPI.

## Arquitectura del Proyecto
- **Backend (Python 3.10+):** FastAPI, SQLAlchemy (SQLite), PyWebPush (Criptografía VAPID). Se encarga del scraping continuo (`background_moodle_task`) y del envío de notificaciones.
- **Frontend (React + Vite):** Interfaz PWA instalable en iOS/Android/PC. Implementa `vite-plugin-pwa` y Service Workers para recibir los pushes en segundo plano. Módulo de Registro y Dashboard de Administración protegidos. Soporte Dark/Light mode con Tailwind CSS.
- **Túnel Público:** Utiliza Cloudflare Tunnels (`cloudflared`) para exponer el puerto local al internet de forma segura con encriptación HTTPS (requisito estricto para Web Push y PWA).

## Requisitos Previos (Entorno de Desarrollo en PC)
1. Instalar dependencias de Python:
   ```bash
   pip install -r requirements.txt
   ```
2. Instalar dependencias de Node.js (Frontend):
   ```bash
   cd frontend
   npm install
   ```
3. Generar las llaves VAPID (Para Notificaciones Push):
   - Ejecuta `python generate_vapid.py` en la raíz del proyecto.
   - Esto creará automáticamente un archivo `.env` con tus llaves Públicas, Privadas y el Secreto de Encriptación.

## Iniciar el Entorno de Desarrollo
Para arrancar el todo el sistema en tu PC, necesitas levantar tres servicios en terminales independientes:

**Terminal 1 (Backend FastAPI):**
```bash
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

**Terminal 2 (Frontend React):**
```bash
cd frontend
npm run dev
```

**Terminal 3 (Cloudflare Tunnel público):**
```bash
python run_tunnel.py
```
*(El enlace público HTTPS se guardará automáticamente en el archivo `mi_link_publico.txt`)*

## Para Producción
Si deseas subir el frontend a una plataforma como Vercel o Netlify:
1. Asegúrate de configurar la ruta del backend en tu código de React o usar el Tunnel de Cloudflare como ruta estática en la nube.
2. Compila el frontend usando:
   ```bash
   cd frontend
   npm run build
   ```

El backend debe permanecer siempre ejecutándose (ya sea en un VPS, un celular con Termux, o tu PC local) para que el ciclo de scraping hacia Moodle no se interrumpa.
