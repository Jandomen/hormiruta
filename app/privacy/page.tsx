'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Eye, Lock, Globe, ChevronLeft, MapPin, CreditCard, Mail, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PrivacyPage() {
    const router = useRouter();

    const sections = [
        {
            icon: MapPin,
            title: "Datos de Ubicación",
            content: "Recopilamos su ubicación precisa en segundo plano solo cuando la aplicación está en modo activo de navegación. Estos datos son vitales para calcular tiempos de llegada y optimizar sus rutas logísticas en tiempo real."
        },
        {
            icon: Eye,
            title: "Visibilidad de Flota",
            content: "Su posición puede ser compartida de forma anónima con otros miembros de su organización bajo el modo 'Monillos'. Esto permite una coordinación transparente, similar a la visualización de tráfico en plataformas sociales."
        },
        {
            icon: CreditCard,
            title: "Seguridad Financiera",
            content: "Los pagos son procesados íntegramente por Stripe. HormiRuta no almacena ni tiene acceso a sus números de tarjeta de crédito o códigos de seguridad. Solo recibimos confirmación de la transacción exitosa. HormiRuta no se responsabiliza por errores, retrasos o fallos en el procesamiento de pagos por parte de Stripe o de su institución bancaria."
        },
        {
            icon: Shield,
            title: "Protección de Datos",
            content: "Utilizamos cifrado de grado militar (AES-256) para proteger la información de sus paradas, clientes y rutas guardadas. Sus datos nunca serán vendidos a terceros para fines publicitarios."
        }
    ];

    return (
        <div className="min-h-screen bg-[#0B1121] text-white p-2 sm:p-6 lg:p-12 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] bg-info/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[150px]" />
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
                            <h1 className="text-[11px] sm:text-2xl font-black italic tracking-tighter uppercase">Privacidad</h1>
                            <p className="text-[10px] sm:text-xs text-info font-bold uppercase tracking-[0.3em]">Guardian v1.0</p>
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
                            <span className="text-[10px] sm:text-xs font-black text-info uppercase tracking-widest">Compromiso de Transparencia</span>
                        </div>
                        <h2 className="text-lg sm:text-3xl lg:text-4xl font-black italic tracking-tight uppercase leading-none">Aviso de Privacidad <br className="hidden sm:block" /><span className="text-info">y Seguridad de Datos</span></h2>
                    </div>

                    <p className="text-white/70 text-xs sm:text-sm leading-relaxed max-w-2xl">
                        En HormiRuta, entendemos que su información logística es el corazón de su negocio. Nos comprometemos a proteger cada coordenada y cada dato personal con los más altos estándares de seguridad tecnológica.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-8">
                        {sections.map((section, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="p-3 sm:p-6 lg:p-8 bg-white/5 border border-white/5 rounded-xl sm:rounded-[32px] hover:border-info/20 transition-all group"
                            >
                                <div className="w-6 h-6 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-info/10 rounded-lg sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-4 lg:mb-6 group-hover:scale-110 transition-transform">
                                    <section.icon className="w-3 h-3 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-info" />
                                </div>
                                <h3 className="text-[10px] sm:text-sm font-black uppercase tracking-tight mb-1.5 sm:mb-3 text-white">
                                    {section.title}
                                </h3>
                                <p className="text-white/60 text-[10px] sm:text-xs leading-relaxed font-medium">
                                    {section.content}
                                </p>
                            </motion.div>
                        ))}
                    </div>

                    <div className="pt-4 sm:pt-12 border-t border-white/5 flex flex-col lg:flex-row items-center justify-between gap-3 sm:gap-8 text-center lg:text-left">
                        <div className="flex items-center gap-1.5 sm:gap-4">
                            <div className="w-6 h-6 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                                <Mail className="w-3 h-3 sm:w-5 sm:h-5 text-info" />
                            </div>
                            <div>
                                <p className="text-[10px] sm:text-xs font-bold text-white/60 uppercase tracking-widest mb-0.5 sm:mb-1">Centro de Ayuda:</p>
                                <p className="text-[10px] sm:text-base font-black text-white italic">soporte@hormiruta.com</p>
                            </div>
                        </div>

                        <div className="flex gap-3 sm:gap-4">
                            <Link
                                href="/terms"
                                className="px-3 sm:px-8 py-2 sm:py-4 bg-white/5 border border-white/10 rounded-lg sm:rounded-2xl hover:bg-white/10 transition-all"
                            >
                                <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest">Términos de Uso</span>
                            </Link>
                        </div>
                    </div>
                </motion.div>

                {/* Footer Copy */}
                <p className="text-center mt-4 sm:mt-12 text-[10px] sm:text-xs font-bold text-white/50 uppercase tracking-[0.4em]">
                    HormiRuta &copy; {new Date().getFullYear()}. Todos los derechos reservados.
                </p>
            </div>
        </div>
    );
}
