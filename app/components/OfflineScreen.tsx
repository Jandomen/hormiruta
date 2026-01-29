"use client";

import React, { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';

const OfflineScreen = () => {
    const [isRetrying, setIsRetrying] = useState(false);

    const handleRetry = () => {
        setIsRetrying(true);
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-[#060914] flex flex-col items-center justify-center p-8 text-center">
            {/* Background Decoration */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-info/10 blur-[100px] rounded-full" />

            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative z-10 space-y-8 max-w-sm"
            >
                <div className="flex justify-center relative">
                    <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-[32px] flex items-center justify-center relative overflow-hidden group">
                        <WifiOff className="w-10 h-10 text-info group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-info/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <motion.div
                        animate={{ y: [-5, 5, -5] }}
                        transition={{ repeat: Infinity, duration: 4 }}
                        className="absolute -top-4 -right-4 w-12 h-12 bg-red-500/20 border border-red-500/30 rounded-2xl flex items-center justify-center backdrop-blur-md"
                    >
                        <span className="text-xl">⚠️</span>
                    </motion.div>
                </div>

                <div className="space-y-3">
                    <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">Sin Conexión</h1>
                    <p className="text-white/40 text-sm font-medium leading-relaxed px-4">
                        Parece que no tienes acceso a la red. HormiRuta necesita internet para sincronizar tus rutas y despachos.
                    </p>
                </div>

                <div className="pt-6">
                    <button
                        onClick={handleRetry}
                        disabled={isRetrying}
                        className="w-full py-5 bg-white text-black hover:bg-info hover:text-dark font-black rounded-2xl shadow-[0_20px_40px_rgba(255,255,255,0.1)] transition-all flex items-center justify-center gap-3 group disabled:opacity-50"
                    >
                        {isRetrying ? (
                            <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                REINTENTAR CONEXIÓN
                                <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700" />
                            </>
                        )}
                    </button>

                    <div className="mt-8 flex items-center justify-center gap-2 text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
                        <Smartphone className="w-3 h-3" />
                        HormiRuta v1.0.4 - Local Mode
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default OfflineScreen;
