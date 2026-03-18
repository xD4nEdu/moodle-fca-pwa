# 🎓 Guía Maestra: Notificaciones Moodle FCA PWA

Esta documentación detalla el funcionamiento, mantenimiento y resolución de problemas de tu sistema de notificaciones.

---

## 🏗️ Arquitectura del Sistema

El proyecto está dividido en tres pilares que trabajan en conjunto:

1.  **Frontend (PWA en Vercel)**: La aplicación que ven los usuarios. Está optimizada para móviles y instalada como App nativa.
2.  **Backend (Termux en Android)**: El "cerebro" que vive en tu celular. Revisa Moodle cada pocos minutos y dispara las notificaciones Push.
3.  **Túnel de Enlace (Cloudflare)**: El puente que permite que el Frontend en Vercel hable con el Backend en tu celular de forma segura.

---

## ♾️ Sistema de Supervivencia (Inmortalidad)

Hemos configurado **PM2** en Termux para asegurar que el bot nunca muera. Hay 3 procesos críticos corriendo:

*   `fca-backend`: El servidor API.
*   `fca-tunnel`: El generador del link público.
*   `fca-monitor`: El vigía que te envía un correo si el link cambia.

---

## 🛠️ Guía de Mantenimiento

### 1. Si reinicias el celular o cierras Termux:
1.  Abre la aplicación **Termux**.
2.  Automáticamente se ejecutará el comando de resurrección.
3.  Verifica que todo esté encendido escribiendo:
    ```bash
    pm2 list
    ```
    *Todos los procesos deberían decir `online` en verde.*

### 2. Si recibes un correo de "Nueva URL detectada":
Esto pasa si el internet fluctuó o el túnel se reinició. Solo sigue estos pasos:
1.  Abre tu correo institucional (`alanisraelg@comunidad.unam.mx`).
2.  Copia el nuevo link (ejemplo: `https://palabra-aleatoria.trycloudflare.com`).
3.  Entra a tu [Dashboard de Vercel](https://vercel.com/dashboard).
4.  Ve a **Settings** -> **Environment Variables**.
5.  Actualiza el valor de `VITE_API_URL` con el nuevo link.
6.  Ve a la pestaña **Deployments** y selecciona el último -> Clic en los 3 puntos -> **Redeploy**.

---

## 🚨 Resolución de Problemas (Troubleshooting)

| Problema | Causa Probable | Solución |
| :--- | :--- | :--- |
| La web dice "Error al conectar" | El link en Vercel es viejo o el bot está apagado. | Revisa tu correo por un nuevo link y actualiza Vercel. |
| No llegan notificaciones Push | El usuario no dio permiso o el backend falló. | Entra al `/admin` y dale a "Probar Push" en tu usuario. |
| No recibo el correo de aviso | La API Key de Resend expiró o el correo es incorrecto. | Revisa los logs: `pm2 logs fca-monitor` para ver el error. |
| Termux se cierra solo | Android está matando la app para ahorrar batería. | Mantén presionada la notificación de Termux y dale a "Keep CPU awake" o desactiva el ahorro de batería para Termux. |

---

## ⌨️ Comandos Útiles en Termux

*   **Ver estatus**: `pm2 list` (Muestra si están vivos).
*   **Ver qué está haciendo el bot**: `pm2 logs fca-backend` (Verás las revisiones de Moodle).
*   **Reiniciar todo**: `pm2 restart all`.
*   **Detener todo**: `pm2 stop all`.
*   **Ver errores del correo**: `pm2 logs fca-monitor`.

---

## 🔒 Acceso Administrativo
Para gestionar usuarios o enviar pruebas manuales:
- **URL**: `https://tu-pwa.vercel.app/admin`
- **PIN de Acceso**: `1531`

---
*Documentación generada el 16 de Marzo de 2026 para el bot de Alan Israel.*
