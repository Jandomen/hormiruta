'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin, TrendingUp, ShieldCheck, Zap } from 'lucide-react';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 p-6 md:px-12 flex justify-between items-center backdrop-blur-md bg-dark/30 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <img src="/LogoHormiruta.png" alt="Logo" className="w-10 h-10" />
                    <h1 className="text-2xl font-black tracking-tighter text-white">HORMIRUTA</h1>
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/auth/login" className="px-6 py-2 text-sm font-bold text-white/90 hover:text-white transition-colors hover:bg-white/5 rounded-lg">
                        Iniciar Sesión
                    </Link>
                    <Link href="/auth/register" className="px-6 py-2 bg-white text-black font-black rounded-xl hover:bg-gray-100 hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all">
                        Registrarse
                    </Link>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-6 md:px-12 flex flex-col items-center text-center">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20 z-0 bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-info/20 rounded-full blur-[120px] pointer-events-none"></div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="relative z-10 max-w-4xl mx-auto space-y-8"
                >
                    <span className="inline-block py-1 px-3 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-info uppercase tracking-widest backdrop-blur-sm">
                        Sistema de Gestión Logística Premium
                    </span>
                    <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-tight">
                        Optimiza tus rutas.<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-info to-blue-600">Maximiza tu tiempo.</span>
                    </h2>
                    <p className="text-xl text-blue-200/60 max-w-2xl mx-auto leading-relaxed">
                        HORMIRUTA es la plataforma definitiva para conductores y flotillas.
                        Planificación inteligente, gastos en tiempo real y seguridad avanzada.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
                        <Link href="/dashboard" className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-info to-blue-600 text-white font-black text-lg rounded-2xl shadow-[0_0_30px_rgba(49,204,236,0.4)] hover:shadow-[0_0_50px_rgba(49,204,236,0.6)] hover:scale-105 transition-all flex items-center justify-center gap-2 group border border-white/20">
                            Empezar Ahora
                            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link href="/auth/login" className="w-full sm:w-auto px-8 py-4 bg-white/10 text-white font-bold text-lg rounded-2xl hover:bg-white/20 border border-white/10 backdrop-blur-md transition-all flex items-center justify-center hover:scale-105">
                            Iniciar Sesión
                        </Link>
                    </div>
                </motion.div>

                {/* Simulated UI Preview */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="mt-20 w-full max-w-6xl rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-dark/50 backdrop-blur-sm relative group"
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transpose to-transparent z-20 pointer-events-none"></div>
                    <img src="/dashboard-preview.png" alt="Dashboard Preview" className="w-full opacity-80 group-hover:opacity-100 transition-opacity duration-700" onError={(e) => e.currentTarget.src = 'https://placehold.co/1200x600/1a1a1a/FFF?text=Dashboard+Preview'} />
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
