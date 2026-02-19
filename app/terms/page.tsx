'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, FileText, ChevronLeft, Scale, Users, Globe, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TermsPage() {
    const router = useRouter();

    const sections = [
        {
            icon: Shield,
            title: "Uso del Servicio",
            content: "HormiRuta es una plataforma diseñada para la optimización de rutas logísticas. El usuario se compromete a utilizar la aplicación de manera responsable y exclusivamente para fines lícitos relacionados con la gestión de entregas y transporte."
        },
        {
            icon: Users,
            title: "Cuentas de Usuario",
            content: "Para acceder a ciertas funciones, es necesario crear una cuenta. Usted es responsable de mantener la confidencialidad de sus credenciales y de todas las actividades que ocurran bajo su cuenta. Nos reservamos el derecho de suspender cuentas por uso indebido."
        },
        {
            icon: Scale,
            title: "Propiedad Intelectual",
            content: "Todos los algoritmos de optimización, diseños de interfaz, logotipos y software son propiedad exclusiva de HormiRuta. Queda prohibida la reproducción total o parcial del código o diseño sin autorización expresa."
        },
        {
            icon: Globe,
            title: "Datos de Geolocalización",
            content: "Al utilizar nuestras funciones de navegación, usted consiente el rastreo de su ubicación en tiempo real para la optimización de rutas y la funcionalidad de 'monillos' (seguimiento de flota). Estos datos se anonimizan y se eliminan después de 24 horas de inactividad."
        },
        {
            icon: FileText,
            title: "Modificaciones",
            content: "Nos reservamos el derecho de modificar estos términos en cualquier momento. El uso continuado de la plataforma tras dichos cambios constituye la aceptación de los nuevos términos."
        }
    ];

    return (
        <div className="min-h-screen bg-[#0B1121] text-white p-6 lg:p-12 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-info/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[150px]" />
            </div>

            <div className="max-w-4xl mx-auto relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-16">
                    <button
                        onClick={() => router.back()}
                        className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all flex items-center gap-2 group"
                    >
                        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs font-black uppercase tracking-widest">Volver</span>
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-info/20 rounded-2xl flex items-center justify-center p-2 border border-info/30 shadow-lg shadow-info/10">
                            <img src="/LogoHormiruta.png" alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black italic tracking-tighter uppercase">Términos</h1>
                            <p className="text-[10px] text-info font-bold uppercase tracking-[0.3em]">HormiRuta v2.5</p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="premium-card p-10 lg:p-16 space-y-12 backdrop-blur-3xl border border-white/10"
                >
                    <div className="space-y-4">
                        <div className="inline-block px-4 py-1.5 bg-info/10 border border-info/20 rounded-full">
                            <span className="text-[10px] font-black text-info uppercase tracking-widest">Última actualización: Febrero 2026</span>
                        </div>
                        <h2 className="text-4xl font-black italic tracking-tight uppercase leading-none">Acuerdo de Servicio y <br /><span className="text-info">Responsabilidad Logística</span></h2>
                    </div>

                    <div className="grid grid-cols-1 gap-8">
                        {sections.map((section, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="flex gap-6 group"
                            >
                                <div className="shrink-0 w-14 h-14 bg-white/5 border border-white/10 rounded-[22px] flex items-center justify-center group-hover:bg-info/10 group-hover:border-info/30 transition-all">
                                    <section.icon className="w-6 h-6 text-white/40 group-hover:text-info transition-colors" />
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-lg font-black uppercase tracking-tight italic flex items-center gap-3">
                                        {section.title}
                                        <div className="w-1.5 h-1.5 bg-info rounded-full shadow-[0_0_10px_rgba(49,204,236,1)]" />
                                    </h3>
                                    <p className="text-white/50 text-sm leading-relaxed font-medium">
                                        {section.content}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="pt-12 border-t border-white/5 flex flex-col lg:flex-row items-center justify-between gap-8 text-center lg:text-left">
                        <div>
                            <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-2">Para dudas legales:</p>
                            <a href="mailto:legal@hormiruta.com" className="text-lg font-black text-info italic hover:underline">legal@hormiruta.com</a>
                        </div>
                        <Link
                            href="/privacy"
                            className="px-10 py-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white text-dark group transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <Lock className="w-5 h-5 text-info group-hover:text-dark transition-colors" />
                                <span className="text-xs font-black uppercase tracking-widest group-hover:text-dark transition-colors">Aviso de Privacidad</span>
                                <ExternalLink className="w-4 h-4 text-white/20 group-hover:text-dark/40 transition-colors" />
                            </div>
                        </Link>
                    </div>
                </motion.div>

                {/* Footer Copy */}
                <p className="text-center mt-12 text-[10px] font-bold text-white/20 uppercase tracking-[0.4em]">
                    Copyright © 2026 HormiRuta Technologies Inc. Todos los derechos reservados.
                </p>
            </div>
        </div>
    );
}
