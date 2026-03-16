import React, { useState, useEffect } from 'react';
import ThemeToggle from './ThemeToggle';
import { apiUrl } from './api';

// Helpers
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.userAgent.includes("Mac") && "ontouchend" in document);
};

const isAndroid = () => {
  return /android/i.test(navigator.userAgent);
};

const isStandalone = () => {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
};

// VAPID helper conversion
function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function Registration() {
  const [standalone, setStandalone] = useState(true);
  const [loading, setLoading] = useState(false);
  const [faculty, setFaculty] = useState('contaduria');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [hasAccount, setHasAccount] = useState(false);
  const [accountStatus, setAccountStatus] = useState(null);
  
  useEffect(() => {
    setStandalone(isStandalone());
    const storedUserId = localStorage.getItem('moodle_pwa_user_id');
    if (storedUserId) {
      setHasAccount(true);
      fetch(apiUrl(`/api/users/${storedUserId}/status`))
        .then(res => res.json())
        .then(data => setAccountStatus(data))
        .catch(err => console.error(err));
    }
  }, []);

  if (!standalone) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center relative">
        <div className="absolute top-6 right-6"><ThemeToggle /></div>
        <div className="bg-white/90 dark:bg-fca-charcoal/40 p-8 rounded-2xl border border-fca-gray/30 dark:border-fca-charcoal/80 max-w-sm w-full shadow-2xl backdrop-blur-md">
          <div className="bg-fca-orange/10 dark:bg-fca-orange/20 text-fca-orange dark:text-fca-orangeLight p-4 rounded-full w-24 h-24 mx-auto flex items-center justify-center mb-6 shadow-inner">
             {/* Bell Icon */}
            <svg className="w-12 h-12 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-fca-orange to-fca-orangeLight dark:from-fca-orangeLight dark:to-fca-yellow bg-clip-text text-transparent mb-4">
            Instala la App
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mb-6 text-sm">
            Para recibir notificaciones nativas de Moodle, debes instalar esta aplicación en tu pantalla de inicio.
          </p>
          
          {isIOS() ? (
             <div className="text-left bg-slate-100 dark:bg-fca-dark/50 p-4 rounded-xl text-sm text-slate-600 dark:text-slate-300 space-y-3 shadow-inner border border-transparent dark:border-fca-charcoal">
                <p>1. Toca el botón <strong>Compartir</strong> <span className="inline-block px-2 py-1 bg-slate-200 dark:bg-fca-charcoal rounded mx-1 text-xs text-slate-700 dark:text-slate-200">↑</span> en la barra inferior de Safari.</p>
                <p>2. Desliza hacia abajo y selecciona <strong>Añadir a la pantalla de inicio</strong> <span className="inline-block px-2 py-1 bg-slate-200 dark:bg-fca-charcoal rounded mx-1 text-xs text-slate-700 dark:text-slate-200">+</span>.</p>
                <p>3. Abre la app desde tu pantalla de inicio para continuar.</p>
             </div>
          ) : isAndroid() ? (
             <div className="text-left bg-slate-100 dark:bg-fca-dark/50 p-4 rounded-xl text-sm text-slate-600 dark:text-slate-300 space-y-3 shadow-inner border border-transparent dark:border-fca-charcoal">
                <p>1. Toca el menú <strong>⋮</strong> en la esquina superior derecha de tu navegador.</p>
                <p>2. Selecciona <strong>Añadir a la pantalla de inicio</strong> o <strong>Instalar Aplicación</strong>.</p>
                <p>3. Abre la app instalada para continuar.</p>
             </div>
          ) : (
             <div className="text-left bg-slate-100 dark:bg-fca-dark/50 p-4 rounded-xl text-sm text-slate-600 dark:text-slate-300 space-y-3 shadow-inner border border-transparent dark:border-fca-charcoal">
                <p>1. Haz clic en el ícono de instalación en la barra de direcciones de tu navegador de PC (Chrome/Edge).</p>
                <p>2. Haz clic en <strong>Instalar</strong> y abre la aplicación creada.</p>
             </div>
          )}
        </div>
      </div>
    );
  }

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Tu navegador no soporta Notificaciones Web Push.');
      }

      // 1. Permiso Push
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Permisos de notificación denegados. Acéptalos para continuar.');
      }
      
      // 2. Registrar en Backend
      const userRes = await fetch(apiUrl('/api/users'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faculty, moodle_username: username, moodle_password: password })
      });
      
      if (!userRes.ok) {
        const err = await userRes.json();
        throw new Error(err.detail || 'Error al registrar usuario.');
      }
      
      const { user_id } = await userRes.json();
      
      // 3. Obtener VAPID y Suscribir
      const vapidRes = await fetch(apiUrl('/api/vapid-public-key'));
      const { vapid_public_key } = await vapidRes.json();
      
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(vapid_public_key)
      });
      
      // 4. Enviar Sub al Backend
      const subRes = await fetch(apiUrl('/api/subscribe'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id, subscription })
      });

      if (!subRes.ok) throw new Error('Error al vincular el dispositivo Push.');
      
      // 5. Probar Push
      await fetch(apiUrl(`/api/users/${user_id}/test_push`), { method: 'POST' });
      
      localStorage.setItem('moodle_pwa_user_id', user_id);
      setHasAccount(true);
      
      const statusRes = await fetch(apiUrl(`/api/users/${user_id}/status`));
      setAccountStatus(await statusRes.json());
      
      window.scrollTo(0,0);
      
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('¿Seguro que deseas eliminarte de la base de datos y apagar las notificaciones?')) return;
    const userId = localStorage.getItem('moodle_pwa_user_id');
    try {
      await fetch(apiUrl(`/api/users/${userId}`), { method: 'DELETE' });
      localStorage.removeItem('moodle_pwa_user_id');
      setHasAccount(false);
      setAccountStatus(null);
    } catch (e) {
      alert("Error al borrar cuenta");
    }
  };

  if (hasAccount) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 font-outfit relative">
        <div className="absolute top-6 right-6"><ThemeToggle /></div>
        <div className="bg-white/90 dark:bg-fca-charcoal/40 p-8 rounded-3xl border border-fca-gray/30 dark:border-fca-charcoal/80 max-w-sm w-full shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-center mb-6">
            <span className="text-5xl drop-shadow-lg">🎓</span>
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-fca-orange to-fca-yellow dark:from-fca-orangeLight dark:to-fca-yellow bg-clip-text text-transparent text-center mb-2">
            Notificaciones Activas
          </h2>
          <p className="text-center text-slate-500 dark:text-slate-300 mb-6 text-sm">Todo está configurado y funcionando.</p>
          
          {accountStatus?.device_count > 1 && (
            <div className="bg-fca-orange/10 border border-fca-orange/30 text-fca-orangeShadow dark:text-fca-orangeLight p-3 rounded-lg mb-6 text-xs text-center font-medium flex items-center justify-center gap-2">
               <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
               Tienes {accountStatus.device_count} dispositivos vinculados.
            </div>
          )}

          <div className="bg-slate-50 dark:bg-fca-dark/50 rounded-xl p-4 border border-fca-gray/30 dark:border-fca-charcoal/80 mb-6 shadow-inner">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-fca-orangeLight mb-3 border-b border-fca-gray/30 dark:border-fca-charcoal pb-2">Últimas Notificaciones</h3>
            <div className="space-y-3">
              {accountStatus && accountStatus.recent_notifications && accountStatus.recent_notifications.length > 0 ? (
                accountStatus.recent_notifications.map((n, i) => (
                  <div key={i} className="text-xs">
                    <span className="text-fca-gray dark:text-fca-gray block mb-0.5">{n.date}</span>
                    <span className="text-slate-700 dark:text-slate-200 line-clamp-2">{n.message}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 dark:text-fca-gray text-center py-2">Sin actividad reciente.</p>
              )}
            </div>
          </div>
          
          <div className="text-center pt-2">
            <button 
              onClick={handleDeleteAccount}
              className="text-xs text-red-500/80 dark:text-red-400/80 hover:text-red-600 dark:hover:text-red-400 underline decoration-red-500/30 dark:decoration-red-400/30 hover:decoration-red-600 dark:hover:decoration-red-400 transition-colors"
            >
              Desactivar notificaciones y borrar cuenta
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 relative">
      <div className="absolute top-6 right-6"><ThemeToggle /></div>
      <div className="bg-white/90 dark:bg-fca-charcoal/40 p-8 rounded-3xl border border-fca-gray/30 dark:border-fca-charcoal/80 max-w-md w-full shadow-2xl backdrop-blur-xl">
        <h1 className="text-3xl font-extrabold text-center mb-2 bg-gradient-to-r from-fca-orange to-fca-orangeLight dark:from-fca-orangeLight dark:to-fca-yellow bg-clip-text text-transparent tracking-tight drop-shadow-sm">Moodle Notifier</h1>
        <p className="text-center text-slate-500 dark:text-slate-300 mb-8 text-sm">Vincula tu cuenta para avisos en tiempo real</p>
        
        {message && (
          <div className="bg-slate-100 dark:bg-fca-dark/80 text-sm p-4 rounded-xl mb-6 border border-fca-gray/30 dark:border-fca-charcoal text-slate-700 dark:text-slate-200 shadow-inner">
            {message}
          </div>
        )}
        
        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-200 mb-1.5 ml-1">Facultad</label>
            <select 
              value={faculty} 
              onChange={(e) => setFaculty(e.target.value)}
              className="w-full bg-slate-50 dark:bg-fca-dark/60 border border-slate-300 dark:border-fca-charcoal text-slate-800 dark:text-slate-100 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-fca-orange focus:border-fca-orange focus:outline-none transition-all shadow-inner"
            >
              <option value="contaduria">Contaduría</option>
              <option value="administracion">Administración</option>
              <option value="informatica">Informática</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-200 mb-1.5 ml-1">No. de Cuenta</label>
            <input 
              type="text" 
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ej. 317..."
              className="w-full bg-slate-50 dark:bg-fca-dark/60 border border-slate-300 dark:border-fca-charcoal text-slate-800 dark:text-slate-100 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-fca-orange focus:border-fca-orange focus:outline-none transition-all shadow-inner"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-200 mb-1.5 ml-1">Contraseña Moodle</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 dark:bg-fca-dark/60 border border-slate-300 dark:border-fca-charcoal text-slate-800 dark:text-slate-100 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-fca-orange focus:border-fca-orange focus:outline-none transition-all shadow-inner pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500 dark:text-fca-gray hover:text-fca-orange shadow-none transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.543 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className={`w-full font-bold py-4 rounded-xl transition-all shadow-lg mt-4 ${
              loading 
                ? 'bg-fca-orange/20 dark:bg-fca-orange/20 text-fca-orange/50 dark:text-fca-orange/50 cursor-not-allowed' 
                : 'bg-gradient-to-r from-fca-orange to-fca-orangeLight hover:from-fca-orangeShadow hover:to-fca-orange dark:from-fca-orange dark:to-fca-orangeLight dark:hover:from-fca-orangeShadow dark:hover:to-fca-orange text-white hover:-translate-y-0.5 hover:shadow-fca-orange/30 active:translate-y-0'
            }`}
          >
            {loading ? 'Activando Sistema Push...' : 'Activar Notificaciones'}
          </button>
        </form>
      </div>
    </div>
  );
}
