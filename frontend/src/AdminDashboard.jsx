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
      const res = await fetch(apiUrl(`/api/users/${userId}/toggle`), { method: 'POST', headers });
      if (res.ok) fetchUsers();
    } catch (e) {
      alert("Error: " + e.message);
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
      const res = await fetch(apiUrl(`/api/users/${userId}/test_push`), { method: 'POST', headers });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Error en Push');
      }
      alert('¡Notificación enviada!');
    } catch (e) {
      alert("Error: " + e.message);
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
        <div className="flex justify-between items-end mb-8 border-b border-fca-gray/30 dark:border-fca-charcoal pb-4">
          <div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-fca-orange to-fca-orangeLight dark:from-fca-orangeLight dark:to-fca-yellow bg-clip-text text-transparent drop-shadow-sm">Panel de Control</h1>
            <p className="text-slate-500 dark:text-fca-gray mt-2">Administración de Usuarios Moodle PWA</p>
          </div>
          <div className="flex gap-3 items-center">
            <ThemeToggle />
            <button onClick={() => window.location.href = '/'} className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-fca-gray/30 dark:bg-fca-dark/80 dark:hover:bg-fca-dark dark:border-fca-charcoal transition-all font-semibold text-sm text-slate-700 dark:text-slate-200">
              Volver a Registro
            </button>
          </div>
        </div>

        {error && <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/50 text-red-600 dark:text-red-400 p-4 rounded-xl mb-6">{error}</div>}

        {loading ? (
          <div className="text-center text-slate-500 dark:text-fca-gray py-10">Cargando usuarios...</div>
        ) : (
          <div className="bg-white/80 dark:bg-fca-charcoal/30 backdrop-blur-xl border border-fca-gray/30 dark:border-fca-charcoal/80 rounded-2xl overflow-hidden shadow-xl dark:shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-fca-dark/50 text-slate-600 dark:text-fca-gray text-sm uppercase tracking-wider">
                    <th className="p-5 font-semibold">ID</th>
                    <th className="p-5 font-semibold">Facultad</th>
                    <th className="p-5 font-semibold">No. Cuenta</th>
                    <th className="p-5 font-semibold">Estado</th>
                    <th className="p-5 font-semibold">Push Vinculado</th>
                    <th className="p-5 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fca-gray/20 dark:divide-fca-charcoal/50">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-slate-500 dark:text-fca-gray">No hay usuarios registrados aún.</td>
                    </tr>
                  ) : users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-fca-dark/40 transition-colors">
                      <td className="p-5 text-slate-500 dark:text-fca-gray font-mono">#{u.id}</td>
                      <td className="p-5 capitalize font-medium text-slate-800 dark:text-slate-200">{u.faculty}</td>
                      <td className="p-5 text-slate-800 dark:text-slate-200">{u.moodle_username}</td>
                      <td className="p-5">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${u.is_active ? 'bg-fca-yellow/20 text-fca-orangeShadow dark:bg-fca-yellow/10 dark:text-fca-yellow' : 'bg-fca-charcoal/10 text-fca-charcoal dark:bg-fca-charcoal/30 dark:text-fca-gray'}`}>
                          {u.is_active ? 'ACTIVO' : 'PAUSADO'}
                        </span>
                      </td>
                      <td className="p-5">
                         {u.has_push ? (
                            <span className="text-fca-orange dark:text-fca-orangeLight flex items-center gap-1.5 font-medium text-sm">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"></path></svg>
                              Sí
                            </span>
                         ) : (
                            <span className="text-slate-400 dark:text-fca-gray text-sm">No</span>
                         )}
                      </td>
                      <td className="p-5">
                         <div className="flex justify-end gap-2">
                            {u.has_push && (
                              <button onClick={() => handleTestPush(u.id)} className="px-3 py-1.5 bg-fca-orange/10 hover:bg-fca-orange/20 text-fca-orange border border-fca-orange/30 dark:bg-fca-orange/10 dark:hover:bg-fca-orange/20 dark:text-fca-orangeLight dark:border-fca-orange/30 rounded-lg text-xs font-bold transition-all">
                                Probar
                              </button>
                            )}
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
