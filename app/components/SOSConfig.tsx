'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Phone, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

export default function SOSConfig() {
    const { data: session, update } = useSession();
    const [phone, setPhone] = useState((session?.user as any)?.sosContact || '');
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [lastSync, setLastSync] = useState<string | null>(null);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        // Limpiar el número para validación (quitar espacios, guiones, paréntesis)
        let cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

        // Si el usuario ingresa 10 dígitos, asumimos México (+52) automáticamente
        if (cleanPhone.length === 10 && !cleanPhone.startsWith('+')) {
            cleanPhone = `+52${cleanPhone}`;
            setPhone(cleanPhone); // Actualizar el input visualmente
        }

        const phoneRegex = /^\+?[1-9]\d{1,14}$/;

        if (!phoneRegex.test(cleanPhone)) {
            setStatus('error');
            setMessage('Formato de número no válido (Ej: 5512345678 o +52...)');
            return;
        }

        setStatus('saving');
        setMessage('');

        try {
            const res = await fetch('/api/sos/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sosContact: cleanPhone })
            });

            const data = await res.json();

            if (res.ok) {
                setStatus('saved');
                setMessage('Protocolo Sincronizado en la Nube');
                setLastSync(new Date().toLocaleTimeString());

                // Actualizar la sesión para que el botón SOS tenga los datos frescos
                await update({ sosContact: cleanPhone });

                setTimeout(() => {
                    setStatus('idle');
                    setMessage('');
                }, 4000);
            } else {
                setStatus('error');
                setMessage(data.error || 'Error al guardar');
            }
        } catch (error) {
            setStatus('error');
            setMessage('Error de conexión con el satélite');
        }
    };

    return (
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 rounded-[32px] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-600/20 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/10">
                        <Phone className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                        <h3 className="text-white font-black text-base tracking-tight italic uppercase">SOS Inteligente</h3>
                        <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-bold">Protocolo Directo Activo</p>
                    </div>
                </div>

                <div className="flex flex-col items-start sm:items-end gap-1">
                    {lastSync && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-black text-green-400 uppercase tracking-tighter">Sync: {lastSync}</span>
                        </div>
                    )}
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] pl-1">Contacto de Emergencia</label>
                    <div className="relative group">
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Número 10 dígitos (Ej: 5512345678)"
                            className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-5 text-white text-sm focus:outline-none focus:border-red-500/50 transition-all placeholder:text-white/5 shadow-inner"
                            required
                        />
                        <div className="absolute top-1/2 -translate-y-1/2 right-6 text-white/10 group-focus-within:text-red-500/50 transition-colors">
                            <Phone className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <button
                        type="submit"
                        disabled={status === 'saving'}
                        className={cn(
                            "w-full font-black py-5 rounded-2xl flex items-center justify-center gap-4 transition-all shadow-2xl active:scale-[0.98] text-[11px] uppercase tracking-[0.2em]",
                            status === 'saved' ? "bg-green-600 text-white shadow-green-600/20" : "bg-red-600 hover:bg-red-700 text-white shadow-red-600/20",
                            status === 'saving' && "opacity-50 pointer-events-none"
                        )}
                    >
                        {status === 'saving' ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : status === 'saved' ? (
                            <CheckCircle className="w-5 h-5" />
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                        {status === 'saving' ? 'Validando...' : status === 'saved' ? 'Sincronizado' : 'Activar Protocolo'}
                    </button>

                    <AnimatePresence mode="wait">
                        {message && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={cn(
                                    "p-4 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest border shadow-xl",
                                    status === 'error' ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-green-500/10 text-green-400 border-green-500/20"
                                )}
                            >
                                {status === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                                <span className="flex-1">{message}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </form>

            <div className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 items-start">
                <AlertCircle className="w-4 h-4 text-white/20 mt-0.5 shrink-0" />
                <p className="text-[10px] text-white/40 italic leading-relaxed font-medium">
                    Al activar, tus coordenadas GPS se enviarán cifradas a este número de contacto en caso de emergencia.
                </p>
            </div>
        </div>
    );
}
