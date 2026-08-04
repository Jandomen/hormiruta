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
            content: "HormiRuta es una plataforma diseñada para la optimización de rutas logísticas. El usuario se compromete a utilizar la aplicación de manera responsable y exclusivamente para fines lícitos relacionados con la gestión de entregas y transporte. La precisión de las rutas depende de servicios de terceros como Google Maps y no garantizamos la exactitud absoluta de los tiempos estimados."
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
            title: "Limitación de Responsabilidad",
            content: `HormiRuta no será responsable por daños directos, indirectos, incidentales o consecuentes derivados del uso o la imposibilidad de uso de la plataforma, incluyendo pero no limitado a: multas de tránsito, accidentes, retrasos en entregas, pérdida de mercancía, o cualquier otro daño relacionado con la operación del vehículo. El conductor es el único responsable de cumplir con las leyes de tránsito y operar el vehículo de forma segura. El servicio se proporciona "tal cual" y "según disponibilidad".`
        },
        {
            icon: FileText,
            title: "Modificaciones",
            content: "Nos reservamos el derecho de modificar estos términos en cualquier momento. El uso continuado de la plataforma tras dichos cambios constituye la aceptación de los nuevos términos."
        }
    ];

    return (
        <div className="min-h-screen bg-[#0B1121] text-white p-2 sm:p-6 lg:p-12 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-info/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[150px]" />
            </div>

            <div className="max-w-4xl mx-auto relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 sm:mb-16 gap-1 sm:gap-2">
                    <button
                        onClick={() => router.back()}
                        className="p-1.5 sm:p-4 bg-white/5 border border-white/10 rounded-lg sm:rounded-2xl hover:bg-white/10 transition-all flex items-center gap-1 sm:gap-2 group"
                    >
                        <ChevronLeft className="w-3 h-3 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest">Volver</span>
                    </button>

                    <div className="flex items-center gap-1.5 sm:gap-4">
                        <div className="w-6 h-6 sm:w-12 sm:h-12 bg-info/20 rounded-lg sm:rounded-2xl flex items-center justify-center p-0.5 sm:p-2 border border-info/30 shadow-lg shadow-info/10">
                            <img src="/LogoHormiruta.png" alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <h1 className="text-[11px] sm:text-2xl font-black italic tracking-tighter uppercase">Términos</h1>
                            <p className="text-[10px] sm:text-xs text-info font-bold uppercase tracking-[0.3em]">HormiRuta v2.5</p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="premium-card p-3 sm:p-10 lg:p-16 space-y-4 sm:space-y-12 backdrop-blur-3xl border border-white/10"
                >
                    <div className="space-y-2 sm:space-y-4">
                        <div className="inline-block px-1.5 sm:px-4 py-0.5 sm:py-1.5 bg-info/10 border border-info/20 rounded-full">
                            <span className="text-[10px] sm:text-xs font-black text-info uppercase tracking-widest">Última actualización: Febrero 2026</span>
                        </div>
                        <h2 className="text-lg sm:text-3xl lg:text-4xl font-black italic tracking-tight uppercase leading-none">Acuerdo de Servicio y <br className="hidden sm:block" /><span className="text-info">Responsabilidad Logística</span></h2>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:gap-8">
                        {sections.map((section, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="flex gap-2 sm:gap-6 group"
                            >
                                <div className="shrink-0 w-6 h-6 sm:w-10 sm:h-10 lg:w-14 lg:h-14 bg-white/5 border border-white/10 rounded-lg sm:rounded-[22px] flex items-center justify-center group-hover:bg-info/10 group-hover:border-info/30 transition-all">
                                    <section.icon className="w-3 h-3 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white/70 group-hover:text-info transition-colors" />
                                </div>
                                <div className="space-y-0.5 sm:space-y-3 min-w-0">
                                    <h3 className="text-[10px] sm:text-sm lg:text-lg font-black uppercase tracking-tight italic flex items-center gap-1.5 sm:gap-3">
                                        {section.title}
                                        <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-info rounded-full shadow-[0_0_10px_rgba(96,165,250,1)] shrink-0" />
                                    </h3>
                                    <p className="text-white/70 text-[10px] sm:text-xs lg:text-sm leading-relaxed font-medium">
                                        {section.content}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="pt-4 sm:pt-12 border-t border-white/5 flex flex-col lg:flex-row items-center justify-between gap-3 sm:gap-8 text-center lg:text-left">
                        <div>
                            <p className="text-[10px] sm:text-xs font-bold text-white/60 uppercase tracking-widest mb-0.5 sm:mb-2">Para dudas legales:</p>
                            <a href="mailto:legal@hormiruta.com" className="text-[10px] sm:text-base lg:text-lg font-black text-info italic hover:underline">legal@hormiruta.com</a>
                        </div>
                        <Link
                            href="/privacy"
                            className="px-3 sm:px-10 py-2 sm:py-5 bg-white/5 border border-white/10 rounded-lg sm:rounded-2xl hover:bg-white text-dark group transition-all"
                        >
                            <div className="flex items-center gap-1.5 sm:gap-3">
                                <Lock className="w-3 h-3 sm:w-5 sm:h-5 text-info group-hover:text-dark transition-colors" />
                                <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest group-hover:text-dark transition-colors">Aviso de Privacidad</span>
                                <ExternalLink className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-white/50 group-hover:text-dark/60 transition-colors" />
                            </div>
                        </Link>
                    </div>
                </motion.div>

                {/* Footer Copy */}
                <p className="text-center mt-4 sm:mt-12 text-[10px] sm:text-xs font-bold text-white/50 uppercase tracking-[0.4em]">
                    &copy; {new Date().getFullYear()} Jandosoft. Todos los derechos reservados.
                </p>
            </div>
        </div>
    );
}
