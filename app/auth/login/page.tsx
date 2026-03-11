'use client';

import { useState, Suspense } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';

import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Capacitor } from '@capacitor/core';
import { useEffect } from 'react';

function LoginContent() {
    const { status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (status === 'authenticated') {
            router.push('/dashboard');
        }
    }, [status, router]);
    const callbackUrl = searchParams.get('callbackUrl') || '';
    const isAdminLogin = callbackUrl.includes('/admin');

    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleGoogleLogin = async () => {
        if (Capacitor.isNativePlatform()) {
            try {
                setLoading(true);
                console.log("[NATIVE-AUTH] Starting Google Sign-In...");

                // 1. Iniciamos login nativo con Google
                await FirebaseAuthentication.signInWithGoogle();

                // 2. IMPORTANTE: Obtenemos el token de FIREBASE (idToken con audienca del proyecto)
                const { token } = await FirebaseAuthentication.getIdToken();
                console.log("[NATIVE-AUTH] Firebase Token obtained:", token ? "YES" : "NO");

                if (token) {
                    // 3. Enviamos el token de Firebase al servidor para validación
                    const loginResult = await signIn('credentials', {
                        googleIdToken: token,
                        callbackUrl: '/dashboard',
                        redirect: false,
                    });

                    if (loginResult?.error) {
                        console.error("[NATIVE-AUTH] Server Error:", loginResult.error);
                        alert('Error: ' + loginResult.error);
                        setLoading(false);
                    } else {
                        console.log("[NATIVE-AUTH] Login Success! Forcing navigation...");

                        // En Android, a veces el estado de 'loading' bloquea el hilo principal
                        setLoading(false);

                        // Forzamos la entrada al Dashboard
                        // Usamos replace para que el usuario no pueda "volver atrás" al login
                        window.location.replace('/dashboard');

                        // Si después de 2 segundos no ha navegado, forzamos de nuevo
                        setTimeout(() => {
                            window.location.href = '/dashboard';
                        }, 2000);
                    }
                } else {
                    console.error("[NATIVE-AUTH] Failed to get Firebase token");
                    alert('Error: No se recibió token de seguridad.');
                    setLoading(false);
                }
            } catch (error: any) {
                console.error("Google Sign-In Error:", error);
                alert("Error al iniciar con Google: " + error.message);
                setLoading(false);
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
        <div className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Effects: Subtle and flowing */}
            <div className="absolute top-[-20%] left-[-20%] w-[60vw] h-[60vw] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-[400px] relative z-10"
            >
                {/* Logo Section */}
                <div className="mb-8 text-center flex flex-col items-center">
                    <div className="relative mb-6 group">
                        <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full group-hover:bg-primary/40 transition-all duration-500" />
                        <div className="relative w-28 h-28 bg-white/5 border border-white/10 rounded-full flex items-center justify-center p-6 backdrop-blur-md shadow-2xl group-hover:scale-105 transition-transform duration-300">
                            <img src="/LogoHormiruta.png" alt="Hormiruta" className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">HormiRuta</h1>
                    <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-2">Accede a tu cuenta</p>
                </div>

                {/* Login Card */}
                <div className="glass-panel p-8 space-y-6">
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-300 ml-1 uppercase">Correo electrónico</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="ejemplo@hormiruta.com"
                                    className="w-full input-premium py-3 pl-10 pr-4 text-sm"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-300 ml-1 uppercase">Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full input-premium py-3 pl-10 pr-4 text-sm"
                                    required
                                />
                            </div>
                            <div className="flex justify-between items-center text-[10px] sm:text-xs pt-1">
                                <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-white transition-colors">
                                    <input type="checkbox" className="rounded border-slate-600 bg-slate-800 text-primary focus:ring-offset-slate-900" />
                                    Recordarme
                                </label>
                                <a href="#" className="text-accent hover:text-sky-300 transition-colors font-medium">¿Olvidaste tu contraseña?</a>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 btn-primary text-sm font-bold flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                "Iniciar sesión"
                            )}
                        </button>
                    </form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-700/50"></div>
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                            <span className="bg-slate-900/40 backdrop-blur-xl px-4 text-slate-400 rounded-full border border-white/5">O inicia sesión con</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={handleGoogleLogin}
                            className="w-full flex items-center justify-center gap-3 py-3.5 bg-white text-dark font-black uppercase text-xs rounded-xl shadow-[0_10px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_15px_30px_rgba(0,0,0,0.3)] hover:scale-[1.02] transition-all active:scale-95 group"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            <span className="tracking-[0.1em]">Google</span>
                        </button>
                    </div>

                    <div className="pt-4 text-center space-y-4">
                        <p className="text-slate-400 text-xs">
                            ¿No tienes cuenta? <a href="/auth/register" className="text-accent hover:text-sky-300 font-bold hover:underline transition-colors">Regístrate aquí</a>
                        </p>
                    </div>
                </div>
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
