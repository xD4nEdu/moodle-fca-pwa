# 🤖 Contexto Completo del Proyecto: Bot Notificador Moodle FCA UNAM

## 1. ¿Qué es?
Bot que monitorea Moodle de la FCA UNAM cada 60 segundos, detecta contenido nuevo (tareas, archivos, foros, mensajes, notificaciones) y envía **Push Notifications** al celular del alumno mediante una PWA.

## 2. Arquitectura (2 Servicios Separados)

```
┌─────────────────────┐       proxy /api/*        ┌──────────────────────┐
│   FRONTEND (PWA)    │ ──────────────────────────▶│   BACKEND (API+Bot)  │
│   Vercel (gratis)   │                            │   Fly.io (gratis)    │
│   React + Vite      │                            │   FastAPI + SQLite   │
│   Tailwind CSS      │                            │   Uvicorn (1 worker) │
│   vite-plugin-pwa   │                            │   asyncio background │
│                     │                            │   pywebpush (VAPID)  │
│   Región: auto      │                            │   Región: ord (Chicago)│
│   URL: moodle-fca-  │                            │   URL: moodle-fca-   │
│   pwa.vercel.app    │                            │   pwa.fly.dev        │
└─────────────────────┘                            └──────────────────────┘
```

### Flujo de datos
1. El alumno abre la PWA (Vercel) → se registra con usuario/contraseña de Moodle
2. Vercel hace proxy (`vercel.json`) de todas las rutas `/api/*` hacia `https://moodle-fca-pwa.fly.dev/api/*`
3. El backend guarda al usuario en SQLite (`/data/bot_fca.db` en volumen persistente de Fly.io)
4. Un `asyncio.create_task` corre `background_moodle_task()` que cada 60s consulta Moodle por cada usuario activo
5. Si detecta contenido nuevo → guarda en `NotificationHistory` y envía Web Push a todos los dispositivos del usuario

## 3. Estructura de Archivos Clave

```
D:\PROYECTO BOT FCA PWA\
├── app/
│   ├── pwa_server.py          # FastAPI principal (rutas API REST)
│   ├── bot/
│   │   └── task.py            # Bucle de scraping Moodle (background_moodle_task)
│   ├── core/
│   │   ├── config.py          # Variables centralizadas (VAPID keys, DB URL, API_KEY)
│   │   └── security.py        # Fernet: encrypt/decrypt contraseñas y tokens
│   ├── db/
│   │   ├── database.py        # SQLAlchemy engine, SessionLocal, init_db()
│   │   └── models.py          # Modelos: ClientUser, UserDevice, ProcessedItem, MutedCourse, NotificationHistory
│   └── services/
│       ├── moodle.py          # MoodleClient: wrapper async de la API WS de Moodle
│       └── email_monitor.py   # ⚠️ NO SE USA. Fue removido del arranque (start.sh)
├── frontend/
│   ├── src/
│   │   ├── Registration.jsx   # Pantalla principal de registro + panel de notificaciones
│   │   ├── AdminDashboard.jsx # Panel admin (listar usuarios, test push, borrar)
│   │   ├── api.js             # Helper: apiUrl() usa rutas relativas en prod, localhost en dev
│   │   ├── sw.js              # Service Worker: escucha push events, muestra notificación
│   │   └── components/
│   │       └── NotificationItem.jsx  # Componente de notificación expandible con [DETAILS]
│   ├── vercel.json            # Proxy: /api/* → https://moodle-fca-pwa.fly.dev/api/*
│   ├── vite.config.js         # VitePWA con injectManifest, srcDir: 'src', filename: 'sw.js'
│   └── public/
│       ├── icon-192x192.png
│       └── icon-512x512.png
├── Dockerfile                 # python:3.10-slim, pip install, chmod start.sh
├── fly.toml                   # Fly.io config (auto_stop=false, 256MB, volumen /data)
├── start.sh                   # Solo: uvicorn app.pwa_server:app --port ${PORT:-9000}
├── requirements.txt           # fastapi, uvicorn, sqlalchemy, pywebpush, cryptography, etc.
└── .env                       # VAPID keys + SECRET_ENCRYPTION_KEY (⚠️ NO commitear en público)
```

## 4. Variables de Entorno / Secretos

| Variable | Valor/Ubicación | Notas |
|---|---|---|
| `VAPID_PUBLIC_KEY` | `.env` y `config.py` fallback | Clave pública para Web Push. El frontend la obtiene vía `/api/vapid-public-key` |
| `VAPID_PRIVATE_KEY` | `.env` y `config.py` fallback | Clave privada para firmar pushes |
| `SECRET_ENCRYPTION_KEY` | `.env` | Llave Fernet para cifrar contraseñas y tokens en DB. **NUNCA cambiarla** o se corrompen cuentas existentes |
| `API_KEY` | Hardcoded `"1531"` en `config.py` | Se envía como `X-API-Key` header para rutas admin |
| `DATABASE_URL` | `fly.toml` env: `sqlite:////data/bot_fca.db` | En Fly.io usa volumen persistente `/data/`. Local: `sqlite:///./data/bot_fca.db` |

