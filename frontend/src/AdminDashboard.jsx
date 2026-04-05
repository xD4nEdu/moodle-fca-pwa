import React, { useState, useEffect } from 'react';
import ThemeToggle from './ThemeToggle';
import { apiUrl, adminHeaders } from './api';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');

  const fetchUsers = async () => {
    // Definir headers directamente para evitar problemas de importación
    const headers = { 
      "X-API-Key": "1531",
      "Authorization": "Bearer 1531",
      "Content-Type": "application/json"
    };
    
    console.log("[DEBUG] Fetching users with headers:", headers);
    console.log("[DEBUG] Target URL:", apiUrl('/api/users'));

    try {
      const res = await fetch(apiUrl('/api/users'), { headers });
      if (!res.ok) {
        const errText = await res.text();
        console.error("[DEBUG] Error response:", errText);
        throw new Error('Error al obtener carga de usuarios');
      }
      const data = await res.json();
      setUsers(data.users);
      setError(null);
    } catch (e) {
      console.error("[DEBUG] Fetch failed:", e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchUsers();
  }, [isAuthenticated]);

  const handleToggle = async (userId) => {
    const headers = { "X-API-Key": "1531", "Authorization": "Bearer 1531" };
    try {
      const res = await fetch(apiUrl(`/api/users/${userId}/toggle`), { method: 'GET', headers });
      if (res.ok) fetchUsers();
    } catch (e) {
      alert("Error de red: " + e.message);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("¿Seguro que deseas eliminar este usuario?")) return;
    const headers = { "X-API-Key": "1531", "Authorization": "Bearer 1531" };
    try {
      const res = await fetch(apiUrl(`/api/users/${userId}`), { method: 'DELETE', headers });
      if (res.ok) fetchUsers();
    } catch (e) {
      alert("Error: " + e.message);
    }
  };

  const handleTestPush = async (userId) => {
    const headers = { "X-API-Key": "1531", "Authorization": "Bearer 1531" };
    try {
      const res = await fetch(apiUrl(`/api/users/${userId}/test_push`), { method: 'GET', headers });
      if (!res.ok) throw new Error('Error al mandar la prueba Push (HTTP Falló)');
      
      const data = await res.json();
      if (data.status === 'error') {
        throw new Error(data.message || (data.errors && data.errors[0]) || 'Error desconocido del servidor');
      }
      
      let msg = '¡Notificación de prueba lanzada!';
      if (data.successes > 0) msg += `\nEntregada a ${data.successes} dispositivo(s).`;
      if (data.errors && data.errors.length > 0) msg += `\nErrores: ${data.errors.join(', ')}`;
      
      alert(msg);
    } catch (e) {
      alert("Error en prueba Push:\n" + e.message);
    }
  };

  const handleBroadcast = async () => {
    if (!window.confirm("¿Seguro que deseas enviar un aviso global a todos los dispositivos?")) return;
    
    const headers = { "X-API-Key": "1531", "Authorization": "Bearer 1531", "Content-Type": "application/json" };
    try {
      const res = await fetch(apiUrl('/api/admin/broadcast'), { method: 'POST', headers });
      if (!res.ok) throw new Error('Error al conectar con la API de broadcast');
      const data = await res.json();
      alert(`¡Aviso general enviado exitosamente!\n\nEntregados: ${data.successes} dispositivo(s)\nErrores al pushear: ${data.errors || 0}`);
    } catch (e) {
      alert("Error en el envío general:\n" + e.message);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 font-outfit text-slate-800 dark:text-slate-200 relative">
        <div className="absolute top-6 right-6"><ThemeToggle /></div>
        <div className="bg-white/90 dark:bg-fca-charcoal/40 p-8 rounded-3xl border border-fca-gray/30 dark:border-fca-charcoal/80 max-w-sm w-full shadow-2xl backdrop-blur-xl text-center">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-fca-orange to-fca-orangeLight dark:from-fca-orangeLight dark:to-fca-yellow bg-clip-text text-transparent mb-6">Acceso Restringido</h2>
          <input 
            type="password" 
            placeholder="PIN" 
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (pin === '1531') setIsAuthenticated(true);
                else { alert('PIN incorrecto'); setPin(''); }
              }
            }}
            className="w-full bg-slate-50 dark:bg-fca-dark/60 border border-fca-gray/30 dark:border-fca-charcoal text-slate-800 dark:text-slate-100 rounded-xl px-4 py-4 text-center tracking-[0.7em] text-2xl mb-4 focus:ring-2 focus:ring-fca-orange focus:border-fca-orange outline-none"
          />
          <button 
            onClick={() => {
              if (pin === '1531') setIsAuthenticated(true);
              else { alert('PIN incorrecto'); setPin(''); }
            }}
            className="w-full py-4 bg-gradient-to-r from-fca-orange to-fca-orangeLight hover:from-fca-orangeShadow hover:to-fca-orange dark:from-fca-orange dark:to-fca-orangeLight dark:hover:from-fca-orangeShadow dark:hover:to-fca-orange text-white rounded-xl font-bold shadow-lg transition-all"
          >
            Entrar al Panel
          </button>
          <button onClick={() => window.location.href = '/'} className="mt-4 text-sm text-slate-500 dark:text-fca-gray hover:text-fca-orange dark:hover:text-fca-orangeLight transition-colors">
            Volver a Registro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-10 font-outfit relative">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-end mb-8 border-b border-slate-200 dark:border-white/5 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Panel de Control</h1>
            <p className="text-slate-500 text-sm mt-1">Administración de Usuarios Moodle PWA</p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <button onClick={handleBroadcast} className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-black font-semibold text-[11px] transition-all hover:bg-slate-800 dark:hover:bg-slate-100 flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-1 dark:focus:ring-offset-black">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path></svg>
              Aviso general
            </button>
            <ThemeToggle />
            <button onClick={() => window.location.href = '/'} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/5 font-semibold text-[11px] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
              Volver
            </button>
          </div>
        </div>

        {error && <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/50 text-red-600 dark:text-red-400 p-4 rounded-xl mb-6">{error}</div>}

        {loading ? (
          <div className="text-center text-slate-400 py-10 text-sm">Cargando usuarios...</div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                    <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-semibold text-slate-500">ID</th>
                    <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-semibold text-slate-500">Carrera</th>
                    <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-semibold text-slate-500">No. Cuenta</th>
                    <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-semibold text-slate-500">Estado</th>
                    <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-semibold text-slate-500">Push</th>
                    <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-semibold text-slate-500 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-slate-500">No hay usuarios registrados aún.</td>
                    </tr>
                  ) : users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4 text-slate-500 dark:text-slate-400 font-mono text-xs">#{u.id}</td>
                      <td className="px-5 py-4 capitalize font-medium text-slate-800 dark:text-slate-200">{u.faculty}</td>
                      <td className="px-5 py-4 text-slate-800 dark:text-slate-200 font-medium">{u.moodle_username}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${u.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400'}`}>
                          {u.is_active ? 'ACTIVO' : 'PAUSADO'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                         {u.device_count > 0 ? (
                            <span className="text-slate-900 dark:text-white flex items-center gap-1.5 font-medium text-xs">
                              <svg className="w-3.5 h-3.5 text-slate-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"></path></svg>
                              Sí ({u.device_count})
                            </span>
                         ) : (
                            <span className="text-slate-400 dark:text-slate-500 text-xs">No</span>
                         )}
                      </td>
                      <td className="px-5 py-4">
                         <div className="flex justify-end gap-2">
                            <button onClick={() => handleTestPush(u.id)} className="px-3 py-1.5 bg-fca-orange/10 hover:bg-fca-orange/20 text-fca-orange border border-fca-orange/30 dark:bg-fca-orange/10 dark:hover:bg-fca-orange/20 dark:text-fca-orangeLight dark:border-fca-orange/30 rounded-lg text-xs font-bold transition-all">
                              Probar
                            </button>
                            <button onClick={() => handleToggle(u.id)} className="px-3 py-1.5 bg-fca-yellow/10 hover:bg-fca-yellow/20 text-fca-orangeShadow border border-fca-yellow/30 dark:bg-fca-yellow/10 dark:hover:bg-fca-yellow/20 dark:text-fca-yellow dark:border-fca-yellow/30 rounded-lg text-xs font-bold transition-all">
                              {u.is_active ? 'Pausar' : 'Activar'}
                            </button>
                            <button onClick={() => handleDelete(u.id)} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 dark:bg-red-500/20 dark:hover:bg-red-500/30 dark:text-red-400 dark:border-red-500/30 rounded-lg text-xs font-bold transition-all">
                              Borrar
                            </button>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
