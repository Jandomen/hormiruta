'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';

import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '';
    const isAdminLogin = callbackUrl.includes('/admin');

    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleGoogleLogin = async () => {
        if (Capacitor.isNativePlatform()) {
            try {
                setLoading(true);
                // Check if plugin is really operational
                console.log("Iniciando Login Nativo...");

                const googleUser = await GoogleAuth.signIn();
                console.log("Usuario Google obtenido", googleUser);

                const idToken = googleUser.authentication.idToken;

                const result = await signIn('credentials', {
                    redirect: false,
                    googleIdToken: idToken,
                });

                if (result?.error) {
                    alert('Error iniciando sesión: ' + result.error);
                    setLoading(false);
                } else {
                    router.push('/dashboard');
                }
            } catch (error: any) {
                console.error("Google Native Login Error", error);
                setLoading(false);
                // If it fails with "implementation not found" it means the APP is outdated
                if (error.message?.includes('not implemented') || error.toString().includes('not implemented')) {
                    alert('⚠️ Tu App está desactualizada. Por favor reinstálala desde Android Studio para usar Google Login.');
                } else {
                    alert('Error de Google: ' + (error.message || error));
                }
            }
        } else {
            signIn('google', {
                callbackUrl: '/dashboard',
                redirect: true,
            });
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {

            const loginPromise = signIn('credentials', {
                redirect: false,
                email,
                password,
            });

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('TIMEOUT')), 15000)
            );

            const result = await Promise.race([loginPromise, timeoutPromise]) as any;

            if (result?.error) {
                console.error("[LOGIN] Sign in error:", result.error);
                alert('Error al iniciar sesión: ' + (result.error === 'CredentialsSignin' ? 'Credenciales inválidas' : result.error));
                setLoading(false);
            } else {
                console.log("[LOGIN] Success, checking role...");
                // Fetch session to check role
                const sessionRes = await fetch('/api/auth/session');
                const session = await sessionRes.json();

                if (session?.user?.role === 'admin') {
                    router.push('/admin');
                } else {
                    router.push('/dashboard');
                }
            }
        } catch (error: any) {
            console.error("[LOGIN] Exception:", error);
            if (error.message === 'TIMEOUT') {
                alert('La conexión está tardando demasiado. Por favor, verifica tu conexión a internet o intenta de nuevo en unos momentos.');
            } else {
                alert('Ocurrió un error inesperado. Por favor intenta de nuevo.');
            }
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-info/20 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[100px]"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-sm relative z-10"
            >
                <div className="mb-10 text-center">
                    <div className="relative inline-block">
                        <div className="absolute inset-0 bg-info/20 blur-2xl rounded-full animate-pulse" />
                        <div className="relative w-24 h-24 bg-black/40 border-2 border-info/30 rounded-full flex items-center justify-center p-4 backdrop-blur-md shadow-[0_0_50px_rgba(49,204,236,0.2)]">
                            <img src="/LogoHormiruta.png" alt="Logo" className="w-full h-full object-contain" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tighter mt-6 italic">HORMIRUTA</h1>
                    <p className="text-blue-200/40 mt-2 text-[10px] font-black uppercase tracking-[0.3em]">Intelligence Layer v2</p>
                </div>

                <div className="premium-card p-6 shadow-2xl backdrop-blur-xl border border-white/10">
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-white/70 ml-1 uppercase tracking-wider">Correo Electrónico</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="usuario@hormiruta.com"
                                    className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-info/50 focus:ring-1 focus:ring-info/30 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-white/70 ml-1 uppercase tracking-wider">Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-info/50 focus:ring-1 focus:ring-info/30 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-info hover:bg-info/90 text-dark font-black text-xs rounded-xl shadow-[0_0_15px_rgba(49,204,236,0.2)] transition-all flex items-center justify-center gap-2 group mt-2"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    INGRESAR
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    {!isAdminLogin && (
                        <>
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-white/10"></div>
                                </div>
                                <div className="relative flex justify-center text-[10px] uppercase">
                                    <span className="bg-[#121212] px-2 text-white/30 tracking-widest">O continúa con</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={handleGoogleLogin}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors text-white font-bold text-xs"
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.8-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12.5S6.42 23 12.1 23c5.83 0 8.84-4.15 8.84-8.83c0-.76-.15-1.25-.15-1.25z" /></svg>
                                    Continuar con Google
                                </button>
                            </div>
                        </>
                    )}
                </div>

                <p className="text-center text-white/30 text-[10px] mt-6 font-medium">
                    ¿No tienes una cuenta? <a href="/auth/register" className="text-info hover:underline">Regístrate aquí</a>
                </p>
            </motion.div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-info" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
