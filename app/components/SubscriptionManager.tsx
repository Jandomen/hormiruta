'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    CreditCard, Calendar, Shield, Zap, AlertTriangle, 
    CheckCircle, XCircle, ChevronRight, ArrowRight,
    Star, Crown, Gift, Loader2, Info
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { cn } from '../lib/utils';

interface SubscriptionManagerProps {
    onUpgrade?: () => void;
}

export default function SubscriptionManager({ onUpgrade }: SubscriptionManagerProps) {
    const { data: session, update } = useSession();
    const [isCancelling, setIsCancelling] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pricingPlans, setPricingPlans] = useState<any[]>([]);

    useEffect(() => {
        fetch('/api/pricing')
            .then(r => r.json())
            .then(d => { if (d.plans) setPricingPlans(d.plans); })
            .catch(() => {});
    }, []);

    const user = session?.user as any;
    const plan = user?.plan || 'free';
    const status = user?.subscriptionStatus || 'none';
    const expiry = user?.subscriptionExpiry;
    const createdAt = user?.createdAt;

    const planCfg = pricingPlans.find(p => p.id === plan);
    const planName = planCfg?.name || (plan === 'fleet' ? 'Plan Flotilla' : plan === 'premium' ? 'Plan Premium' : 'Plan Gratuito');
    const planPrice = planCfg ? `$${planCfg.price} MXN` : (plan === 'premium' ? '$199 MXN' : plan === 'fleet' ? '$899 MXN' : '$0.00 MXN');
    const planPeriod = planCfg?.durationDays > 0 ? `/ ${planCfg.durationDays} días` : '/ mes';

    const isPro = ((status === 'active' || status === 'trialing') && plan !== 'free') || user?.adminGranted === true;
    const isFree = (plan === 'free' || status === 'none' || status === 'expired') && !user?.adminGranted;
    
    const getTrialDaysLeft = () => {
        if (!expiry) return 0;
        const diff = new Date(expiry).getTime() - new Date().getTime();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    };

    const handleCancel = async () => {
        setIsCancelling(true);
        setError(null);
        try {
            const res = await fetch('/api/payments/stripe/cancel-subscription', {
                method: 'POST'
            });
            const data = await res.json();
            if (res.ok) {
                await update({ subscriptionStatus: 'expired' });
                setShowConfirm(false);
            } else {
                throw new Error(data.error || 'Err: 502');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsCancelling(false);
        }
    };

    return (
        <div className="space-y-4 sm:space-y-6 overflow-x-hidden">
            <div className="relative overflow-hidden p-3 sm:p-6 rounded-2xl sm:rounded-[32px] bg-gradient-to-br from-white/5 to-transparent border border-white/5">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-info/10 blur-[100px] rounded-full" />
                
                <div className="relative flex items-center justify-between mb-4 sm:mb-8">
                    <div className="flex items-center gap-2 sm:gap-4">
                        <div className={cn(
                            "w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-2xl",
                            isPro ? "bg-info/20 text-info" : "bg-white/5 text-white/60"
                        )}>
                            {isPro ? <Crown className="w-5 h-5 sm:w-7 sm:h-7" /> : <Star className="w-5 h-5 sm:w-7 sm:h-7" />}
                        </div>
                        <div>
                            <h4 className="text-sm sm:text-xl font-black text-white italic uppercase tracking-tight">
                                {plan === 'free' ? 'Plan Gratuito' : planName}
                            </h4>
                            <p className="text-[10px] sm:text-xs font-black text-info uppercase tracking-[0.2em] opacity-80">
                                {status === 'active' ? 'Suscripción Activa' : status === 'trialing' ? 'Periodo de Prueba' : 'Cuenta Limitada'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-8">
                    <div className="bg-black/40 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/5">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2 opacity-40">
                            <CreditCard className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-info" />
                            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-white">Costo</span>
                        </div>
                        <p className="text-[11px] sm:text-sm font-black text-white italic">
                            {planPrice}
                            <span className="text-[10px] sm:text-xs text-white/60 ml-1">{planPeriod}</span>
                        </p>
                    </div>
                    <div className="bg-black/40 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/5">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2 opacity-40">
                            <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-info" />
                            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-white">Estado</span>
                        </div>
                        <p className="text-[11px] sm:text-sm font-black text-white italic">
                            {status === 'active' ? 'Vigente' : status === 'trialing' ? `${getTrialDaysLeft()} Días Rest.` : 'Sin suscripción'}
                        </p>
                    </div>
                </div>

                {isFree && (
                    <div className="bg-amber-500/10 border border-amber-500/20 p-3 sm:p-4 rounded-xl sm:rounded-2xl mb-4 sm:mb-8 flex items-start gap-2 sm:gap-4">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                            <Info className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500" />
                        </div>
                        <div className="space-y-0.5 sm:space-y-1">
                            <p className="text-[10px] sm:text-xs font-bold text-amber-500 uppercase tracking-tight">Limites del Plan Gratuito</p>
                            <p className="text-[10px] sm:text-xs text-white/70 leading-relaxed">
                                Estás usando el plan gratuito. Tienes un límite de 10 paradas por ruta, 3 rutas guardadas y 15 cargas masivas por mes. Al ser Pro, los límites son ilimitados.
                            </p>
                        </div>
                    </div>
                )}

                {isFree && onUpgrade && (
                    <button
                        onClick={onUpgrade}
                        className="w-full py-3 sm:py-4 mb-4 sm:mb-8 bg-gradient-to-r from-info to-indigo-500 text-dark font-black uppercase tracking-widest text-[10px] sm:text-xs rounded-xl sm:rounded-2xl shadow-[0_10px_30px_rgba(96,165,250,0.3)] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        Mejorar Plan <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                )}

                {isPro && !showConfirm && (
                    <button 
                        onClick={() => setShowConfirm(true)}
                        className="w-full py-3 sm:py-4 text-[10px] sm:text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-500/5 transition-all rounded-lg sm:rounded-xl"
                    >
                        Cancelar Suscripción
                    </button>
                )}

                <AnimatePresence>
                    {showConfirm && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="space-y-3 sm:space-y-4"
                        >
                            <div className="p-3 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-xl sm:rounded-2xl space-y-1.5 sm:space-y-2">
                                <div className="flex items-center gap-1.5 sm:gap-2 text-red-500">
                                    <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest italic">¿Estás seguro?</span>
                                </div>
                                <p className="text-[10px] sm:text-xs text-white/70 leading-relaxed">
                                    Perderás el acceso a la optimización de más de 10 puntos y datos de tráfico en tiempo real. 
                                </p>
                            </div>
                            <div className="flex gap-1.5 sm:gap-2">
                                <button 
                                    onClick={() => setShowConfirm(false)}
                                    className="flex-1 py-3 sm:py-4 bg-white/5 text-white text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-lg sm:rounded-xl hover:bg-white/10 transition-all"
                                >
                                    Mantener Plan
                                </button>
                                <button 
                                    onClick={handleCancel}
                                    disabled={isCancelling}
                                    className="flex-1 py-3 sm:py-4 bg-red-500 text-white text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-lg sm:rounded-xl shadow-[0_10px_30px_rgba(239,68,68,0.3)] flex items-center justify-center gap-1.5 sm:gap-2"
                                >
                                    {isCancelling ? <Loader2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" /> : 'Confirmar'}
                                </button>
                            </div>
                            {error && <p className="text-[10px] sm:text-xs text-red-500 text-center uppercase font-black">{error}</p>}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            <div className="p-3 sm:p-6 rounded-2xl sm:rounded-[32px] border border-white/5 space-y-3 sm:space-y-4">
                <p className="text-[10px] sm:text-xs font-black text-white/60 uppercase tracking-[0.2em] pl-1">Ventajas de ser Pro</p>
                <div className="space-y-2 sm:space-y-3">
                    {[
                        { icon: Zap, text: 'Optimización Ilimitada (+10 paradas)' },
                        { icon: Shield, text: 'Tráfico Real de Google Maps' },
                        { icon: Gift, text: 'Acceso a todas las Flotillas' }
                    ].map((feat, i) => (
                        <div key={i} className="flex items-center gap-2 sm:gap-4 opacity-50 min-w-0">
                            <div className="w-5 h-5 sm:w-8 sm:h-8 rounded-lg bg-info/10 flex items-center justify-center shrink-0">
                                <feat.icon className="w-3 h-3 sm:w-4 sm:h-4 text-info" />
                            </div>
                            <span className="text-[10px] sm:text-xs font-black text-white italic truncate">{feat.text}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
