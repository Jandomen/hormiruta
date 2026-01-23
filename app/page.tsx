'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin, TrendingUp, ShieldCheck, Zap } from 'lucide-react';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 p-4 md:px-10 flex justify-between items-center backdrop-blur-md bg-dark/30 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                    <img src="/LogoHormiruta.png" alt="Logo" className="w-8 h-8" />
                    <h1 className="text-xl font-black tracking-tighter text-white">HORMIRUTA</h1>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/pricing" className="hidden md:block px-4 py-1.5 text-xs font-bold text-white/60 hover:text-white transition-colors">
                        Precios
                    </Link>
                    <Link href="/auth/login" className="px-4 py-1.5 text-xs font-bold text-white/90 hover:text-white transition-colors hover:bg-white/5 rounded-lg">
                        Iniciar Sesión
                    </Link>
                    <Link href="/auth/register" className="px-5 py-2 bg-white text-black font-black text-xs rounded-lg hover:bg-gray-100 hover:scale-105 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all">
                        Registrarse
                    </Link>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-28 pb-16 px-6 md:px-12 flex flex-col items-center text-center">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20 z-0 bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-info/20 rounded-full blur-[100px] pointer-events-none"></div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="relative z-10 max-w-4xl mx-auto space-y-6"
                >
                    <span className="inline-block py-1 px-3 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-info uppercase tracking-widest backdrop-blur-sm">
                        Sistema de Gestión Logística Premium
                    </span>
                    <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-tight">
                        Optimiza tus rutas.<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-info to-blue-600">Maximiza tu tiempo.</span>
                    </h2>
                    <p className="text-lg text-blue-200/60 max-w-xl mx-auto leading-relaxed">
                        HORMIRUTA es la plataforma definitiva para conductores y flotillas.
                        Planificación inteligente, gastos en tiempo real y seguridad avanzada.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
                        <Link href="/dashboard" className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-info to-blue-600 text-white font-black text-base rounded-xl shadow-[0_0_20px_rgba(49,204,236,0.3)] hover:shadow-[0_0_40px_rgba(49,204,236,0.5)] hover:scale-105 transition-all flex items-center justify-center gap-2 group border border-white/20">
                            Empezar Ahora
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link href="/auth/login" className="w-full sm:w-auto px-6 py-3.5 bg-white/10 text-white font-bold text-base rounded-xl hover:bg-white/20 border border-white/10 backdrop-blur-md transition-all flex items-center justify-center hover:scale-105">
                            Iniciar Sesión
                        </Link>
                    </div>
                </motion.div>

                {/* Simulated UI Preview - High End CSS Mockup */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="mt-20 w-full max-w-6xl rounded-[40px] overflow-hidden border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] bg-[#050505] relative group aspect-[16/9]"
                >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(49,204,236,0.1),transparent)] z-0"></div>

                    {/* Mock Browser Header */}
                    <div className="h-12 bg-white/5 border-b border-white/5 flex items-center px-6 gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                        <div className="flex-1 ml-4 h-6 bg-white/5 rounded-lg border border-white/5 flex items-center px-4">
                            <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">hormiruta.app/dashboard</span>
                        </div>
                    </div>

                    {/* Mock Dashboard Content */}
                    <div className="absolute inset-0 top-12 flex">
                        {/* Mock Sidebar */}
                        <div className="w-1/4 border-r border-white/5 p-6 space-y-6">
                            <div className="w-full h-8 bg-white/5 rounded-xl"></div>
                            <div className="space-y-3">
                                <div className="w-full h-12 bg-info/20 rounded-2xl border border-info/20"></div>
                                <div className="w-full h-12 bg-white/5 rounded-2xl"></div>
                                <div className="w-full h-12 bg-white/5 rounded-2xl"></div>
                            </div>
                        </div>
                        {/* Mock Map Area */}
                        <div className="flex-1 relative p-8">
                            <div className="absolute inset-0 bg-[#0a0a0a]">
                                <div className="absolute inset-0 opacity-20 bg-[url('/grid.svg')] bg-center bg-repeat transform scale-150 rotate-12"></div>
                                {/* Mock Route Line */}
                                <svg className="absolute inset-0 w-full h-full p-20 pointer-events-none" viewBox="0 0 800 400">
                                    <motion.path
                                        d="M100 300 Q 250 50, 400 200 T 700 100"
                                        fill="none"
                                        stroke="#31CCEC"
                                        strokeWidth="8"
                                        strokeLinecap="round"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 3, repeat: Infinity }}
                                    />
                                    <circle cx="100" cy="300" r="10" fill="#31CCEC" />
                                    <circle cx="700" cy="100" r="10" fill="#31CCEC" />
                                </svg>
                            </div>
                            <div className="relative z-10 w-64 h-32 bg-black/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
                                <div className="w-1/2 h-2 bg-info rounded-full mb-4"></div>
                                <div className="w-full h-4 bg-white/10 rounded-md"></div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Features Grid */}
            <section className="py-24 px-6 md:px-12 bg-white/2">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        {
                            icon: MapPin,
                            title: "Rutas Inteligentes",
                            desc: "Algoritmos de optimización que reducen kilometraje y tiempo en carretera."
                        },
                        {
                            icon: TrendingUp,
                            title: "Control de Gastos",
                            desc: "Registro detallado de combustible, casetas y mantenimiento en tiempo real."
                        },
                        {
                            icon: ShieldCheck,
                            title: "Seguridad Total",
                            desc: "Monitoreo de flotilla, botón SOS y seguimiento de paradas en vivo."
                        }
                    ].map((feature, i) => (
                        <div key={i} className="premium-card p-8 group hover:-translate-y-2 transition-transform duration-300">
                            <div className="w-14 h-14 bg-gradient-to-br from-info to-blue-700 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-info/20">
                                <feature.icon className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                            <p className="text-white/50 leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-white/5 text-center text-white/30 text-sm">
                <p>&copy; {new Date().getFullYear()} HormiRuta Technologies. Todos los derechos reservados.</p>
            </footer>
        </div>
    );
}
