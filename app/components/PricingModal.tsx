'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Crown, Zap, Shield, X, CreditCard, Star, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js';
import { useSession } from 'next-auth/react';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface PricingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PLANS = [
    {
        id: 'premium',
        name: 'Premium',
        price: '199',
        description: 'Para profesionales que buscan máxima eficiencia.',
        icon: Zap,
        color: 'text-info',
        bg: 'bg-info/10',
        border: 'border-info/20',
        features: [
            'Paradas ilimitadas',
            'Optimización con Tráfico Real',
            'Importación masiva de archivos',
            'Soporte para ventanas horarias',
            'Modo OVNI exclusivo 🛸'
        ]
    },
    {
        id: 'fleet',
        name: 'Flotilla',
        price: '899',
        description: 'Control total de tu flota y choferes.',
        icon: Crown,
        popular: true,
        color: 'text-purple-400',
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/50',
        features: [
            'Todo lo de Premium',
            'Importación masiva ilimitada',
            'Panel de Administración Avanzado',
            'Monitoreo GPS en vivo de flota',
            'Reportes de rendimiento por chofer',
            'API para integraciones'
        ]
    }
];

const PricingModal = ({ isOpen, onClose }: PricingModalProps) => {
    const [selectedPlan, setSelectedPlan] = useState<typeof PLANS[0] | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [checkoutClientSecret, setCheckoutClientSecret] = useState<string | null>(null);
    const [checkoutError, setCheckoutError] = useState<string | null>(null);
    const { update, data: session } = useSession();
    const currentUser = (session?.user as any) || {};
    const currentPlan = currentUser.plan || 'free';
    const currentStatus = currentUser.subscriptionStatus || 'none';
    const isAdminGranted = !!currentUser.adminGranted;
    const hasActivePlan = isAdminGranted || (currentPlan !== 'free' && (currentStatus === 'active' || currentStatus === 'trialing'));
    const isFleetUser = hasActivePlan && currentPlan === 'fleet';
    const isPremiumUser = hasActivePlan && !isFleetUser && !isAdminGranted && currentPlan === 'premium';
    const isCurrentPlan = (planId: string) => {
        if (!hasActivePlan) return false;
        if (isAdminGranted) return planId === 'premium';
        return currentPlan === planId;
    };

    const handlePaymentSuccess = async () => {
        try {
            // El webhook de Stripe puede tardar unos segundos en activar el plan.
            // Reintentamos leyendo la BD hasta que el plan quede activo.
            const MAX_ATTEMPTS = 5;
            let data: any = null;
            for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
                const response = await fetch('/api/user/subscription', { cache: 'no-store' });
                if (response.ok) data = await response.json();
                const isActive = data && (data.plan !== 'free' && (data.subscriptionStatus === 'active' || data.subscriptionStatus === 'trialing'));
                if (isActive) break;
                await new Promise(r => setTimeout(r, 2000));
            }
            await update({
                plan: data?.plan,
                subscriptionStatus: data?.subscriptionStatus,
                subscriptionExpiry: data?.subscriptionExpiry || null,
            });
            toast.success('¡Pago procesado correctamente! Tu plan ya está activo.');
        } catch (error) {
            console.error('Error refreshing subscription after payment:', error);
            toast.error('El pago se procesó, pero no se pudo actualizar tu plan. Recarga la página.');
        } finally {
            onClose();
        }
    };

    const handleBackToPlans = () => {
        setCheckoutClientSecret(null);
        setSelectedPlan(null);
        setCheckoutError(null);
    };

    const handlePlanSelection = async (plan: typeof PLANS[0]) => {
        setSelectedPlan(plan);
        setIsProcessing(true);
        setCheckoutError(null);

        try {
            const response = await fetch('/api/payments/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planName: plan.name, planId: plan.id, mode: 'embedded' })
            });

            const data = await response.json();
            if (data.clientSecret) {
                setCheckoutClientSecret(data.clientSecret);
                return;
            }
            if (data.url) {
                window.location.href = data.url;
                return;
            }
            if (data.redirect) {
                window.location.href = data.redirect;
                return;
            }
            const msg = 'Error al iniciar suscripción: ' + (data.error || 'Intenta de nuevo');
            setCheckoutError(msg);
            toast.error(msg);
        } catch (error) {
            console.error(error);
            const msg = 'Error de conexión con la pasarela de pagos';
            setCheckoutError(msg);
            toast.error(msg);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[300] flex items-start sm:items-center justify-center p-2 sm:p-6 overflow-y-auto">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md"
                    />

                    {checkoutClientSecret ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-[calc(100vw-1rem)] sm:max-w-[560px] bg-[#0a0a0a] border border-white/10 rounded-[28px] sm:rounded-[40px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] overflow-hidden my-auto flex flex-col max-h-[90vh]"
                        >
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-info to-transparent opacity-50 shrink-0" />

                            <div className="relative shrink-0 p-5 sm:p-8 pb-2 sm:pb-4">
                                <button
                                    onClick={handleBackToPlans}
                                    className="absolute top-4 sm:top-6 left-4 sm:left-6 p-2 sm:p-4 bg-white/5 hover:bg-white/10 rounded-xl sm:rounded-2xl transition-all z-10"
                                >
                                    <ArrowLeft className="w-4 h-4 sm:w-6 sm:h-6 text-white/60" />
                                </button>
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 sm:top-6 right-4 sm:right-6 p-2 sm:p-4 bg-white/5 hover:bg-white/10 rounded-xl sm:rounded-2xl transition-all z-10"
                                >
                                    <X className="w-4 h-4 sm:w-6 sm:h-6 text-white/60" />
                                </button>

                                <div className="text-center mb-4 pt-14 sm:pt-10">
                                    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-info/10 text-info rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
                                        <CreditCard className="w-3 h-3" /> Pago Seguro
                                    </span>
                                    <h2 className="text-xl sm:text-3xl font-black text-white italic tracking-tighter uppercase">{selectedPlan?.name}</h2>
                                    <p className="text-white/60 text-xs mt-1">${selectedPlan?.price} MXN / mes — proceso cifrado con Stripe SSL</p>
                                </div>

                                {checkoutError && (
                                    <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest text-center">
                                        {checkoutError}
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar px-5 sm:px-8 pb-6 sm:pb-10">
                                <EmbeddedCheckoutProvider
                                    stripe={stripePromise}
                                    options={{ clientSecret: checkoutClientSecret, onComplete: handlePaymentSuccess }}
                                >
                                    <EmbeddedCheckout className="checkout-embedded" />
                                </EmbeddedCheckoutProvider>

                                <p className="text-[10px] text-center text-white/50 mt-5 leading-relaxed">
                                    Tus pagos se procesan de forma segura a través de Stripe.<br />
                                    No almacenamos los datos de tu tarjeta.
                                </p>
                            </div>
                        </motion.div>
                    ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-[calc(100vw-1rem)] sm:max-w-[900px] bg-[#0a0a0a] border border-white/10 rounded-[32px] sm:rounded-[48px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] overflow-hidden my-auto"
                    >

                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-info to-transparent opacity-50" />

                        <div className="relative p-5 sm:p-8 md:p-12">
                            <button
                                onClick={onClose}
                                className="absolute top-4 sm:top-6 right-4 sm:right-6 p-2 sm:p-4 bg-white/5 hover:bg-white/10 rounded-xl sm:rounded-2xl transition-all z-10"
                            >
                                <X className="w-4 h-4 sm:w-6 sm:h-6 text-white/60" />
                            </button>

                            <div className="text-center mb-8 sm:mb-12">
                                <motion.div
                                    initial={{ y: -20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-info/10 text-info rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest mb-4"
                                >
                                    <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-info" />
                                    Acceso Ilimitado
                                </motion.div>
                                <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white italic tracking-tighter uppercase mb-4">
                                    {isFleetUser ? (
                                        <>Tu plan <span className="text-purple-400">Flotilla</span> está activo</>
                                    ) : isPremiumUser ? (
                                        <>Mejora a <span className="text-purple-400">Flotilla</span></>
                                    ) : (
                                        <>Mejora tu <span className="text-info">Productividad</span></>
                                    )}
                                </h2>
                                <p className="text-white/70 text-sm max-w-md mx-auto">
                                    {isFleetUser
                                        ? 'Ya disfrutas de todos los beneficios. No hay planes superiores disponibles.'
                                        : isPremiumUser
                                        ? 'Tu plan Premium está activo. Sube a Flotilla para gestionar choferes y monitorear tu flota en vivo.'
                                        : 'Desbloquea herramientas de optimización avanzada y gestión de flota para llevar tu logística al siguiente nivel.'}
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                                    {isFleetUser ? (
                                        <div className="col-span-full text-center py-12 sm:py-16">
                                            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-5 sm:mb-6">
                                                <Crown className="w-7 h-7 sm:w-10 sm:h-10 text-purple-400" />
                                            </div>
                                            <h3 className="text-xl sm:text-2xl font-black text-white italic tracking-tighter uppercase mb-2">Ya tienes el plan máximo</h3>
                                            <p className="text-white/50 text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
                                                Tu plan <span className="text-purple-400 font-bold">Flotilla</span> incluye todo lo de HormiRuta. No hay planes superiores que contratar.
                                            </p>
                                        </div>
                                    ) : (
                                    PLANS.filter((plan) => {
                                        if (isPremiumUser) return plan.id === 'fleet';
                                        return true;
                                    }).map((plan) => {
                                        const Icon = plan.icon;
                                        const isSelected = selectedPlan?.id === plan.id;

                                        return (
                                            <motion.div
                                                key={plan.id}
                                                whileHover={{ y: -5 }}
                                                className={cn(
                                                    "relative p-5 sm:p-8 rounded-[28px] sm:rounded-[40px] border transition-all duration-500 group overflow-hidden cursor-pointer flex flex-col",
                                                    isSelected ? plan.border + " bg-white/5" : "border-white/5 bg-white/[0.02] hover:border-white/10"
                                                )}
                                                onClick={() => handlePlanSelection(plan)}
                                            >
                                                <div className={cn(
                                                    "absolute -top-10 -right-10 w-40 h-40 blur-[80px] opacity-20 transition-opacity duration-500",
                                                    isSelected ? "opacity-40" : "group-hover:opacity-30",
                                                    plan.color.replace('text-', 'bg-')
                                                )} />

                                                {plan.popular && (
                                                    <div className="absolute top-4 sm:top-6 right-4 sm:right-6 px-2 sm:px-3 py-0.5 sm:py-1 bg-purple-500 text-white text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-full shadow-lg">
                                                        Recomendado
                                                    </div>
                                                )}

                                                {isCurrentPlan(plan.id) && (
                                                    <div className="absolute top-4 sm:top-6 left-4 sm:left-6 px-2 sm:px-3 py-0.5 sm:py-1 bg-emerald-500 text-white text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-full shadow-lg">
                                                        Tu Plan Actual
                                                    </div>
                                                )}

                                                <div className={cn("w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 shadow-xl", plan.bg)}>
                                                    <Icon className={cn("w-5 h-5 sm:w-7 sm:h-7", plan.color)} />
                                                </div>

                                                <h3 className="text-xl sm:text-2xl font-black text-white italic tracking-tighter uppercase mb-2">{plan.name}</h3>
                                                <div className="flex items-baseline gap-1 mb-4 sm:mb-6">
                                                    <span className="text-3xl sm:text-4xl font-black text-white">${plan.price}</span>
                                                    <span className="text-[10px] sm:text-xs text-white/50 uppercase font-bold tracking-widest">MXN / Mes</span>
                                                </div>

                                                <p className="text-[10px] sm:text-xs text-white/50 mb-6 sm:mb-8 leading-relaxed">{plan.description}</p>

                                                <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 flex-1">
                                                    {plan.features.map((feature, idx) => (
                                                        <div key={idx} className="flex items-center gap-3 sm:gap-4">
                                                            <div className={cn("w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shrink-0", plan.bg)}>
                                                                <Check className={cn("w-3 h-3 sm:w-4 sm:h-4", plan.color)} strokeWidth={3} />
                                                            </div>
                                                            <span className="text-[11px] sm:text-[12px] text-white/80 font-medium">{feature}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="mt-auto">
                                                    {isCurrentPlan(plan.id) ? (
                                                        <button
                                                            disabled
                                                            className="w-full py-4 sm:py-5 rounded-xl sm:rounded-2xl font-black uppercase text-[10px] sm:text-[12px] tracking-[0.2em] transition-all flex items-center justify-center gap-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default"
                                                        >
                                                            <Check className="w-4 h-4" strokeWidth={3} />
                                                            Plan Activo
                                                        </button>
                                                    ) : (
                                                    <button
                                                onClick={() => !isCurrentPlan(plan.id) && handlePlanSelection(plan)}
                                                        disabled={isProcessing}
                                                        className={cn(
                                                            "w-full py-4 sm:py-5 rounded-xl sm:rounded-2xl font-black uppercase text-[10px] sm:text-[12px] tracking-[0.2em] transition-all flex items-center justify-center gap-3",
                                                            plan.popular
                                                                ? "bg-purple-500 text-white shadow-[0_15px_40px_rgba(168,85,247,0.4)] hover:brightness-110 active:scale-[0.98]"
                                                                : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                                                        )}
                                                    >
                                                        {isProcessing && isSelected ? (
                                                            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                                                        ) : (
                                                            <>
                                                                {isPremiumUser ? 'Mejorar a Flotilla' : 'Seleccionar Plan'}
                                                                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                            </>
                                                        )}
                                                    </button>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                    )}
                                </div>

                            <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
                                <div className="flex items-center gap-4 sm:gap-6 opacity-40">
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest">Encriptación Stripe SSL</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest">Pagos Seguros</span>
                                    </div>
                                </div>
                                <p className="text-[10px] sm:text-xs text-white/50 uppercase tracking-widest max-w-[300px] text-center md:text-right">
                                    Al suscribirte, aceptas nuestros términos de servicio. Cancela en cualquier momento desde tu perfil.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                    )}
                </div>
            )}
        </AnimatePresence>
    );
};

export default PricingModal;
