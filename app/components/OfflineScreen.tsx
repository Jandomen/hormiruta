'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RotateCw } from 'lucide-react';

export default function OfflineScreen() {
  const [isOffline, setIsOffline] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = () => {
      const offline = !navigator.onLine;
      setIsOffline(offline);
      if (offline) setShow(true);
      else setTimeout(() => setShow(false), 800);
    };
    handler();
    window.addEventListener('online', handler);
    window.addEventListener('offline', handler);
    return () => {
      window.removeEventListener('online', handler);
      window.removeEventListener('offline', handler);
    };
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#060914]"
        >
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-info/10 blur-[80px] rounded-full pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center px-6 max-w-xs text-center">
            <div className="w-24 h-24 rounded-[32px] bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl mb-8">
              <WifiOff className="w-12 h-12 text-info" />
            </div>

            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white mb-4">
              Sin Conexión
            </h1>

            <p className="text-sm text-white/70 leading-relaxed mb-10 font-medium">
              Parece que no tienes acceso a la red. HormiRuta necesita internet para el rastreo y despacho.
            </p>

            <button
              onClick={handleRetry}
              className="w-full py-4 bg-white text-dark font-black uppercase text-sm tracking-widest rounded-2xl shadow-[0_15px_30px_rgba(255,255,255,0.1)] active:scale-[0.97] transition-all flex items-center justify-center gap-2"
            >
              <RotateCw className="w-4 h-4" />
              Reintentar Acceso
            </button>

            <p className="mt-8 text-[10px] font-black text-white/15 uppercase tracking-[0.3em]">
              HormiRuta v1.0.4 — Native Offline Mode
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
