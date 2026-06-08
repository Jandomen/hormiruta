'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X } from 'lucide-react';

interface GeofenceAlertProps {
    stopId: string;
    stopOrder: number;
    address?: string;
    onDismiss?: (stopId: string) => void;
}


export default function GeofenceAlert({ stopId, stopOrder, address, onDismiss }: GeofenceAlertProps) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {

        const timer = setTimeout(() => {
            setIsVisible(false);
            onDismiss?.(stopId);
        }, 5000);

        return () => clearTimeout(timer);
    }, [stopId, onDismiss]);

    const handleDismiss = () => {
        setIsVisible(false);
        onDismiss?.(stopId);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, x: -100, y: -20 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    exit={{ opacity: 0, x: -100, y: -20 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="fixed top-32 left-6 z-[100] pointer-events-auto"
                >
                    <div className="bg-gradient-to-r from-emerald-500/25 to-emerald-600/25 backdrop-blur-2xl border border-emerald-400/30 rounded-2xl p-4 shadow-[0_20px_50px_rgba(22,163,74,0.3)] flex items-center gap-4 max-w-sm">
                        {/* Icono con animación de pulse */}
                        <div className="flex-shrink-0">
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg"
                            >
                                <CheckCircle className="w-6 h-6 text-white" />
                            </motion.div>
                        </div>

                        {/* Contenido */}
                        <div className="flex-1">
                            <h3 className="text-sm font-black text-emerald-300 uppercase tracking-tight">
                                ¡Parada {stopOrder} detectada!
                            </h3>
                            {address && (
                                <p className="text-xs text-emerald-300/70 mt-1 line-clamp-2">
                                    {address}
                                </p>
                            )}
                        </div>

                        {/* Botón de cerrar */}
                        <button
                            onClick={handleDismiss}
                            className="flex-shrink-0 p-1 hover:bg-emerald-500/20 rounded-lg transition-colors text-emerald-300 hover:text-emerald-200"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
