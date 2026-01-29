'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Crown, Zap, Shield, X, CreditCard, Star, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useSession } from 'next-auth/react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripeCheckout from './StripeCheckout';

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
            'Historial completo de rutas',
            'Soporte prioritario 24/7',
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
            'Panel de Administración Avanzado',
            'Monitoreo GPS en vivo de flota',
            'Reportes de rendimiento por chofer',
            'API para integraciones'
        ]
    }
];

const PricingModal = ({ isOpen, onClose }: PricingModalProps) => {
    const { update } = useSession();
    const [selectedPlan, setSelectedPlan] = useState<typeof PLANS[0] | null>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handlePlanSelection = async (plan: typeof PLANS[0]) => {
        setSelectedPlan(plan);
        setIsProcessing(true);
        setPaymentStatus('idle');

        try {
            const response = await fetch('/api/payments/stripe/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: parseFloat(plan.price),
                    planName: plan.name
                })
            });

            const data = await response.json();
            if (data.clientSecret) {
                setClientSecret(data.clientSecret);
            } else {
                alert('Error al iniciar el pago: ' + (data.error || 'Intenta de nuevo'));
                setPaymentStatus('error');
            }
        } catch (error) {
            console.error(error);
            setPaymentStatus('error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePaymentSuccess = async () => {
        setPaymentStatus('success');
        await update({ plan: selectedPlan?.id, subscriptionStatus: 'active' });

        setTimeout(() => {
            onClose();
            setPaymentStatus('idle');
            setSelectedPlan(null);
            setClientSecret(null);
        }, 3000);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-[900px] bg-[#0a0a0a] border border-white/10 rounded-[48px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] overflow-hidden"
                    >

                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-info to-transparent opacity-50" />

                        <div className="relative p-8 md:p-12">
                            <button
                                onClick={onClose}
                                className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all"
                            >
                                <X className="w-5 h-5 text-white/40" />
                            </button>

                            <div className="text-center mb-12">
                                <motion.div
                                    initial={{ y: -20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-info/10 text-info rounded-full text-[10px] font-black uppercase tracking-widest mb-4"
                                >
                                    <Star className="w-3 h-3 fill-info" />
                                    Acceso Ilimitado
                                </motion.div>
                                <h2 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter uppercase mb-4">
                                    Mejora tu <span className="text-info">Productividad</span>
                                </h2>
                                <p className="text-white/40 text-sm max-w-md mx-auto">
                                    Desbloquea herramientas de optimización avanzada y gestión de flota para llevar tu logística al siguiente nivel.
                                </p>
                            </div>

                            {paymentStatus === 'success' ? (
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="py-20 text-center"
                                >
                                    <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(16,185,129,0.4)]">
                                        <Check className="w-12 h-12 text-black" strokeWidth={4} />
                                    </div>
                                    <h3 className="text-3xl font-black text-white uppercase italic mb-2">¡Pago Exitoso!</h3>
                                    <p className="text-white/40 uppercase text-xs tracking-widest">Tu cuenta ha sido actualizada automáticamente.</p>
                                </motion.div>
                            ) : (
                                <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                                    {PLANS.map((plan) => {
                                        const Icon = plan.icon;
                                        const isSelected = selectedPlan?.id === plan.id;

                                        return (
                                            <motion.div
                                                key={plan.id}
                                                whileHover={{ y: -5 }}
                                                className={cn(
                                                    "relative p-8 rounded-[40px] border transition-all duration-500 group overflow-hidden cursor-pointer flex flex-col",
                                                    isSelected ? plan.border + " bg-white/5" : "border-white/5 bg-white/[0.02] hover:border-white/10"
                                                )}
                                                onClick={() => !clientSecret && handlePlanSelection(plan)}
                                            >
                                                <div className={cn(
                                                    "absolute -top-10 -right-10 w-40 h-40 blur-[80px] opacity-20 transition-opacity duration-500",
                                                    isSelected ? "opacity-40" : "group-hover:opacity-30",
                                                    plan.color.replace('text-', 'bg-')
                                                )} />

                                                {plan.popular && (
                                                    <div className="absolute top-6 right-6 px-3 py-1 bg-purple-500 text-white text-[8px] font-black uppercase tracking-widest rounded-full shadow-lg">
                                                        Recomendado
                                                    </div>
                                                )}

                                                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-xl", plan.bg)}>
                                                    <Icon className={cn("w-7 h-7", plan.color)} />
                                                </div>

                                                <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-2">{plan.name}</h3>
                                                <div className="flex items-baseline gap-1 mb-6">
                                                    <span className="text-4xl font-black text-white">${plan.price}</span>
                                                    <span className="text-xs text-white/20 uppercase font-bold tracking-widest">/ Mes</span>
                                                </div>

                                                <p className="text-xs text-white/50 mb-8 leading-relaxed">{plan.description}</p>

                                                <div className="space-y-4 mb-8 flex-1">
                                                    {plan.features.map((feature, idx) => (
                                                        <div key={idx} className="flex items-center gap-3">
                                                            <div className={cn("w-5 h-5 rounded-full flex items-center justify-center shrink-0", plan.bg)}>
                                                                <Check className={cn("w-3 h-3", plan.color)} strokeWidth={3} />
                                                            </div>
                                                            <span className="text-[11px] text-white/70 font-medium">{feature}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="mt-auto">
                                                    {isSelected && clientSecret ? (
                                                        <div className="space-y-4">
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
                                                                    amount={parseFloat(plan.price)}
                                                                    planName={plan.name}
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
                                                            className={cn(
                                                                "w-full py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all flex items-center justify-center gap-2",
                                                                plan.popular
                                                                    ? "bg-purple-500 text-white shadow-[0_10px_30px_rgba(168,85,247,0.3)] hover:brightness-110"
                                                                    : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
                                                            )}
                                                            disabled={isProcessing}
                                                        >
                                                            {isProcessing && isSelected ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <>
                                                                    Seleccionar Plan
                                                                    <ArrowRight className="w-3 h-3" />
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-6 opacity-40">
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-4 h-4" />
                                        <span className="text-[9px] font-bold uppercase tracking-widest">Encriptación Stripe SSL</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="w-4 h-4" />
                                        <span className="text-[9px] font-bold uppercase tracking-widest">Pagos Seguros</span>
                                    </div>
                                </div>
                                <p className="text-[9px] text-white/20 uppercase tracking-widest max-w-[300px] text-center md:text-right">
                                    Al suscribirte, aceptas nuestros términos de servicio. Cancela en cualquier momento desde tu perfil.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default PricingModal;
