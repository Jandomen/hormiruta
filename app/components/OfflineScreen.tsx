'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RotateCw, Loader2 } from 'lucide-react';

export default function OfflineScreen() {
  const [isOffline, setIsOffline] = useState(false);
  const [show, setShow] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [checking, setChecking] = useState(false);
  const [retryMsg, setRetryMsg] = useState<string | null>(null);

  useEffect(() => {
    let offlineTimer: ReturnType<typeof setTimeout> | null = null;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    const handler = () => {
      const offline = !navigator.onLine;
      setIsOffline(offline);
      if (offlineTimer) clearTimeout(offlineTimer);
      if (hideTimer) clearTimeout(hideTimer);
      if (offline) {
        offlineTimer = setTimeout(() => {
          if (!navigator.onLine) setShow(true);
        }, 1500);
      } else {
        hideTimer = setTimeout(() => setShow(false), 800);
      }
    };
    handler();
    window.addEventListener('online', handler);
    window.addEventListener('offline', handler);
    return () => {
      window.removeEventListener('online', handler);
      window.removeEventListener('offline', handler);
      if (offlineTimer) clearTimeout(offlineTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, []);

  const handleRetry = async () => {
    if (navigator.onLine) {
      window.location.reload();
      return;
    }
    setChecking(true);
    setRetryMsg(null);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      const res = await fetch('/api/pricing', { cache: 'no-store', signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        window.location.reload();
        return;
      }
    } catch (e) {
      // Sin conexión: permanecemos en esta pantalla, sin recargar.
    }
    setChecking(false);
    setRetryMsg('Sigue sin conexión. Verifica tu internet e inténtalo nuevamente.');
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#060914] px-4"
        >
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-info/10 blur-[80px] rounded-full pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center w-full max-w-[320px] text-center">
            <div className="w-24 h-24 rounded-[32px] bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl mb-8 overflow-hidden">
              {logoError ? (
                <WifiOff className="w-12 h-12 text-info" />
              ) : (
                <img
                  src="/LogoHormiruta.png"
                  alt="Hormiruta"
                  className="w-[68%] h-[68%] object-contain"
                  onError={() => setLogoError(true)}
                />
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tighter text-white leading-tight mb-4">
              Sin Conexión a Internet
            </h1>

            <p className="text-sm text-white/70 leading-relaxed mb-10 font-medium">
              Comprueba tu conexión e inténtalo nuevamente.
            </p>

            <button
              onClick={handleRetry}
              disabled={checking}
              className="w-full py-4 bg-gradient-to-r from-info to-indigo-500 text-dark font-black uppercase text-sm tracking-widest rounded-2xl shadow-[0_15px_30px_rgba(96,165,250,0.25)] active:scale-[0.97] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {checking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCw className="w-4 h-4" />
              )}
              {checking ? 'Verificando...' : 'Reintentar'}
            </button>

            {retryMsg && (
              <p className="mt-4 text-xs text-white/60 font-medium leading-relaxed">{retryMsg}</p>
            )}

            <p className="mt-8 text-[10px] font-black text-white/15 uppercase tracking-[0.3em]">
              Hormiruta
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
