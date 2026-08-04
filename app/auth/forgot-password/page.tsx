'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();
            if (res.ok) {
                setSent(true);
                toast.success('Revisa tu correo para las instrucciones');
            } else {
                toast.error(data.error || 'Error al enviar solicitud');
            }
        } catch {
            toast.error('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

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
                    <h1 className="text-2xl font-bold text-white tracking-tight">Recuperar contraseña</h1>
                    <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-1">Te enviaremos instrucciones a tu correo</p>
                </div>

                <div className="glass-panel p-6 space-y-5">
                    {sent ? (
                        <div className="text-center py-8 space-y-4">
                            <div className="w-16 h-16 bg-info/10 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle className="w-8 h-8 text-info" />
                            </div>
                            <p className="text-white/70 text-sm font-medium">Revisa tu bandeja de entrada</p>
                            <p className="text-white/60 text-xs">Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.</p>
                            <Link href="/auth/login" className="inline-flex items-center gap-2 text-info hover:text-blue-300 text-xs font-bold mt-4 transition-colors">
                                <ArrowLeft className="w-4 h-4" /> Volver al inicio de sesión
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-300 ml-1 uppercase">Correo electrónico</label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="tu@correo.com"
                                        className="w-full input-premium py-2.5 pl-10 pr-4 text-xs"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 btn-primary text-xs font-bold flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enviar instrucciones'}
                            </button>

                            <Link href="/auth/login" className="flex items-center justify-center gap-2 text-slate-400 hover:text-white text-[10px] font-medium transition-colors">
                                <ArrowLeft className="w-3.5 h-3.5" /> Volver al inicio de sesión
                            </Link>
                        </form>
                    )}
                </div>
            </motion.div>
            <p className="absolute bottom-3 left-0 right-0 text-center text-white/40 text-[10px] sm:text-xs">&copy; {new Date().getFullYear()} Jandosoft. Todos los derechos reservados.</p>
        </div>
    );
}
