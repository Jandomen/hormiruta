'use client';

import { motion } from 'framer-motion';
import { Check, Zap, Crown, Shield, ArrowLeft, Star, Heart, Rocket } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function PricingPage() {
    const { data: session } = useSession();

    const plans = [
        {
            name: 'Gratis',
            price: '$0',
            duration: 'para siempre',
            desc: 'Ideal para conductores independientes que inician.',
            features: [
                'Hasta 10 paradas por ruta',
                'Optimización básica',
                'Botón SOS estándar',
                'Registro de gastos simple'
            ],
            cta: 'Continuar Gratis',
            link: '/dashboard',
            highlight: false,
            icon: Heart,
            color: 'from-blue-400 to-indigo-500'
        },
        {
            name: 'Premium',
            price: '$199',
            duration: 'al mes',
            desc: 'Para profesionales que buscan máxima eficiencia.',
            features: [
                'Paradas ilimitadas',
                'Optimización con Tráfico Real',
                'Historial completo de rutas',
                'Soporte prioritario 24/7',
                'Modo OVNI exclusivo 🛸'
            ],
            cta: 'Prueba 7 días gratis',
            link: '#', // Here we would link to RevenueCat/Stripe
            highlight: true,
            icon: Star,
            color: 'from-info via-blue-500 to-indigo-600'
        },
        {
            name: 'Flotilla',
            price: '$899',
            duration: 'al mes',
            desc: 'Control total de tu flota y choferes.',
            features: [
                'Todo lo de Premium',
                'Panel de Administración Avanzado',
                'Monitoreo GPS en vivo de flota',
                'Reportes de rendimiento por chofer',
                'API para integraciones'
            ],
            cta: 'Contactar Ventas',
            link: 'mailto:ventas@hormiruta.app',
            highlight: false,
            icon: Rocket,
            color: 'from-purple-500 to-pink-600'
        }
    ];

    return (
        <div className="min-h-screen bg-[#02040a] text-white font-sans selection:bg-info/30 overflow-x-hidden">
            {/* Background elements - Animated Orbs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.1, 0.15, 0.1],
                        x: [0, 50, 0],
                        y: [0, -50, 0]
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-info/20 rounded-full blur-[150px]"
                ></motion.div>
                <motion.div
                    animate={{
                        scale: [1.2, 1, 1.2],
                        opacity: [0.1, 0.05, 0.1],
                        x: [0, -30, 0],
                        y: [0, 60, 0]
                    }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[150px]"
                ></motion.div>
            </div>

            <header className="relative z-10 p-4 sm:p-8 flex justify-between items-center max-w-7xl mx-auto">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 group-hover:bg-white/10 transition-all shadow-lg backdrop-blur-md">
                        <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white/50 group-hover:text-white" />
                    </div>
                    <span className="hidden sm:block text-[10px] font-black uppercase tracking-widest text-white/50 group-hover:text-white transition-all">Volver</span>
                </Link>
                <div className="flex items-center gap-3">
                    <img src="/LogoHormiruta.png" alt="Logo" className="w-7 h-7 sm:w-8 sm:h-8 drop-shadow-lg" />
                    <h1 className="text-lg sm:text-xl font-black italic tracking-tighter">HORMIRUTA</h1>
                </div>
            </header>

            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-20 sm:pt-16 sm:pb-32">
                <div className="text-center mb-12 sm:mb-20 space-y-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl"
                    >
                        <Zap className="w-3 h-3 text-info animate-pulse" />
                        <span className="text-[9px] sm:text-[10px] font-black text-white/80 uppercase tracking-[0.2em]">Inversión Inteligente</span>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl sm:text-5xl md:text-7xl font-black italic tracking-tighter sm:leading-[1.1]"
                    >
                        POTENCIA TU LOGÍSTICA<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-info via-blue-400 to-indigo-500 drop-shadow-sm">SIN LIMITACIONES</span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-white/40 max-w-2xl mx-auto text-sm sm:text-base md:text-lg font-medium px-4"
                    >
                        Elige la suscripción que impulsará tu rentabilidad. Sincronización multi-dispositivo con el respaldo de RevenueCat.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10 lg:gap-12 perspective-1000 max-w-6xl mx-auto">
                    {plans.map((plan, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            whileHover={{ y: -10 }}
                            className={`relative p-6 sm:p-10 rounded-[40px] border transition-all duration-500 flex flex-col ${plan.highlight
                                ? 'bg-gradient-to-br from-white/[0.08] to-transparent border-info/30 shadow-[0_40px_100px_rgba(49,204,236,0.15)] z-20 scale-100 lg:scale-105'
                                : 'bg-white/[0.03] border-white/5 hover:border-white/10 z-10 backdrop-blur-md'
                                }`}
                        >
                            {plan.highlight && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-info to-blue-600 text-dark font-black text-[9px] px-6 py-2 rounded-full uppercase tracking-widest shadow-2xl z-30">
                                    MÁS POPULAR
                                </div>
                            )}

                            <div className="mb-10 flex justify-between items-start">
                                <div>
                                    <h3 className="text-2xl sm:text-3xl font-black italic tracking-tight mb-2">{plan.name}</h3>
                                    <p className="text-white/40 text-[11px] sm:text-xs leading-relaxed font-bold uppercase tracking-widest">{plan.desc}</p>
                                </div>
                                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center shadow-2xl`}>
                                    <plan.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                                </div>
                            </div>

                            <div className="mb-12 flex items-baseline gap-3">
                                <span className={`text-5xl sm:text-7xl font-black tracking-tighter ${plan.highlight ? 'text-white' : 'text-white/90'}`}>{plan.price}</span>
                                <div className="flex flex-col">
                                    <span className="text-[10px] sm:text-xs font-black text-white/20 uppercase tracking-[0.3em]">{plan.duration}</span>
                                    {plan.highlight && <span className="text-[9px] font-black text-info uppercase tracking-widest mt-1">Suscripción Mensual</span>}
                                </div>
                            </div>

                            <div className="space-y-6 mb-12 flex-1">
                                {plan.features.map((feature, j) => (
                                    <div key={j} className="flex items-start gap-5 group/item">
                                        <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shrink-0 ${plan.highlight ? 'bg-info/20 shadow-[0_0_20px_rgba(49,204,236,0.15)]' : 'bg-white/5'} transition-all group-hover/item:scale-110`}>
                                            <Check className={`w-3 h-3 sm:w-4 sm:h-4 ${plan.highlight ? 'text-info' : 'text-white/30'}`} />
                                        </div>
                                        <span className="text-[13px] sm:text-[15px] text-white/60 font-medium group-hover/item:text-white transition-colors pt-1 leading-relaxed">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <Link
                                href={plan.link}
                                className={`w-full py-5 sm:py-6 rounded-[28px] sm:rounded-[36px] text-center font-black uppercase tracking-[0.2em] text-[10px] sm:text-[12px] transition-all active:scale-95 shadow-2xl ${plan.highlight
                                        ? 'bg-gradient-to-r from-info via-blue-400 to-indigo-500 text-dark hover:brightness-110 hover:shadow-info/30'
                                        : 'bg-white/5 text-white hover:bg-white/10 border border-white/10 hover:border-white/20'
                                    }`}
                            >
                                {plan.cta}
                            </Link>
                        </motion.div>
                    ))}
                </div>

                {/* Cross-platform badge Responsive */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="mt-16 sm:mt-24 p-8 sm:p-12 bg-white/[0.02] border border-white/5 rounded-[32px] sm:rounded-[60px] flex flex-col lg:flex-row items-center justify-between gap-10 backdrop-blur-xl group hover:border-white/10 transition-colors"
                >
                    <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 text-center sm:text-left items-center sm:items-start">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-info/10 rounded-[28px] flex items-center justify-center border border-info/20 shadow-inner group-hover:scale-110 transition-transform">
                            <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-info" />
                        </div>
                        <div>
                            <h4 className="text-xl sm:text-2xl font-black italic mb-3 tracking-tight">Compra en la Web, usa en el Móvil</h4>
                            <p className="text-white/30 text-[13px] sm:text-[15px] font-medium max-w-lg leading-relaxed">
                                Tu suscripción se vincula a tu correo de HormiRuta. Gracias a <span className="text-white/60">RevenueCat</span>, tendrás acceso instantáneo en Android, iOS y Web sin costos extras.
                            </p>
                        </div>
                    </div>

                    <div className="flex bg-black/40 p-2.5 rounded-[24px] border border-white/10 shadow-2xl backdrop-blur-sm group-hover:bg-black/60 transition-colors">
                        <div className="px-5 py-4 border-r border-white/5 group/plat">
                            <svg viewBox="0 0 24 24" className="w-6 h-6 sm:w-7 sm:h-7 fill-white opacity-20 group-hover/plat:opacity-60 transition-opacity">
                                <path d="M17.05 20.28c-.96.95-2.04 1.9-3.23 1.9-1.16 0-1.54-.72-2.92-.72s-1.8.7-2.92.7c-1.14 0-2.32-1.03-3.28-1.98C2.73 18.23 1.13 14.43 1.13 11.23c0-4.8 3.12-7 6.13-7 1.6 0 3.1 1.1 4.1 1.1 1.02 0 2.22-1.12 4.1-1.12 1.34 0 4.22.46 5.86 2.87-3.3 1.8-2.76 6.3 0 7.4-1.1 2.6-2.4 5-4.27 6.9zM12.13 4.1c1.02-1.22 1.7-2.9 1.7-4.1s-1-2.9-1-2.9c0 .12-.13.25-.13.38s-.86 1.1-1.8 2.3c-1 1.25-1.7 2.8-1.7 4 0 1.25.9 2.1 1.9 2.1.2 0 .4 0 .6-.1" />
                            </svg>
                        </div>
                        <div className="px-5 py-4 border-r border-white/5 group/plat">
                            <svg viewBox="0 0 24 24" className="w-6 h-6 sm:w-7 sm:h-7 fill-white opacity-20 group-hover/plat:opacity-60 transition-opacity">
                                <path d="M17.523 15.3414l1.2415 2.1504a.4347.4347 0 01-.1592.5934.436.436 0 01-.5935-.1591l-1.2414-2.1504C15.305 16.488 13.7224 16.892 12 16.892c-1.7224 0-3.305-.404-4.7704-1.1162L5.9882 17.926a.4361.4361 0 11-.7527-.4343l1.2415-2.1504C3.899 13.8864 2 11.666 2 9.1764V8.306h20v.8704c0 2.4896-1.899 4.71-4.477 6.165zM9 12.0016a1 1 0 100-2 1 1 0 000 2zm6 0a1 1 0 100-2 1 1 0 000 2zM15.1105.753l.7712 1.3359a.436.436 0 01-.1592.5934.436.436 0 01-.5935-.1591l-.7712-1.3359A8.995 8.995 0 0012 1.108 8.995 8.995 0 009.6422 1.1873l-.7712 1.3359a.436.436 0 01-.5935.1591.436.436 0 01-.1592-.5934L8.8895.753A9 9 0 0115.1105.753z" />
                            </svg>
                        </div>
                        <div className="px-5 py-4 group/plat">
                            <svg viewBox="0 0 24 24" className="w-6 h-6 sm:w-7 sm:h-7 fill-white opacity-20 group-hover/plat:opacity-60 transition-opacity">
                                <path d="M2.218 0l1.378 12 1.404 12 13.782-4 3-20h-19.564zm15.132 19.452l-10.702 3.104-.98-12h12.662l-.98 8.896zm.268-11.452h-13.674l-.98-8h15.634l-.98 8z" />
                            </svg>
                        </div>
                    </div>
                </motion.div>
            </main>

            <footer className="relative z-10 py-16 sm:py-20 border-t border-white/5 text-center px-6 bg-black/40">
                <p className="text-white/20 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] mb-8 italic">Powering the future of logistics</p>
                <div className="flex flex-col sm:flex-row justify-center items-center gap-10 sm:gap-20 mb-12 opacity-30 filter grayscale group-hover:grayscale-0 transition-all duration-700">
                    <div className="flex items-center gap-3">
                        <svg width="28" height="28" viewBox="0 0 512 512" fill="white">
                            <path d="M432 48H80c-17.67 0-32 14.33-32 32v352c0 17.67 14.33 32 32 32h352c17.67 0 32-14.33 32-32V80c0-17.67-14.33-32-32-32zM256 368c-61.86 0-112-50.14-112-112s50.14-112 112-112 112 50.14 112 112-50.14 112-112 112z" />
                        </svg>
                        <span className="text-sm font-black tracking-widest uppercase">RevenueCat</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <svg width="80" height="32" viewBox="0 0 60 25" fill="white">
                            <path d="M59.64 14.28c0-4.59-2.29-7.16-6.22-7.16-3.71 0-6.14 2.56-6.14 7.1 0 4.91 2.52 7.19 6.44 7.19 2.02 0 3.72-.46 4.96-1.14V17.8c-1.1.5-2.33.88-3.66.88-1.9 0-3.15-.93-3.23-2.85h9.72c.06-.5.13-1.01.13-1.55zm-8.86-1.55c.06-1.61 1.2-2.62 2.61-2.62 1.5 0 2.54 1.01 2.54 2.62h-5.15zM39.34 7.12c-2.1 0-3.41 1-4.04 1.5l-.21-1.29h-3.9v18.17l4.47-.95v-4.14c.65.41 2.01 1.37 4.02 1.37 3.51 0 5.92-2.5 5.92-7.39 0-4.7-2.35-7.27-6.26-7.27zm-1.09 10.43c-1.39 0-2.22-.52-2.84-1.1V11.5c.57-.61 1.42-1.12 2.8-1.12 1.83 0 2.8 1.55 2.8 4.69.01 3.21-1 4.48-2.76 4.48zM30.43 3.42l-4.47 1.01v3.69h4.47V3.42zM25.96 21.01l4.47-.95V7.33l-4.47.95v12.73zM15.86 11.23c-1.22 0-2 .46-2.5.88l-.2-10L8.68 3.12v17.89l4.5-.95v-7.17c.54-.53 1.33-.87 2.1-.87 1.48 0 2.04.91 2.04 2.44v5.39l4.47-.95V14.1c0-4.22-2.35-6.13-5.93-6.13zM6.91 14.15c0-1.22.88-1.74 2.22-1.74 1.1 0 2.05.28 2.85.71l.01-3.64c-.81-.39-2.07-.76-3.47-.76-3.13 0-6.07 1.51-6.07 4.96 0 5.01 6.84 4.19 6.84 6.36 0 1.28-1.14 1.81-2.4 1.81-1.39 0-2.67-.44-3.7-.93v3.74c1.02.49 2.59.98 4.29.98 3.46 0 6.27-1.63 6.27-5.06 0-5.38-6.84-4.52-6.84-6.43z" />
                        </svg>
                    </div>
                </div>
                <p className="text-white/10 text-[9px] sm:text-[10px]">&copy; {new Date().getFullYear()} HormiRuta. Todos los derechos reservados.</p>
            </footer>
        </div>
    );
}
