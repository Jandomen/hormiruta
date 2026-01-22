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

    const triggerSOS = async () => {
        setStatus('sending');
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
            window.location.href = `tel:${sosContact}`;
        }
    };

    return (
        <div className="fixed top-24 lg:top-8 right-32 lg:right-48 z-[100] flex flex-col items-end gap-3">
            <AnimatePresence>
                {status === 'confirming' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        className="bg-black/95 backdrop-blur-3xl border border-red-500/30 p-5 rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex flex-col gap-4 min-w-[200px]"
                    >
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em]">Protocolo de Emergencia</p>
                            <p className="text-xs font-bold text-white">¿Qué deseas hacer?</p>
                        </div>

                        <div className="flex flex-col gap-2">
                            <button
                                onClick={triggerSOS}
                                className="w-full flex items-center gap-3 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl shadow-lg transition-all animate-pulse"
                            >
                                <Send className="w-4 h-4" />
                                <div className="text-left">
                                    <span className="text-[10px] font-black uppercase tracking-widest block">Activar Alerta Total</span>
                                    <span className="text-[8px] opacity-60 block">(Llamada + SMS automáticos)</span>
                                </div>
                            </button>

                            {sosContact && (
                                <button
                                    onClick={handleCall}
                                    className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <Phone className="w-4 h-4 text-green-500" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Llamada Directa Manual</span>
                                    </div>
                                    <span className="text-[8px] text-white/20 font-mono">(Backup)</span>
                                </button>
                            )}

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

            {/* El botón principal siempre visible */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{
                    scale: [1, 1.05, 1],
                    rotate: status === 'confirming' ? 90 : 0
                }}
                transition={{
                    scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                    rotate: { duration: 0.3 }
                }}
                onClick={() => setStatus(status === 'confirming' ? 'idle' : 'confirming')}
                className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center shadow-2xl border-2 transition-all relative z-10",
                    status === 'idle' || status === 'confirming' ? "bg-red-600 border-white/20 shadow-red-600/40" :
                        status === 'sending' ? "bg-black border-info shadow-info/20" :
                            status === 'sent' ? "bg-green-600 border-green-400 shadow-green-600/20" :
                                "bg-red-900 border-red-500"
                )}
            >
                <AnimatePresence mode="wait">
                    {status === 'idle' || status === 'confirming' ? (
                        <motion.div key="sos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <ShieldAlert className="w-8 h-8 text-white" />
                        </motion.div>
                    ) : status === 'sending' ? (
                        <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <Loader2 className="w-8 h-8 text-info animate-spin" />
                        </motion.div>
                    ) : status === 'sent' ? (
                        <motion.div key="check" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <CheckCircle className="w-8 h-8 text-white" />
                        </motion.div>
                    ) : (
                        <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <ShieldAlert className="w-8 h-8 text-white" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>
        </div>
    );
}
