// Base URL del Backend API
// Usamos rutas relativas para activar el proxy de Vercel (vercel.json)
// Esto evita errores de CORS y problemas con los túneles de Cloudflare.

export function apiUrl(path) {
  // En desarrollo local (localhost), usamos la URL completa si es necesario
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return `http://localhost:8000${path}`;
  }
  // En producción (Vercel), DEBEMOS usar la ruta relativa para el proxy
  return path;
}

// Header de autenticación para endpoints admin
export function adminHeaders() {
  return { 
    "X-API-Key": "1531",
    "Authorization": "Bearer 1531",
    "Content-Type": "application/json"
  };
}
