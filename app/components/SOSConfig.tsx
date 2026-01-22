'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Phone, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SOSConfig() {
    const { data: session, update } = useSession();
    const [phone, setPhone] = useState((session?.user as any)?.sosContact || '');
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
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
                setMessage('Contacto SOS actualizado');

                await update({ sosContact: phone });
                setTimeout(() => setStatus('idle'), 3000);
            } else {
                setStatus('error');
                setMessage(data.error || 'Error al guardar');
            }
        } catch (error) {
            setStatus('error');
            setMessage('Error de conexión');
        }
    };

    return (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl space-y-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-600/20 rounded-xl flex items-center justify-center">
                    <Phone className="w-5 h-5 text-red-500" />
                </div>
                <div>
                    <h3 className="text-white font-bold">Protocolo SOS Personalizado</h3>
                    <p className="text-white/40 text-[10px] uppercase tracking-wider font-medium">Empresa, Familia o Emergencias</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
                <div className="relative group">
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Número (Ej: Familia o Empresa)"
                        className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-red-500/50 transition-all placeholder:text-white/20"
                        required
                    />
                    <div className="absolute top-1/2 -translate-y-1/2 right-4 text-white/20 group-focus-within:text-red-500/50 transition-colors">
                        <Phone className="w-4 h-4" />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={status === 'saving'}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95 text-xs uppercase tracking-widest"
                >
                    {status === 'saving' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : status === 'saved' ? (
                        <CheckCircle className="w-4 h-4" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    {status === 'saving' ? 'Guardando...' : status === 'saved' ? 'Guardado' : 'Guardar Contacto'}
                </button>

                <AnimatePresence>
                    {message && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className={`flex items-center gap-2 text-xs font-bold ${status === 'error' ? 'text-red-400' : 'text-green-400'}`}
                        >
                            {status === 'error' ? <AlertCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                            {message}
                        </motion.div>
                    )}
                </AnimatePresence>
            </form>

            <p className="text-[10px] text-white/30 italic leading-tight">
                * Este número recibirá un SMS con tu ubicación en tiempo real cuando presiones el botón SOS.
            </p>
        </div>
    );
}
