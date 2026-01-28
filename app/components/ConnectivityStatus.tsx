"use client";

import { useEffect, useState } from "react";
import { WifiOff, RotateCw, Wifi } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ConnectivityStatus() {
    const [isOnline, setIsOnline] = useState(true);
    const [showRestored, setShowRestored] = useState(false);

    useEffect(() => {
        // Initial check
        if (typeof window !== "undefined") {
            setIsOnline(navigator.onLine);
        }

        const handleOnline = () => {
            setIsOnline(true);
            setShowRestored(true);
            // Hide the restored message after 3 seconds
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

    return (
        <AnimatePresence>
            {/* Offline Overlay */}
            {!isOnline && (
                <motion.div
                    initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                    animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
                    exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                    transition={{ duration: 0.5 }}
                    className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0f172a]/80 p-6 text-center"
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: 20 }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className="glass-panel flex max-w-sm flex-col items-center p-8 shadow-2xl ring-1 ring-white/10"
                    >
                        <div className="mb-6 rounded-full bg-red-500/10 p-6 ring-1 ring-red-500/20">
                            <WifiOff className="h-10 w-10 text-red-500" strokeWidth={1.5} />
                        </div>

                        <h2 className="mb-3 text-2xl font-bold text-white tracking-tight">Sin Conexión</h2>
                        <p className="mb-8 text-slate-300 leading-relaxed">
                            No se detecta conexión a internet. Algunas funciones pueden no estar disponibles.
                        </p>

                        <button
                            onClick={() => window.location.reload()}
                            className="btn-primary flex w-full items-center justify-center gap-2 px-6 py-3 text-base"
                        >
                            <RotateCw className="h-5 w-5" />
                            Reintentar Conexión
                        </button>
                    </motion.div>
                </motion.div>
            )}

            {/* Online Toast */}
            {showRestored && isOnline && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    className="fixed top-8 left-1/2 z-[100] -translate-x-1/2"
                >
                    <div className="flex items-center gap-3 rounded-full bg-emerald-500/90 px-6 py-3 text-white shadow-xl backdrop-blur-md">
                        <Wifi className="h-5 w-5" />
                        <span className="font-medium">Conexión Restaurada</span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
