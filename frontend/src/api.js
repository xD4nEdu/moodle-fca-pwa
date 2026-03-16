// Base URL del Backend API
// En desarrollo local: vacío (usa proxy de Vite o misma ruta)
// En producción (Vercel): apunta al túnel Cloudflare del backend en Termux
const API_BASE = import.meta.env.VITE_API_URL || '';

export function apiUrl(path) {
  return `${API_BASE}${path}`;
}
