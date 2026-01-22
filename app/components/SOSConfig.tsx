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

        // Basic validation before sending
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        if (!phoneRegex.test(phone)) {
            setStatus('error');
            setMessage('Formato de número no válido (Ej: +521234567890)');
            return;
        }

        setStatus('saving');
        setMessage('');

        try {
            const res = await fetch('/api/sos/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sosContact: phone })
            });

            const data = await res.json();

            if (res.ok) {
                setStatus('saved');
                setMessage('Protocolo Sincronizado en la Nube');
                setLastSync(new Date().toLocaleTimeString());

                // Actualizar la sesión para que el botón SOS tenga los datos frescos
                await update({ sosContact: phone });

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
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-600/20 rounded-xl flex items-center justify-center">
                        <Phone className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-sm tracking-tight">SOS Inteligente</h3>
                        <p className="text-white/40 text-[9px] uppercase tracking-wider font-medium">Protocolo Directo Activo</p>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                    {lastSync && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[8px] font-black text-green-400 uppercase tracking-tighter">Sync: {lastSync}</span>
                        </div>
                    )}
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
                <div className="relative group">
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Número (Ej: +52...)"
                        className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-red-500/50 transition-all placeholder:text-white/10"
                        required
                    />
                    <div className="absolute top-1/2 -translate-y-1/2 right-4 text-white/20 group-focus-within:text-red-500/50 transition-colors">
                        <Phone className="w-4 h-4" />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={status === 'saving'}
                    className={cn(
                        "w-full font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95 text-xs uppercase tracking-widest",
                        status === 'saved' ? "bg-green-600 text-white" : "bg-red-600 hover:bg-red-700 text-white",
                        status === 'saving' && "opacity-50"
                    )}
                >
                    {status === 'saving' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : status === 'saved' ? (
                        <CheckCircle className="w-4 h-4" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    {status === 'saving' ? 'Verificando...' : status === 'saved' ? 'Sincronizado' : 'Guardar y Activar'}
                </button>

                <AnimatePresence>
                    {message && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={cn(
                                "p-3 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-tight",
                                status === 'error' ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-green-500/10 text-green-400 border border-green-500/20"
                            )}
                        >
                            {status === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            {message}
                        </motion.div>
                    )}
                </AnimatePresence>
            </form>

            <p className="text-[9px] text-white/20 italic leading-tight bg-white/5 p-3 rounded-xl border border-white/5">
                Al guardar, tus coordenadas se enviarán cifradas a este número en caso de pánico.
            </p>
        </div>
    );
}
