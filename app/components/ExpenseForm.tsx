'use client';

import React, { useState } from 'react';
import { Fuel, Receipt, Wrench, Plus, X, DollarSign, Loader2, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface ExpenseFormProps {
    onAddExpense: (expense: any) => Promise<boolean>;
    onClose: () => void;
}

const ExpenseForm = ({ onAddExpense, onClose }: ExpenseFormProps) => {
    const [type, setType] = useState<'FUEL' | 'TOLL' | 'MAINTENANCE' | 'OTHER'>('FUEL');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || status !== 'idle') return;

        setStatus('saving');
        const success = await onAddExpense({
            type,
            amount: parseFloat(amount),
            description,
            date: new Date(),
        });

        if (success) {
            setStatus('saved');
            setTimeout(() => onClose(), 1000);
        } else {
            setStatus('idle');
        }
    };

    const types = [
        { id: 'FUEL', label: 'Gasolina', icon: Fuel, color: 'text-orange-400' },
        { id: 'TOLL', label: 'Casetas', icon: Receipt, color: 'text-blue-400' },
        { id: 'MAINTENANCE', label: 'Taller', icon: Wrench, color: 'text-green-400' },
        { id: 'OTHER', label: 'Otros', icon: Plus, color: 'text-purple-400' },
    ];

    return (
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {types.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => setType(t.id as any)}
                        className={cn(
                            "flex flex-col items-center justify-center p-2.5 sm:p-5 rounded-2xl border transition-all",
                            type === t.id
                                ? "bg-info/20 border-info shadow-[0_10px_20px_rgba(6,182,212,0.15)] scale-[1.02] sm:scale-[1.05] z-10"
                                : "bg-white/5 border-white/5 hover:bg-white/10"
                        )}
                    >
                        <t.icon className={cn("w-5 h-5 sm:w-7 sm:h-7 mb-1.5 sm:mb-3", t.color)} />
                        <span className="text-[8px] sm:text-[11px] font-black text-white uppercase tracking-[0.15em] sm:tracking-widest">{t.label}</span>
                    </button>
                ))}
            </div>

            <div className="space-y-3 sm:space-y-4">
                <div className="space-y-0.5 sm:space-y-1 text-center py-1 sm:py-4">
                    <label className="text-[8px] sm:text-[10px] font-black text-info/40 uppercase tracking-[0.3em]">Monto del Gasto</label>
                    <div className="flex items-center justify-center gap-1 sm:gap-2 text-2xl sm:text-5xl font-black text-white italic tracking-tighter">
                        <span className="text-info drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]">$</span>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="bg-transparent border-none outline-none text-center w-28 sm:w-48 placeholder:text-white/5"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[8px] sm:text-[10px] font-black text-white/20 uppercase tracking-widest pl-1">Descripción</label>
                    <div className="p-3 sm:p-4 bg-white/5 border border-white/5 rounded-2xl">
                        <input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ej: Gasolinera Pemex..."
                            className="bg-transparent border-none outline-none text-xs sm:text-sm w-full text-white font-bold"
                        />
                    </div>
                </div>
            </div>

            <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3.5 sm:py-5 bg-white/5 text-white/40 font-black uppercase text-[9px] sm:text-[12px] tracking-widest rounded-2xl border border-white/5 hover:bg-white/10 hover:text-white transition-all active:scale-95"
                >
                    Cerrar
                </button>
                <button
                    type="submit"
                    disabled={status !== 'idle'}
                    className={cn(
                        "flex-[2] py-3.5 sm:py-5 font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 sm:gap-3 text-[9px] sm:text-[12px]",
                        status === 'saved' ? "bg-green-500 text-dark" : "bg-info text-dark hover:brightness-110 active:scale-95",
                        status === 'saving' && "opacity-50"
                    )}
                >
                    {status === 'saving' ? (
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    ) : status === 'saved' ? (
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : null}
                    {status === 'saving' ? 'Validando...' : status === 'saved' ? '¡Hecho!' : 'Guardar'}
                </button>
            </div>
        </form>
    );
};

export default ExpenseForm;
