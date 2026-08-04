'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, CheckCircle, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

function ResetContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token') || '';

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirm) {
            toast.error('Las contraseñas no coinciden');
            return;
        }

        if (password.length < 6) {
            toast.error('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });

            const data = await res.json();
            if (res.ok) {
                setDone(true);
                toast.success('Contraseña actualizada');
                setTimeout(() => router.push('/auth/login'), 2000);
            } else {
                toast.error(data.error || 'Error al restablecer');
            }
        } catch {
            toast.error('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
                <div className="text-center space-y-4">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                    <p className="text-white/70 text-sm font-medium">Enlace inválido</p>
                    <p className="text-white/60 text-xs">Este enlace de recuperación no es válido o ya expiró.</p>
                    <Link href="/auth/login" className="inline-flex items-center gap-2 text-info hover:text-blue-300 text-xs font-bold mt-4 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Ir al inicio de sesión
                    </Link>
                </div>
                <p className="absolute bottom-3 left-0 right-0 text-center text-white/40 text-[10px] sm:text-xs">&copy; {new Date().getFullYear()} Jandosoft. Todos los derechos reservados.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute top-[-20%] left-[-20%] w-[60vw] h-[60vw] bg-info/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[400px] relative z-10"
            >
                <div className="mb-6 text-center">
                    <img src="/LogoHormiruta.png" alt="HormiRuta" className="w-14 h-14 mx-auto mb-3 drop-shadow-[0_0_15px_rgba(96,165,250,0.3)]" />
                    <h1 className="text-2xl font-bold text-white tracking-tight">Nueva contraseña</h1>
                    <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-1">Ingresa tu nueva contraseña</p>
                </div>

                <div className="glass-panel p-6 space-y-5">
                    {done ? (
                        <div className="text-center py-8 space-y-4">
                            <div className="w-16 h-16 bg-info/10 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle className="w-8 h-8 text-info" />
                            </div>
                            <p className="text-white/70 text-sm font-medium">Contraseña actualizada</p>
                            <p className="text-white/60 text-xs">Redirigiendo al inicio de sesión...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-300 ml-1 uppercase">Nueva contraseña</label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full input-premium py-2.5 pl-10 pr-4 text-xs"
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-300 ml-1 uppercase">Confirmar contraseña</label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="password"
                                        value={confirm}
                                        onChange={(e) => setConfirm(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full input-premium py-2.5 pl-10 pr-4 text-xs"
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 btn-primary text-xs font-bold flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Restablecer contraseña'}
                            </button>
                        </form>
                    )}
                </div>
            </motion.div>
            <p className="absolute bottom-3 left-0 right-0 text-center text-white/40 text-[10px] sm:text-xs">&copy; {new Date().getFullYear()} Jandosoft. Todos los derechos reservados.</p>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-info" />
            </div>
        }>
            <ResetContent />
        </Suspense>
    );
}
