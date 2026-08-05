'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Crown, Zap, Shield, X, CreditCard, Star, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

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

    const handlePlanSelection = async (plan: typeof PLANS[0]) => {
        setSelectedPlan(plan);
        setIsProcessing(true);

        try {
            const response = await fetch('/api/payments/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planName: plan.name })
            });

            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
                return;
            }
            if (data.redirect) {
                window.location.href = data.redirect;
                return;
            }
            toast.error('Error al iniciar suscripción: ' + (data.error || 'Intenta de nuevo'));
        } catch (error) {
            console.error(error);
            toast.error('Error de conexión con la pasarela de pagos');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[300] flex justify-center p-4 md:p-6 overflow-y-auto">
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
                                    Mejora tu <span className="text-info">Productividad</span>
                                </h2>
                                <p className="text-white/70 text-sm max-w-md mx-auto">
                                    Desbloquea herramientas de optimización avanzada y gestión de flota para llevar tu logística al siguiente nivel.
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                                    {PLANS.map((plan) => {
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
                                                    <button
                                                        onClick={() => handlePlanSelection(plan)}
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
                                                                Seleccionar Plan
                                                                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
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
                </div>
            )}
        </AnimatePresence>
    );
};

export default PricingModal;
