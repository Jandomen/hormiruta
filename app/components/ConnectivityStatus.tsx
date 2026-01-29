"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff, RefreshCw, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/app/lib/utils";

export default function ConnectivityStatus() {
    const [isOnline, setIsOnline] = useState(true);
    const [showRestored, setShowRestored] = useState(false);
    const [isRetrying, setIsRetrying] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setIsOnline(navigator.onLine);
        }

        const handleOnline = () => {
            setIsOnline(true);
            setShowRestored(true);
            setIsRetrying(false);
            setTimeout(() => setShowRestored(false), 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowRestored(false);
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    const handleRetry = () => {
        setIsRetrying(true);
        setTimeout(() => {
            if (navigator.onLine) {
                window.location.reload();
            } else {
                setIsRetrying(false);
            }
        }, 1500);
    };

    return (
        <AnimatePresence>
            {/* Pantalla de Error Offline Premium */}
            {!isOnline && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] bg-[#060914] flex flex-col items-center justify-center p-8 text-center overflow-hidden"
                >
                    {/* Decoración de fondo */}
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-info/5 blur-[120px] rounded-full" />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        className="relative z-10 space-y-10 max-w-sm"
                    >
                        <div className="flex justify-center relative">
                            <div className="w-28 h-28 bg-white/5 border border-white/10 rounded-[40px] flex items-center justify-center relative overflow-hidden group shadow-2xl">
                                <WifiOff className="w-12 h-12 text-info group-hover:scale-110 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-gradient-to-t from-info/10 to-transparent opacity-50" />
                            </div>
                            <motion.div
                                animate={{ y: [-4, 4, -4] }}
                                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                className="absolute -top-4 -right-4 w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center backdrop-blur-xl shadow-lg"
                            >
                                <span className="text-2xl">⚡</span>
                            </motion.div>
                        </div>

                        <div className="space-y-4">
                            <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">
                                Conexión <br /><span className="text-info/80 font-normal not-italic tracking-normal lowercase opacity-50">interrumpida</span>
                            </h1>
                            <p className="text-white/40 text-[13px] font-medium leading-relaxed px-6">
                                No detectamos acceso a internet. HormiRuta requiere una conexión activa para el rastreo satelital y despacho de rutas.
                            </p>
                        </div>

                        <div className="pt-4 space-y-6">
                            <button
                                onClick={handleRetry}
                                disabled={isRetrying}
                                className="w-full py-5 bg-white text-black hover:bg-info hover:text-dark font-black rounded-[24px] shadow-[0_25px_50px_-12px_rgba(255,255,255,0.15)] transition-all flex items-center justify-center gap-3 group active:scale-95 disabled:opacity-50"
                            >
                                {isRetrying ? (
                                    <RefreshCw className="w-6 h-6 animate-spin text-dark" />
                                ) : (
                                    <>
                                        REINTENTAR ACCESO
                                        <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700" />
                                    </>
                                )}
                            </button>

                            <div className="flex flex-col items-center gap-3 opacity-30">
                                <div className="h-[1px] w-12 bg-white/20" />
                                <div className="flex items-center gap-2 text-[10px] font-black text-white uppercase tracking-[0.4em]">
                                    <Smartphone className="w-3 h-3 text-info" />
                                    HormiRuta Command Center
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* Toast de Conexión Restaurada */}
            {showRestored && isOnline && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 20, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    className="fixed top-0 left-1/2 z-[10000] -translate-x-1/2 w-full max-w-[280px]"
                >
                    <div className="flex items-center justify-center gap-3 rounded-2xl bg-emerald-500 py-4 text-white shadow-[0_15px_30px_rgba(16,185,129,0.3)] border border-emerald-400/50 mx-4">
                        <div className="bg-white/20 p-1.5 rounded-lg">
                            <Wifi className="h-4 w-4" />
                        </div>
                        <span className="font-black italic uppercase text-[11px] tracking-widest">En Línea / Restaurado</span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

