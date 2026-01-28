'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, ArrowLeft, Star, Heart, Rocket, Loader2, Shield } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripeCheckout from '../components/StripeCheckout';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

export default function PricingPage() {
    const { data: session, update } = useSession();
    const router = useRouter();
    const [selectedPlan, setSelectedPlan] = useState<{ name: string, price: number } | null>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handlePlanSelection = async (planName: string, price: string) => {
        if (!session) {
            router.push('/auth/login?callbackUrl=/pricing');
            return;
        }

        const numericPrice = parseFloat(price.replace('$', ''));
        if (numericPrice === 0) {
            router.push('/dashboard');
            return;
        }

        setSelectedPlan({ name: planName, price: numericPrice });
        setIsProcessing(true);

        try {
            const response = await fetch('/api/payments/stripe/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: numericPrice,
                    planName: planName
                })
            });

            const data = await response.json();
            if (data.clientSecret) {
                setClientSecret(data.clientSecret);
            } else {
                alert('Error al iniciar el pago: ' + (data.error || 'Intenta de nuevo'));
                setSelectedPlan(null);
            }
        } catch (error) {
            console.error(error);
            alert('Error de conexión con la pasarela de pagos');
            setSelectedPlan(null);
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePaymentSuccess = async () => {
        await update({ plan: 'premium', subscriptionStatus: 'active' });
        alert('¡Pago exitoso! Tu suscripción ha sido activada.');
        router.push('/dashboard');
    };

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
            link: '#',
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
                <Link href={session ? "/dashboard" : "/"} className="flex items-center gap-2 group">
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
                        Elige la suscripción que impulsará tu rentabilidad. Sincronización multi-dispositivo y acceso premium instantáneo.
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

                            {plan.price === '$0' ? (
                                <Link
                                    href={plan.link}
                                    className={`w-full py-5 sm:py-6 rounded-[28px] sm:rounded-[36px] text-center font-black uppercase tracking-[0.2em] text-[10px] sm:text-[12px] transition-all active:scale-95 shadow-2xl bg-white/5 text-white hover:bg-white/10 border border-white/10 hover:border-white/20`}
                                >
                                    {plan.cta}
                                </Link>
                            ) : selectedPlan?.name === plan.name && clientSecret ? (
                                <div className="w-full">
                                    <Elements stripe={stripePromise} options={{
                                        clientSecret,
                                        appearance: {
                                            theme: 'night',
                                            variables: {
                                                colorPrimary: '#3b82f6',
                                                colorBackground: '#1e293b',
                                                colorText: '#ffffff',
                                            }
                                        }
                                    }}>
                                        <StripeCheckout
                                            amount={selectedPlan.price}
                                            planName={selectedPlan.name}
                                            onSuccess={handlePaymentSuccess}
                                            onCancel={() => {
                                                setSelectedPlan(null);
                                                setClientSecret(null);
                                            }}
                                        />
                                    </Elements>
                                </div>
                            ) : (
                                <button
                                    onClick={() => handlePlanSelection(plan.name, plan.price)}
                                    disabled={isProcessing && selectedPlan?.name === plan.name}
                                    className={`w-full py-5 sm:py-6 rounded-[28px] sm:rounded-[36px] text-center font-black uppercase tracking-[0.2em] text-[10px] sm:text-[12px] transition-all active:scale-95 shadow-2xl ${plan.highlight
                                        ? 'bg-gradient-to-r from-info via-blue-400 to-indigo-500 text-dark hover:brightness-110 hover:shadow-info/30'
                                        : 'bg-white/5 text-white hover:bg-white/10 border border-white/10 hover:border-white/20'
                                        } flex items-center justify-center gap-2`}
                                >
                                    {isProcessing && selectedPlan?.name === plan.name ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            {plan.cta} ({plan.price})
                                        </>
                                    )}
                                </button>
                            )}
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
                                Tu suscripción se vincula a tu correo de HormiRuta. Tendrás acceso instantáneo en Android y Web sin costos extras.
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
                <p className="text-white/20 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] mb-8 italic">El poder de la logistica</p>
                <p className="text-white/10 text-[9px] sm:text-[10px]">&copy; {new Date().getFullYear()} Jandosoft. Todos los derechos reservados.</p>
            </footer>
        </div>
    );
}
