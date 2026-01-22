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
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
                {types.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => setType(t.id as any)}
                        className={cn(
                            "flex flex-col items-center justify-center p-3 rounded-xl border transition-all",
                            type === t.id
                                ? "bg-white/10 border-info shadow-lg"
                                : "bg-white/5 border-white/5 hover:bg-white/10"
                        )}
                    >
                        <t.icon className={cn("w-6 h-6 mb-2", t.color)} />
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">{t.label}</span>
                    </button>
                ))}
            </div>

            <div className="space-y-4">
                <div className="space-y-1 text-center">
                    <label className="text-xs font-bold text-blue-300/50 uppercase tracking-widest">Monto del Gasto</label>
                    <div className="flex items-center justify-center gap-2 text-4xl font-black text-white">
                        <span className="text-info opacity-50">$</span>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="bg-transparent border-none outline-none text-center w-40 placeholder:text-white/10"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-blue-300/50 uppercase">Descripción / Notas</label>
                    <div className="p-3 styled-input bg-white/5">
                        <input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ej: Gasolinera Pemex..."
                            className="bg-transparent border-none outline-none text-sm w-full text-white"
                        />
                    </div>
                </div>
            </div>

            <div className="flex gap-3 pt-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-4 bg-white/5 text-white/50 font-bold rounded-xl hover:bg-white/10 transition-colors"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={status !== 'idle'}
                    className={cn(
                        "flex-2 py-4 font-black uppercase tracking-[0.2em] rounded-xl shadow-lg transition-all flex items-center justify-center gap-2",
                        status === 'saved' ? "bg-green-600 text-white" : "bg-info text-dark hover:brightness-110 active:scale-95",
                        status === 'saving' && "opacity-50"
                    )}
                >
                    {status === 'saving' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : status === 'saved' ? (
                        <CheckCircle className="w-4 h-4" />
                    ) : null}
                    {status === 'saving' ? 'Verificando...' : status === 'saved' ? 'Logrado' : 'Guardar Gasto'}
                </button>
            </div>
        </form>
    );
};

export default ExpenseForm;