## 5. Modelos de Base de Datos (SQLAlchemy)

| Tabla | Columnas Clave | Propósito |
|---|---|---|
| `clients` | id, faculty, moodle_username, moodle_password (encrypted), moodle_token (encrypted), is_active | Usuarios registrados |
| `user_devices` | id, user_id (FK), device_name, push_subscription (JSON), last_used | Dispositivos para Web Push |
| `processed_items` | id, user_id (FK), course_id, item_type, item_id | Evita notificar lo mismo dos veces |
| `muted_courses` | id, user_id (FK), course_id | Cursos silenciados por el usuario |
| `notification_history` | id, user_id (FK), title, body, is_read, created_at (UTC) | Historial visible en la PWA |

## 6. Rutas API (pwa_server.py)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/users` | No | Registrar nuevo usuario |
| POST | `/api/subscribe` | No | Vincular dispositivo push |
| GET | `/api/users/{id}/status` | No | Estado + últimas 24h de notificaciones |
| GET | `/api/users/{id}/devices` | No | Listar dispositivos |
| DELETE | `/api/users/{id}/devices` | API_KEY | Borrar todos los dispositivos |
| GET | `/api/vapid-public-key` | No | Devuelve VAPID public key |
| GET | `/api/users` | API_KEY | Listar todos los usuarios (admin) |
| POST | `/api/users/{id}/toggle` | API_KEY | Activar/desactivar usuario |
| DELETE | `/api/users/{id}` | API_KEY | Eliminar usuario |
| GET/POST | `/api/users/{id}/test_push` | API_KEY | Enviar push de prueba |
| GET | `/api/notifications/{id}/read` | No | Marcar notificación como leída |

## 7. Lógica del Bot (task.py)

El bot corre como `asyncio.create_task` dentro del startup de FastAPI:
1. **Cada 60 segundos** consulta todos los `ClientUser` activos
2. Usa `asyncio.Semaphore(3)` para limitar concurrencia (protege Moodle y RAM)
3. Por cada usuario:
   - Obtiene/renueva token Moodle
   - Consulta cursos, contenidos, assignments, conversaciones, notificaciones
   - Compara contra `ProcessedItem` (ya procesados)
   - Si hay algo nuevo y **no es la primera sincronización** (para no bombardear al registrarse): genera mensaje con formato `"TÍTULO [DETAILS] DETALLES"`
4. Envía Web Push a todos los dispositivos del usuario con `pywebpush`
5. Guarda en `NotificationHistory` con `title` y `body` separados
6. Dispositivos con push fallido 410/404 se eliminan automáticamente

### Formato de mensajes
- **Contenido nuevo**: `*MATERIA* - Nombre del recurso [DETAILS] 📂 Apartado: X\n📝 Tipo: Tarea\n⏰ Avisado: 02:53 PM\n⏳ *VENCE:* 24/03/2026 23:59`
- **Mensaje directo**: `💬 Mensaje de Juan [DETAILS] texto del mensaje`
- **Notificación Moodle**: `🔔 Asunto [DETAILS] contenido completo`

### Zona horaria
- `created_at` en DB se guarda en **UTC** (`datetime.utcnow()`)
- Al enviar al frontend: se resta `timedelta(hours=6)` para mostrar hora CDMX
- En los detalles internos: se usa `timezone(timedelta(hours=-6))` directamente
- Formato 12 horas: `%I:%M %p`

## 8. Frontend PWA (Vercel)

- **React 18** + **Vite** + **Tailwind CSS** + **Framer Motion**
- **vite-plugin-pwa** con estrategia `injectManifest` → Service Worker en `src/sw.js`
- **Service Worker**: escucha evento `push`, parsea JSON (`{title, body, url}`), muestra `showNotification`
- **NotificationItem.jsx**: separa mensajes por el ancla `[DETAILS]` — parte antes = resumen visible, parte después = detalles expandibles al hacer click
- **Proxy de Vercel** (`vercel.json`): reescribe `/api/*` → Fly.io para evitar CORS

## 9. Deploy: Comandos Exactos

### Backend → Fly.io
```bash
# Desde D:\PROYECTO BOT FCA PWA
git add .
git commit -m "descripción del cambio"
git push origin main
fly deploy
```
- Se construye con Dockerfile, usa `start.sh` que solo ejecuta Uvicorn
- Logs en tiempo real: `fly logs`
- Estado: `fly status`

### Frontend → Vercel
```bash
# Desde D:\PROYECTO BOT FCA PWA\frontend
# Vercel está conectado al repo de GitHub, hace deploy automático con cada push a main
# O manualmente:
npx vercel --prod
```
- El directorio raíz de Vercel apunta a `frontend/`
- Build command: `vite build`
- Output: `dist/`

## 10. Configuración de Fly.io (fly.toml)

