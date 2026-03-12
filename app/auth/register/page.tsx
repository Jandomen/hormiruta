'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { signIn, useSession } from 'next-auth/react';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Capacitor } from '@capacitor/core';

export default function RegisterPage() {
    const { status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'authenticated') {
            router.push('/dashboard');
        }
    }, [status, router]);
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleGoogleLogin = async () => {
        if (Capacitor.isNativePlatform()) {
            try {
                setLoading(true);
                await FirebaseAuthentication.signInWithGoogle();
                const { token } = await FirebaseAuthentication.getIdToken();
                if (token) {
                    const loginResult = await signIn('credentials', {
                        googleIdToken: token,
                        callbackUrl: '/dashboard',
                        redirect: false,
                    });
                    if (loginResult?.error) {
                        alert('Error: ' + loginResult.error);
                        setLoading(false);
                    } else {
                        window.location.replace('/dashboard');
                    }
                } else {
                    alert('Error: No se recibió token de seguridad.');
                    setLoading(false);
                }
            } catch (error: any) {
                alert("Error al iniciar con Google: " + error.message);
                setLoading(false);
            }
        } else {
            signIn('google', { callbackUrl: '/dashboard' });
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });

            if (res.ok) {
                router.push('/auth/login');
            } else {
                const data = await res.json();
                alert(data.message || 'Error al registrarse');
            }
        } catch (error) {
            alert('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[100px]"></div>
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-info/20 rounded-full blur-[100px]"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="mb-6 md:mb-8 text-center">
                    <img src="/LogoHormiruta.png" alt="Logo" className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 drop-shadow-[0_0_15px_rgba(49,204,236,0.3)]" />
                    <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Crear Cuenta</h1>
                    <p className="text-blue-200/50 text-[10px] md:text-sm mt-1 md:mt-2">Únete a la plataforma líder de logística</p>
                </div>

                <div className="premium-card p-6 md:p-8 shadow-2xl backdrop-blur-xl border border-white/10 max-[340px]:p-5">
                    <form onSubmit={handleRegister} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white/70 ml-1 uppercase tracking-wider">Nombre Completo</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Juan Pérez"
                                    className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 md:py-3 pl-10 pr-4 text-xs md:text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-info/50 focus:ring-1 focus:ring-info/30 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white/70 ml-1 uppercase tracking-wider">Correo Electrónico</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="usuario@hormiruta.com"
                                    className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 md:py-3 pl-10 pr-4 text-xs md:text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-info/50 focus:ring-1 focus:ring-info/30 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white/70 ml-1 uppercase tracking-wider">Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 md:py-3 pl-10 pr-4 text-xs md:text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-info/50 focus:ring-1 focus:ring-info/30 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {/* Legal Links */}
                        <div className="flex items-start gap-3 px-1">
                            <input
                                type="checkbox"
                                id="terms"
                                required
                                className="mt-1 w-4 h-4 bg-black/20 border border-white/10 rounded focus:ring-info/50"
                            />
                            <label htmlFor="terms" className="text-[10px] text-white/40 leading-relaxed">
                                Acepto el <Link href="/privacy" className="text-info hover:underline">Aviso de Privacidad</Link> y los <Link href="/terms" className="text-info hover:underline">Términos y Condiciones</Link> de HormiRuta.
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 md:py-4 bg-white text-black hover:bg-gray-100 font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group text-xs md:text-sm"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    CREAR CUENTA
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/5"></div>
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest text-white/20">
                            <span className="bg-[#0b1121] px-4">O usa tu red social</span>
                        </div>
                    </div>

                    <button
                        onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center gap-3 py-4 bg-white/5 border border-white/10 text-white font-black uppercase text-xs rounded-xl hover:bg-white/10 transition-all shadow-xl active:scale-[0.98]"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Google
                    </button>
                </div>

                <p className="text-center text-white/30 text-xs mt-8">
                    ¿Ya tienes una cuenta? <Link href="/auth/login" className="text-info hover:underline">Inicia Sesión aquí</Link>
                </p>
            </motion.div>
        </div>
    );
}
