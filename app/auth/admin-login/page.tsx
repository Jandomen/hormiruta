'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, Loader2, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await signIn('credentials', {
                redirect: false,
                email,
                password,
            });

            if (result?.error) {
                toast.error('Credenciales inválidas');
                setLoading(false);
                return;
            }

            const sessionRes = await fetch('/api/auth/session');
            const session = await sessionRes.json();

            if (session?.user?.role === 'admin') {
                router.push('/admin');
            } else {
                toast.error('Acceso denegado. Esta página es solo para administradores.');
                setLoading(false);
            }
        } catch {
            toast.error('Error de conexión');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden bg-[#060914]">
            <div className="absolute top-[-20%] left-[-20%] w-[60vw] h-[60vw] bg-info/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-[400px] relative z-10"
            >
                <div className="mb-8 text-center flex flex-col items-center">
                    <div className="relative mb-4 group">
                        <div className="absolute inset-0 bg-info/20 blur-2xl rounded-full" />
                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-white/5 border border-info/20 rounded-full flex items-center justify-center backdrop-blur-md shadow-2xl group-hover:scale-105 transition-transform">
                            <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-info" />
                        </div>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black text-white italic tracking-tighter uppercase">Admin</h1>
                    <p className="text-[10px] font-black text-info uppercase tracking-[0.4em] mt-2">Command Center</p>
                </div>

                <div className="bg-white/5 border border-white/5 rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 space-y-6 backdrop-blur-xl shadow-2xl">
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] ml-2">Correo</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@hormiruta.com"
                                className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 px-5 text-white placeholder:text-white/40 focus:outline-none focus:border-info/50 transition-all text-sm font-bold"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] ml-2">Contraseña</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 px-5 text-white placeholder:text-white/40 focus:outline-none focus:border-info/50 transition-all text-sm font-bold"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-info text-dark font-black rounded-2xl text-xs uppercase tracking-[0.2em] shadow-lg shadow-info/10 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>Acceder <ArrowRight className="w-4 h-4" /></>
                            )}
                        </button>
                    </form>

                    <div className="pt-4 text-center border-t border-white/5">
                        <a href="/auth/login" className="text-[10px] font-black text-white/60 uppercase tracking-widest hover:text-white/90 transition-colors">
                            &larr; Volver al inicio de sesión general
                        </a>
                    </div>
                </div>

                <p className="text-center mt-8 text-[10px] font-black text-white/40 uppercase tracking-[0.5em]">Hormiruta Fleet Management System</p>
            </motion.div>
        </div>
    );
}
