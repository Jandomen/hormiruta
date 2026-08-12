'use client';

import React, { useState } from 'react';
import { X, KeyRound, Loader2, AlertCircle, CheckCircle2, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface JoinFleetModalProps {
    onClose: () => void;
}

export default function JoinFleetModal({ onClose }: JoinFleetModalProps) {
    const [code, setCode] = useState('');
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const join = async () => {
        if (!code.trim()) return;
        setJoining(true);
        setError(null);
        setSuccess(null);
        try {
            const res = await fetch('/api/fleet/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code.trim() }),
            });
            const data = await res.json();
            if (res.ok) {
                setSuccess(data.message || 'Te uniste a la flotilla');
                setCode('');
                setTimeout(onClose, 2000);
            } else {
                setError(data.error || 'Error al unirte a la flotilla');
            }
        } catch {
            setError('Error de conexión');
        } finally {
            setJoining(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[210] flex items-start justify-center overflow-y-auto p-4 bg-dark/60 backdrop-blur-sm"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="w-full max-w-sm my-auto bg-dark border border-white/10 rounded-[32px] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)]"
            >
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-black italic tracking-tighter text-white uppercase">Unirme a una Flotilla</h2>
                        <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mt-1">Ingresa el código que te dio tu coordinador</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/70 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs">
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                            {success}
                        </div>
                    )}

                    <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl">
                        <div className="p-2.5 bg-info/10 rounded-xl">
                            <KeyRound className="w-5 h-5 text-info" />
                        </div>
                        <input
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === 'Enter' && join()}
                            placeholder="XXXX XXXX"
                            maxLength={8}
                            className={cn(
                                "bg-transparent outline-none text-white text-lg font-black tracking-[0.25em] w-full uppercase placeholder:text-white/20"
                            )}
                        />
                    </div>

                    <button
                        onClick={join}
                        disabled={joining || code.length < 8}
                        className="w-full py-3.5 bg-info text-dark rounded-2xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-40 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {joining ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Unirme'}
                    </button>

                    <div className="flex items-start gap-2 p-3 bg-white/[0.03] border border-white/5 rounded-xl">
                        <Users className="w-3.5 h-3.5 text-white/40 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-white/50 leading-relaxed">
                            Una vez dentro, tu coordinador podrá ver tu ubicación en tiempo real para monitorear tus rutas.
                        </p>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