```toml
app = "moodle-fca-pwa"
primary_region = "ord"           # Chicago

[http_service]
  internal_port = 9000
  force_https = true
  auto_stop_machines = false     # Bot 24/7, nunca se duerme
  auto_start_machines = true
  min_machines_running = 1

[[vm]]
  memory = "256mb"               # Free tier
  cpu_kind = "shared"
  cpus = 1

[mounts]
  source = "moodle_data"         # Volumen persistente (3GB gratis)
  destination = "/data"

[env]
  DATABASE_URL = "sqlite:////data/bot_fca.db"
```

## 11. Facultades Moodle Soportadas

| Clave | URL |
|---|---|
| `administracion` | https://administracion.fca.unam.mx |
| `contaduria` | https://contaduria.fca.unam.mx |
| `informatica` | https://informatica.fca.unam.mx |
| `negociosinternacionales` | https://negociosinternacionales.fca.unam.mx |
| `empresariales` | https://empresariales.fca.unam.mx |

## 12. Historial de Problemas Resueltos

| Problema | Causa | Solución |
|---|---|---|
| Notificaciones no llegaban al iPhone | Service Worker viejo cacheado | Limpiar datos del sitio + reinstalar PWA desde pantalla inicio |
| Push devolvía 200 OK pero no se recibía | La primera sync bloqueaba envíos (`is_first_sync`) | Eliminada la condición, ahora envía si hay `VAPID_PRIVATE_KEY` y mensajes |
| Circular imports | `pwa_server.py` y `task.py` importaban mutuamente | Creación de `app/core/config.py` centralizado |
| Hora incorrecta en notificaciones | DB guarda UTC, se mostraba sin convertir | Se resta `timedelta(hours=6)` al formatear para la respuesta JSON |
| Formato "14:53 PM" | `%H` (24h) mezclado con `%p` (AM/PM) | Cambiado a `%I:%M %p` (12h + AM/PM) |
| RAM excesiva en Fly.io | `email_monitor.py` corriendo vacío en background | Eliminado de `start.sh` (ahorra ~45MB RAM) |
| Misma info en resumen y detalles de la PWA | API solo enviaba `body` sin `title` | Cambiado a `f"{n.title} [DETAILS] {n.body}"` |

## 13. Capacidad Estimada (Free Tier)

- **~150-200 usuarios activos** sin degradación
- **~300 usuarios** con latencia de 2-3 min en las notificaciones
- **RAM**: 256MB (pico estimado ~180MB con 300 usuarios)
- **Disco**: 3GB gratis (suficiente para ~4,000 usuarios)
- **Red**: 160GB outbound gratis/mes (imposible de agotar con texto push)

## 14. Notas Importantes para el Agente

1. **Nunca cambiar `SECRET_ENCRYPTION_KEY`** — corrompe todas las contraseñas guardadas
2. **Nunca subir `.env` a GitHub público** — contiene claves VAPID y de cifrado
3. El `vercel.json` del frontend es **crítico**: sin él, las llamadas API fallan por CORS
4. iOS requiere **PWA instalada en pantalla de inicio** (no funciona desde Safari normal) y **iOS 16.4+**
5. La tabla `ProcessedItem` es el "cerebro" que evita spam — borrarla causa re-notificación de todo
6. El semáforo `asyncio.Semaphore(3)` protege contra ban de Moodle UNAM — no subirlo
7. El proyecto originalmente corría en **Termux** (Android) antes de migrar a Fly.io
8. El repo Git está en: `https://github.com/xD4nEdu/moodle-fca-pwa.git`, branch `main`

## 15. Sistema de Diseño (UI/UX) y Google Stitch

La interfaz de usuario ha sido rediseñada profesionalmente utilizando **Google Stitch MCP**. 

### Proyecto en Google Stitch
- **Nombre:** Moodle FCA PWA Neo-Clean
- **ID del Proyecto:** `4636479403027147075`
- **Design System:** "The Academic Curator"

### Características del "Neo-Clean" Vercel Style implementado:
- **Estructura Bento Grid:** Se abandonaron las "tarjetas verticales clásicas" por mosaicos asimétricos y densos que facilitan leer datos en menos de un segundo (Dashboard de Estudiante).
- **Adiós a los 1px borders convencionales:** Se eliminaron las sombras profundas y los gradientes intrusivos. Los bordes se manejan con opacidades sutiles (`border-black/5` o `border-white/5`).
- **Estados y Badges ("Pills"):** Las tablas de administración ya no usan botones anchos, sino etiquetas pequeñas (`px-2 py-0.5 text-[10px]`) con colores semánticos puros como los usados por Stripe/Vercel (ej. esmeralda para activo, slate para inactivo).
- **Variantes de UI:** Las pruebas de estilo "Dark Mode Puro" (Charcoal oscuro, `#0D0D0D`) se han dejado como variantes pre-renderizadas dentro del proyecto de Google Stitch para futura evaluación o importación directa sin afectar la base de código actual.
