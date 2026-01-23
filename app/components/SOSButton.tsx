'use client';

import React, { useState } from 'react';
import { ShieldAlert, Send, CheckCircle, Loader2, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { cn } from '../lib/utils';

export default function SOSButton({ driverName, currentPos }: { driverName?: string; currentPos?: { lat: number; lng: number } }) {
    const { data: session } = useSession();
    const sosContact = (session?.user as any)?.sosContact;
    const [status, setStatus] = useState<'idle' | 'confirming' | 'sending' | 'sent' | 'error'>('idle');
    const [localNotification, setLocalNotification] = useState<string | null>(null);

    const showNotification = (msg: string) => {
        setLocalNotification(msg);
        setTimeout(() => setLocalNotification(null), 4000);
    };

    const triggerSOS = async () => {
        setStatus('sending');

        // Iniciamos la llamada local inmediatamente para que el usuario sienta la respuesta
        if (sosContact) {
            const cleanNumber = sosContact.replace(/\s+/g, '').replace(/[^0-9+]/g, '');
            window.location.href = `tel:${cleanNumber}`;
        } else {
            showNotification('⚠️ No has configurado un contacto SOS en los ajustes.');
        }

        try {
            const res = await fetch('/api/sos/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    driverName: driverName || 'Conductor',
                    location: currentPos ? `https://www.google.com/maps?q=${currentPos.lat},${currentPos.lng}` : 'Ubicación no disponible',
                    message: `Botón de pánico presionado. Contacto SOS: ${sosContact || 'No configurado'}`
                })
            });

            if (res.ok) {
                setStatus('sent');
                setTimeout(() => setStatus('idle'), 5000);
            } else {
                setStatus('error');
                setTimeout(() => setStatus('idle'), 3000);
            }
        } catch (e) {
            setStatus('error');
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    const handleCall = () => {
        if (sosContact) {
            const cleanNumber = sosContact.replace(/\s+/g, '').replace(/[^0-9+]/g, '');
            window.location.href = `tel:${cleanNumber}`;
        } else {
            showNotification('⚠️ No has configurado un contacto SOS en los ajustes.');
        }
    };

    return (
        <div className="fixed top-24 lg:top-8 right-6 lg:right-10 z-[100] flex flex-col items-end gap-3">
            <AnimatePresence>
                {localNotification && (
                    <motion.div
                        initial={{ opacity: 0, x: 20, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.9 }}
                        className="bg-red-500 text-white px-6 py-3 rounded-2xl shadow-2xl font-black text-[10px] uppercase tracking-widest border border-white/20 mb-2 flex items-center gap-3"
                    >
                        <ShieldAlert className="w-4 h-4" />
                        {localNotification}
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {status === 'confirming' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        className="bg-black/90 backdrop-blur-3xl border border-red-500/20 p-5 rounded-[32px] shadow-[0_40px_80px_rgba(0,0,0,0.9)] flex flex-col gap-4 min-w-[220px]"
                    >
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-red-500 uppercase tracking-[0.2em]">Protocolo de Emergencia</p>
                            <p className="text-[11px] font-bold text-white/90">¿Qué acción deseas tomar?</p>
                        </div>

                        <div className="flex flex-col gap-2">
                            <button
                                onClick={triggerSOS}
                                className="w-full flex items-center gap-3 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl shadow-lg transition-all active:scale-95 animate-pulse"
                            >
                                <Send className="w-4 h-4" />
                                <div className="text-left">
                                    <span className="text-[10px] font-black uppercase tracking-widest block">ALERTA TOTAL</span>
                                    <span className="text-[8px] opacity-70 block">SMS + Llamada Automática</span>
                                </div>
                            </button>

                            <button
                                onClick={handleCall}
                                className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <Phone className="w-4 h-4 text-green-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Llamar Ahora</span>
                                </div>
                                <span className="text-[8px] text-white/20 font-mono">Manual</span>
                            </button>

                            <button
                                onClick={() => setStatus('idle')}
                                className="w-full py-2 text-[9px] font-black text-white/20 uppercase tracking-[0.2em] hover:text-white/40 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* El botón principal siempre visible - MÁS PEQUEÑO Y TRANSPARENTE */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{
                    scale: [1, 1.02, 1],
                    rotate: status === 'confirming' ? 90 : 0
                }}
                transition={{
                    scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                    rotate: { duration: 0.3 }
                }}
                onClick={() => setStatus(status === 'confirming' ? 'idle' : 'confirming')}
                className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center shadow-2xl border transition-all relative z-10",
                    status === 'idle' || status === 'confirming'
                        ? "bg-red-600/20 backdrop-blur-md border-red-500/20 shadow-red-600/10 hover:bg-red-600/40"
                        : status === 'sending' ? "bg-black border-info shadow-info/10"
                            : status === 'sent' ? "bg-green-600 border-green-400 shadow-green-600/10"
                                : "bg-red-900 border-red-500"
                )}
            >
                <AnimatePresence mode="wait">
                    {status === 'idle' || status === 'confirming' ? (
                        <motion.div key="sos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <ShieldAlert className="w-6 h-6 text-red-500/80" />
                        </motion.div>
                    ) : status === 'sending' ? (
                        <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <Loader2 className="w-6 h-6 text-info animate-spin" />
                        </motion.div>
                    ) : status === 'sent' ? (
                        <motion.div key="check" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <CheckCircle className="w-6 h-6 text-white" />
                        </motion.div>
                    ) : (
                        <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <ShieldAlert className="w-6 h-6 text-white" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>
        </div>
    );
}
