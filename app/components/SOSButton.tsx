'use client';

import React, { useState } from 'react';
import { ShieldAlert, Send, CheckCircle, Loader2, Phone, Settings, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { cn } from '../lib/utils';
import { useLocalNotifications } from '../lib/useLocalNotifications';

export default function SOSButton({ driverName, currentPos, className }: {
    driverName?: string;
    currentPos?: { lat: number; lng: number };
    className?: string;
}) {
    const { data: session, update } = useSession();
    const sosContact = (session?.user as any)?.sosContact;
    const { sendSOSNotification } = useLocalNotifications();
    const [status, setStatus] = useState<'idle' | 'confirming' | 'sending' | 'sent' | 'error'>('idle');
    const [localNotification, setLocalNotification] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [tempPhone, setTempPhone] = useState(sosContact || '');
    const [isSaving, setIsSaving] = useState(false);

    const showNotification = (msg: string) => {
        setLocalNotification(msg);
        setTimeout(() => setLocalNotification(null), 4000);
    };

    const handleUpdateContact = async () => {
        if (!tempPhone || tempPhone.length < 10) {
            showNotification('❌ Número inválido (min. 10 dígitos)');
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch('/api/sos/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sosContact: tempPhone })
            });

            if (res.ok) {
                await update({ sosContact: tempPhone });
                setIsEditing(false);
                showNotification('✅ Contacto SOS Sincronizado');
            } else {
                showNotification('❌ Error al sincronizar');
            }
        } catch (e) {
            showNotification('❌ Error de red');
        } finally {
            setIsSaving(false);
        }
    };

    const getPrimaryNumber = (raw: string) => {
        const first = raw.split(',')[0].trim();
        return first.replace(/\s+/g, '').replace(/[^0-9+]/g, '');
    };

    const triggerSOS = async () => {
        if (status === 'sending') return;

        if (!session && !sosContact) {
            showNotification('⏳ Cargando configuración de seguridad...');
            return;
        }

        setStatus('sending');
        sendSOSNotification(sosContact);

        if (sosContact) {
            const cleanNumber = getPrimaryNumber(sosContact);
            showNotification(`🚀 Notificando a: ${sosContact}`);
            // Usar window.open para evitar interrumpir el estado de la app si es posible
            window.location.href = `tel:${cleanNumber}`;
        } else {
            showNotification('⚠️ No has configurado un contacto SOS en los ajustes.');
            setStatus('idle');
            return;
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
                showNotification('✅ Alerta enviada correctamente');
                setTimeout(() => setStatus('idle'), 5000);
            } else {
                const data = await res.json();
                setStatus('error');
                showNotification(`❌ Error: ${data.error || 'Fallo en envío'}`);
                setTimeout(() => setStatus('idle'), 3000);
            }
        } catch (e) {
            setStatus('error');
            showNotification('❌ Error de conexión crítica');
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    const handleCall = () => {
        if (sosContact) {
            const cleanNumber = getPrimaryNumber(sosContact);
            window.location.href = `tel:${cleanNumber}`;
        } else {
            showNotification('⚠️ No has configurado un contacto SOS en los ajustes.');
        }
    };

    return (
        <div className={cn("fixed top-28 lg:top-8 right-4 lg:right-10 z-[200] flex flex-col items-end gap-3 transition-all duration-500", className)}>
            <AnimatePresence>
                {localNotification && (
                    <motion.div
                        initial={{ opacity: 0, x: 20, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.9 }}
                        className="bg-red-500 text-white px-6 py-3 rounded-2xl shadow-2xl font-black text-[10px] uppercase tracking-widest border border-white/20 mb-2 flex items-center gap-3"
                    >
                        <Phone className="w-4 h-4" />
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
                        className="bg-black/90 backdrop-blur-3xl border border-red-500/20 p-4 sm:p-5 rounded-[28px] sm:rounded-[32px] shadow-[0_40px_80px_rgba(0,0,0,0.9)] flex flex-col gap-3 sm:gap-4 min-w-[200px] max-[340px]:min-w-[calc(100vw-2rem)] sm:min-w-[220px] relative overflow-hidden"
                    >
                    <button
                        onClick={() => {
                            setIsEditing(!isEditing);
                            if (!isEditing) setTempPhone(sosContact || '');
                        }}
                        className="absolute top-3 sm:top-4 right-3 sm:right-4 p-2 sm:p-2.5 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-white"
                    >
                        <Settings className="w-5 sm:w-6 h-5 sm:h-6" />
                    </button>

                        <div className="space-y-1">
                            {isEditing ? (
                                <div className="space-y-3 pb-2">
                                    <p className="text-[10px] sm:text-sm font-black text-info uppercase tracking-[0.2em]">Configurar Contacto</p>
                                    <div className="flex gap-1.5 sm:gap-2">
                                        <input
                                            autoFocus
                                            type="tel"
                                            value={tempPhone}
                                            onChange={(e) => setTempPhone(e.target.value)}
                                            placeholder="Ej: 5512345678"
                                            className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3 text-white text-xs sm:text-base focus:outline-none focus:border-info/50"
                                        />
                                        <button
                                            onClick={handleUpdateContact}
                                            disabled={isSaving}
                                            className="p-3 sm:p-4 bg-info text-dark rounded-2xl active:scale-95 disabled:opacity-50"
                                        >
                                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <p className="text-[8px] sm:text-[9px] font-black text-red-500 uppercase tracking-[0.2em]">Protocolo de Emergencia</p>
                                    <p className="text-[10px] sm:text-[11px] font-bold text-white/90 leading-tight">¿Qué acción deseas tomar?</p>
                                </>
                            )}
                        </div>

                        {!isEditing && (
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={triggerSOS}
                                    className="w-full flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl sm:rounded-2xl shadow-lg transition-all active:scale-95 animate-pulse"
                                >
                                    <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    <div className="text-left">
                                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest block leading-none">ALERTA TOTAL</span>
                                        <span className="text-[7px] sm:text-[8px] opacity-70 block mt-0.5">SMS + Llamada</span>
                                    </div>
                                </button>

                                <button
                                    onClick={handleCall}
                                    className="w-full flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl sm:rounded-2xl transition-all group"
                                >
                                    <div className="flex items-center gap-2.5 sm:gap-3">
                                        <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-300" />
                                        <div className="flex flex-col items-start leading-none gap-0.5">
                                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Llamar Ahora</span>
                                            {sosContact && <span className="text-[7px] sm:text-[8px] text-info font-bold truncate max-w-[80px]">{sosContact}</span>}
                                        </div>
                                    </div>
                                    <span className="text-[7px] text-white/20 font-mono">Manual</span>
                                </button>

                                <button
                                    onClick={() => setStatus('idle')}
                                    className="w-full py-2 text-[9px] font-black text-white/20 uppercase tracking-[0.2em] hover:text-white/40 transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative">
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
                    onClick={() => { if (status === 'idle') { setIsEditing(false); setStatus('confirming'); } else { setStatus('idle'); } }}
                    className={cn(
                        "w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-2xl border transition-all relative z-10",
                        status === 'idle' || status === 'confirming'
                            ? "bg-red-600/10 backdrop-blur-md border-red-500/20 shadow-red-600/10 hover:bg-red-600/30"
                            : status === 'sending' ? "bg-black border-info shadow-info/10"
                                : status === 'sent' ? "bg-blue-600 border-blue-400 shadow-blue-600/10"
                                    : "bg-red-900 border-red-500"
                    )}
                >
                <AnimatePresence mode="wait">
                    {status === 'idle' || status === 'confirming' ? (
                        <motion.div key="sos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <Phone className="w-7 h-7 sm:w-8 sm:h-8 text-red-500/60" />
                        </motion.div>
                    ) : status === 'sending' ? (
                        <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <Loader2 className="w-7 h-7 sm:w-8 sm:h-8 text-info animate-spin" />
                        </motion.div>
                    ) : status === 'sent' ? (
                        <motion.div key="check" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                        </motion.div>
                    ) : (
                        <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <Phone className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>
            </div>
        </div>
    );
}
