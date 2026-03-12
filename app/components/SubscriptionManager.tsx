'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    CreditCard, Calendar, Shield, Zap, AlertTriangle, 
    CheckCircle, XCircle, ChevronRight, ArrowRight,
    Star, Crown, Gift, Loader2, Info
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { cn } from '../lib/utils';

export default function SubscriptionManager() {
    const { data: session, update } = useSession();
    const [isCancelling, setIsCancelling] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const user = session?.user as any;
    const plan = user?.plan || 'free';
    const status = user?.subscriptionStatus || 'none';
    const expiry = user?.subscriptionExpiry;
    const createdAt = user?.createdAt;

    const isPro = status === 'active' && plan !== 'free';
    const isTrial = status !== 'active' && plan === 'free';
    
    const getTrialDaysLeft = () => {
        if (!createdAt) return 0;
        const expiryDate = new Date(new Date(createdAt).getTime() + 7 * 24 * 60 * 60 * 1000);
        const diff = expiryDate.getTime() - new Date().getTime();
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
                await update({ subscriptionStatus: 'cancelled' });
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
        <div className="space-y-6">
            <div className="relative overflow-hidden p-6 rounded-[32px] bg-gradient-to-br from-white/5 to-transparent border border-white/5">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-info/10 blur-[100px] rounded-full" />
                
                <div className="relative flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl",
                            isPro ? "bg-info/20 text-info" : "bg-white/5 text-white/20"
                        )}>
                            {isPro ? <Crown className="w-7 h-7" /> : <Star className="w-7 h-7" />}
                        </div>
                        <div>
                            <h4 className="text-xl font-black text-white italic uppercase tracking-tight">
                                {isPro ? 'Plan Premium' : 'Plan Base'}
                            </h4>
                            <p className="text-[10px] font-black text-info uppercase tracking-[0.2em] opacity-60">
                                {isPro ? 'Suscripción Activa' : 'Prueba de 7 Días'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-2 mb-2 opacity-40">
                            <CreditCard className="w-3 h-3 text-info" />
                            <span className="text-[8px] font-black uppercase tracking-widest text-white">Costo</span>
                        </div>
                        <p className="text-sm font-black text-white italic">
                            {isPro ? '$199 MXN' : '$0.00 MXN'}
                            <span className="text-[9px] text-white/30 ml-1">/ mes</span>
                        </p>
                    </div>
                    <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-2 mb-2 opacity-40">
                            <Calendar className="w-3 h-3 text-info" />
                            <span className="text-[8px] font-black uppercase tracking-widest text-white">Vencimiento</span>
                        </div>
                        <p className="text-sm font-black text-white italic">
                            {isPro ? 'Próximo Mes' : `${getTrialDaysLeft()} Días Rest.`}
                        </p>
                    </div>
                </div>

                {isTrial && (
                    <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl mb-8 flex items-start gap-4">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                            <Info className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-tight">Limite de Paradas</p>
                            <p className="text-[9px] text-white/50 leading-relaxed">
                                Estas usando la prueba gratuita. Tienes un limite de 10 paradas por ruta. Al ser Pro, el limite es ilimitado.
                            </p>
                        </div>
                    </div>
                )}

                {isPro && !showConfirm && (
                    <button 
                        onClick={() => setShowConfirm(true)}
                        className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-red-500/40 hover:text-red-500 hover:bg-red-500/5 transition-all rounded-xl"
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
                            className="space-y-4"
                        >
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl space-y-2">
                                <div className="flex items-center gap-2 text-red-500">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest italic">¿Estás seguro?</span>
                                </div>
                                <p className="text-[9px] text-white/40 leading-relaxed">
                                    Perderás el acceso a la optimización de más de 10 puntos y datos de tráfico en tiempo real. 
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setShowConfirm(false)}
                                    className="flex-1 py-4 bg-white/5 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all"
                                >
                                    Mantener Plan
                                </button>
                                <button 
                                    onClick={handleCancel}
                                    disabled={isCancelling}
                                    className="flex-1 py-4 bg-red-500 text-white text-[9px] font-black uppercase tracking-widest rounded-xl shadow-[0_10px_30px_rgba(239,68,68,0.3)] flex items-center justify-center gap-2"
                                >
                                    {isCancelling ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirmar'}
                                </button>
                            </div>
                            {error && <p className="text-[8px] text-red-500 text-center uppercase font-black">{error}</p>}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            <div className="p-6 rounded-[32px] border border-white/5 space-y-4">
                <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] pl-1">Ventajas de ser Pro</p>
                <div className="space-y-3">
                    {[
                        { icon: Zap, text: 'Optimización Ilimitada (+10 paradas)' },
                        { icon: Shield, text: 'Tráfico Real de Google Maps' },
                        { icon: Gift, text: 'Acceso a todas las Flotillas' }
                    ].map((feat, i) => (
                        <div key={i} className="flex items-center gap-4 opacity-50">
                            <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center">
                                <feat.icon className="w-4 h-4 text-info" />
                            </div>
                            <span className="text-[10px] font-black text-white italic">{feat.text}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
