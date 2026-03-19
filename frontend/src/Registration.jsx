import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Shield, Smartphone, ArrowRight, Trash2, GraduationCap, Eye, EyeOff, Loader2 } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { apiUrl } from './api';
import GlassCard from './components/GlassCard';
import NotificationItem from './components/NotificationItem';
import BackgroundGlow from './components/BackgroundGlow';

// Helpers
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes("Mac") && "ontouchend" in document);
const isAndroid = () => /android/i.test(navigator.userAgent);
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

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
  const [message, setMessage] = useState('');
  const [hasAccount, setHasAccount] = useState(false);
  const [accountStatus, setAccountStatus] = useState(null);

  // Sub-component for the form to isolate state and prevent lag while typing
  const RegistrationForm = React.memo(({ onRegister, loading }) => {
    const [faculty, setFaculty] = useState('contaduria');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    return (
      <form onSubmit={(e) => onRegister(e, { faculty, username, password })} className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Facultad</label>
          <select 
            value={faculty} 
            onChange={(e) => setFaculty(e.target.value)}
            className="w-full bg-white/5 border border-white/10 text-slate-100 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-fca-orange focus:border-transparent focus:outline-none transition-all appearance-none cursor-pointer"
          >
            <option value="contaduria" className="bg-[#0D0D0D]">Contaduría</option>
            <option value="administracion" className="bg-[#0D0D0D]">Administración</option>
            <option value="informatica" className="bg-[#0D0D0D]">Informática</option>
          </select>
        </div>
        
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">No. de Cuenta</label>
          <input 
            type="text" required value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Ej. 317..."
            className="w-full bg-white/5 border border-white/10 text-slate-100 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-fca-orange focus:border-transparent focus:outline-none transition-all placeholder:text-slate-600"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Contraseña Moodle</label>
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} required value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white/5 border border-white/10 text-slate-100 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-fca-orange focus:border-transparent focus:outline-none transition-all placeholder:text-slate-600 pr-14"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-5 text-slate-500 hover:text-fca-orange transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        
        <motion.button 
          type="submit" disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full font-black py-5 rounded-2xl transition-all shadow-xl mt-6 flex items-center justify-center gap-3 ${
            loading 
              ? 'bg-white/5 text-white/20 cursor-not-allowed' 
              : 'bg-gradient-to-r from-fca-orange to-fca-yellow text-white shadow-fca-orange/20'
          }`}
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Activar Notificaciones'}
          {!loading && <ArrowRight className="w-5 h-5" />}
        </motion.button>
      </form>
    );
  });
  
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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const handleRegister = async (e, formDetails) => {
    e.preventDefault();
    const { faculty, username, password } = formDetails;
    setLoading(true);
    setMessage('');
    
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) throw new Error('Navegador no soportado.');
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') throw new Error('Permisos de notificación denegados.');
      
      const userRes = await fetch(apiUrl('/api/users'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faculty, moodle_username: username, moodle_password: password })
      });
      if (!userRes.ok) throw new Error((await userRes.json()).detail || 'Error al registrar.');
      const { user_id } = await userRes.json();
      
      const vapidRes = await fetch(apiUrl('/api/vapid-public-key'));
      const { vapid_public_key } = await vapidRes.json();
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(vapid_public_key)
      });
      
      const subRes = await fetch(apiUrl('/api/subscribe'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id, subscription })
      });
      if (!subRes.ok) throw new Error('Error al vincular el dispositivo.');
      
      await fetch(apiUrl(`/api/users/${user_id}/test_push`), { method: 'POST' });
      localStorage.setItem('moodle_pwa_user_id', user_id);
      setHasAccount(true);
      const statusRes = await fetch(apiUrl(`/api/users/${user_id}/status`));
      setAccountStatus(await statusRes.json());
      window.scrollTo(0, 0);
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('¿Seguro que deseas eliminar tu cuenta?')) return;
    const userId = localStorage.getItem('moodle_pwa_user_id');
    try {
      await fetch(apiUrl(`/api/users/${userId}`), { method: 'DELETE' });
      localStorage.removeItem('moodle_pwa_user_id');
      setHasAccount(false);
      setAccountStatus(null);
    } catch (e) { alert("Error al borrar cuenta"); }
  };

  // View: Install PWA
  if (!standalone) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center relative selection:bg-fca-orange/30 overflow-hidden">
        <BackgroundGlow />
        <div className="absolute top-8 right-8"><ThemeToggle /></div>
        
        <GlassCard className="max-w-sm w-full">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-fca-orange/10 text-fca-orange p-5 rounded-full w-20 h-20 mx-auto flex items-center justify-center mb-6 shadow-glow"
          >
            <Smartphone className="w-10 h-10" />
          </motion.div>
          
          <h1 className="text-3xl font-black bg-gradient-to-r from-fca-orange to-fca-yellow bg-clip-text text-transparent mb-4 tracking-tighter">
            Instala la App
          </h1>
          <p className="text-slate-300 mb-8 text-sm font-medium leading-relaxed px-2">
            Para recibir notificaciones nativas de Moodle, debes añadir esta web a tu pantalla de inicio.
          </p>
          
          <div className="text-left bg-black/30 p-5 rounded-2xl border border-white/5 space-y-4 shadow-inner">
            {isIOS() ? (
              <>
                <div className="flex items-start gap-4">
                  <span className="flex-shrink-0 bg-white/10 w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold">1</span>
                  <p className="text-sm text-slate-400">Toca <strong>Compartir</strong> ↑ en Safari.</p>
                </div>
                <div className="flex items-start gap-4">
                  <span className="flex-shrink-0 bg-white/10 w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold">2</span>
                  <p className="text-sm text-slate-400">Selecciona <strong>Añadir a pantalla de inicio</strong> +.</p>
                </div>
              </>
            ) : isAndroid() ? (
              <div className="flex items-start gap-4">
                <span className="flex-shrink-0 bg-white/10 w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold">!</span>
                <p className="text-sm text-slate-400">Toca el menú <strong>⋮</strong> y selecciona <strong>Instalar Aplicación</strong>.</p>
              </div>
            ) : (
              <div className="flex items-start gap-4">
                <span className="flex-shrink-0 bg-white/10 w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold">1</span>
                <p className="text-sm text-slate-400">Haz clic en el ícono de instalación en la barra de direcciones.</p>
              </div>
            )}
            <div className="pt-2 border-t border-white/5 mt-4">
              <p className="text-[10px] text-fca-gray text-center uppercase tracking-widest font-bold animate-pulse">Abre la app instalada para continuar</p>
            </div>
          </div>
        </GlassCard>
      </div>
    );
  }

  // View: Active Dashboard
  if (hasAccount) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 font-outfit relative selection:bg-fca-orange/30 overflow-hidden">
        <BackgroundGlow />
        <div className="absolute top-8 right-8 z-50"><ThemeToggle /></div>
        
        <GlassCard className="max-w-md w-full !p-8">
          <div className="flex items-center justify-center mb-10 relative">
             <motion.div
               animate={{ y: [0, -8, 0] }}
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
               className="bg-gradient-to-br from-fca-orange/20 to-fca-yellow/10 p-6 rounded-[2rem] shadow-glow border border-fca-orange/20"
             >
               <GraduationCap className="w-14 h-14 text-fca-orange shadow-lg" />
             </motion.div>
             <div className="absolute -bottom-3 bg-[#0D0D0D] px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-2 shadow-xl">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">FCA LIVE Sync</span>
             </div>
          </div>
          
          <h2 className="text-3xl font-black bg-gradient-to-r from-fca-orange to-fca-yellow bg-clip-text text-transparent text-center mb-2 tracking-tighter">
            Notificaciones Activas
          </h2>
          <p className="text-center text-slate-400 mb-8 text-sm font-medium">Recuperando avisos en tiempo real</p>
          
          <div className="space-y-6">
            {accountStatus?.device_count > 1 && (
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-fca-orange/5 border border-fca-orange/10 p-4 rounded-2xl flex items-center gap-4 group"
              >
                 <div className="bg-white/5 p-2.5 rounded-xl group-hover:bg-fca-orange/20 transition-colors">
                   <Smartphone className="w-5 h-5 text-fca-orange" />
                 </div>
                 <p className="text-xs font-bold text-slate-300">
                   <span className="text-fca-orange">{accountStatus.device_count}</span> Dispositivos vinculados con éxito.
                 </p>
              </motion.div>
            )}

            <div>
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Bell className="w-3.5 h-3.5 text-fca-orange" />
                  Últimos Avisos
                </h3>
                {accountStatus?.recent_notifications?.length > 0 && (
                  <span className="text-[10px] font-bold text-fca-orange/60">{accountStatus.recent_notifications.length} recientes</span>
                )}
              </div>
              
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="space-y-3 max-h-[45vh] overflow-y-auto pr-2 scrollbar-hide pb-4"
              >
                {accountStatus?.recent_notifications?.length > 0 ? (
                  accountStatus.recent_notifications.map((n, i) => (
                    <NotificationItem 
                      key={i} 
                      date={n.date} 
                      message={n.message} 
                      isNew={i === 0} 
                    />
                  ))
                ) : (
                  <div className="text-center py-16 bg-white/5 rounded-[2rem] border border-dashed border-white/10 opacity-30 mt-2">
                    <Bell className="w-10 h-10 mx-auto mb-4" />
                    <p className="text-xs font-black tracking-widest uppercase">Todo en calma</p>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
          
          <div className="text-center pt-6 mt-4 border-t border-white/5 opacity-40 hover:opacity-100 transition-opacity">
            <button 
              onClick={handleDeleteAccount}
              className="flex items-center justify-center gap-2 w-full text-[10px] font-bold text-red-400 uppercase tracking-widest hover:text-red-500 transition-colors py-2"
            >
              <Trash2 className="w-4 h-4" />
              Desvincular cuenta y borrar datos
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

  // View: Registration Form
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 relative selection:bg-fca-orange/30 overflow-hidden">
      <BackgroundGlow />
      <div className="absolute top-8 right-8 z-50"><ThemeToggle /></div>
      
      <GlassCard className="max-w-md w-full !p-10">
        <motion.h1 
          initial={{ y: -10 }}
          animate={{ y: 0 }}
          className="text-4xl font-black text-center mb-2 bg-gradient-to-r from-fca-orange to-fca-yellow bg-clip-text text-transparent tracking-tighter"
        >
          Moodle Notifier
        </motion.h1>
        <p className="text-center text-slate-400 mb-10 text-sm font-medium">Vincula tu cuenta para avisos en tiempo real</p>
        
        <AnimatePresence>
          {message && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-red-500/10 border border-red-500/20 text-red-200 text-xs p-4 rounded-2xl mb-8 flex items-center gap-3"
            >
              <Shield className="w-4 h-4 shrink-0" />
              {message}
            </motion.div>
          )}
        </AnimatePresence>
        
        <RegistrationForm onRegister={handleRegister} loading={loading} />
      </GlassCard>
    </div>
  );
}
