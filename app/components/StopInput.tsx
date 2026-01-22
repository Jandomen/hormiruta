'use client';

import React, { useState, useRef } from 'react';
import { Search, Plus, X, User, Clock, AlertCircle, FileText, ChevronDown, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

interface StopInputProps {
    onAddStop: (stop: any) => void;
    onUpdateStop?: (stop: any) => void;
    onCancel?: () => void;
    initialData?: any;
    isEditing?: boolean;
}

const StopInput = ({ onAddStop, onUpdateStop, onCancel, initialData, isEditing }: StopInputProps) => {
    const [address, setAddress] = useState(initialData?.address || '');
    const [customerName, setCustomerName] = useState(initialData?.customerName || '');
    const [priority, setPriority] = useState<'HIGH' | 'NORMAL'>(initialData?.priority || 'NORMAL');
    const [timeWindow, setTimeWindow] = useState(initialData?.timeWindow || '');
    const [notes, setNotes] = useState(initialData?.notes || '');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isFocused, setIsFocused] = useState(false);
    const [showDetails, setShowDetails] = useState(isEditing || !!(initialData?.customerName || initialData?.timeWindow || initialData?.notes));
    const inputRef = useRef<HTMLInputElement>(null);

    const fetchSuggestions = async (query: string) => {
        if (query.length < 3) {
            setSuggestions([]);
            return;
        }
        // Simulation
        setTimeout(() => {
            setSuggestions([
                { description: `${query} Calle Principal 123`, lat: 19.43, lng: -99.13 },
                { description: `${query} Avenida de la Paz 45`, lat: 19.44, lng: -99.14 },
            ]);
        }, 200);
    };

    const handleSave = () => {
        if (!address) return;
        const stopData = {
            id: initialData?.id || Math.random().toString(36).substr(2, 9),
            address,
            customerName,
            priority,
            timeWindow,
            notes,
            lat: initialData?.lat || 19.43,
            lng: initialData?.lng || -99.13,
            isCompleted: initialData?.isCompleted || false,
            isCurrent: initialData?.isCurrent || false,
            order: initialData?.order || 1,
        };

        if (isEditing && onUpdateStop) {
            onUpdateStop(stopData);
        } else {
            onAddStop(stopData);
        }

        // Reset if not editing
        if (!isEditing) {
            setAddress('');
            setCustomerName('');
            setTimeWindow('');
            setNotes('');
        }
    };

    return (
        <div className="space-y-5">
            <div className="relative">
                <div className={cn(
                    "flex items-center gap-3 p-4 bg-black border border-white/5 rounded-2xl transition-all",
                    isFocused && "border-info shadow-[0_0_20px_rgba(49,204,236,0.1)]"
                )}>
                    <Search className="w-5 h-5 text-info/50" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={address}
                        onChange={(e) => {
                            setAddress(e.target.value);
                            fetchSuggestions(e.target.value);
                        }}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                        placeholder="Buscar dirección..."
                        className="flex-1 bg-transparent border-none outline-none text-white text-sm placeholder:text-white/20"
                    />
                </div>

                <AnimatePresence>
                    {isFocused && suggestions.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full left-0 right-0 mt-3 bg-black border border-white/10 rounded-2xl z-50 overflow-hidden shadow-2xl"
                        >
                            <ul className="divide-y divide-white/5">
                                {suggestions.map((s, i) => (
                                    <li
                                        key={i}
                                        onClick={() => {
                                            setAddress(s.description);
                                            setSuggestions([]);
                                            setShowDetails(true);
                                        }}
                                        className="p-4 hover:bg-white/5 cursor-pointer text-white/70 text-sm flex items-center gap-3 transition-colors"
                                    >
                                        <MapPin className="w-4 h-4 text-info/50" />
                                        {s.description}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-[10px] font-black text-info/40 uppercase tracking-[0.2em] flex items-center gap-2 px-2"
            >
                {showDetails ? 'Menos Opciones' : 'Más Información'}
                <ChevronDown className={cn("w-3 h-3 transition-transform", showDetails && "rotate-180")} />
            </button>

            <AnimatePresence>
                {showDetails && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-4 overflow-hidden"
                    >
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-white/30 uppercase pl-1">Cliente</label>
                                <div className="flex items-center gap-3 p-3 bg-black border border-white/5 rounded-xl">
                                    <User className="w-4 h-4 text-info/30" />
                                    <input
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        className="bg-transparent border-none outline-none text-xs text-white w-full"
                                        placeholder="Destinatario"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-white/30 uppercase pl-1">Horario</label>
                                <div className="flex items-center gap-3 p-3 bg-black border border-white/5 rounded-xl">
                                    <Clock className="w-4 h-4 text-info/30" />
                                    <input
                                        value={timeWindow}
                                        onChange={(e) => setTimeWindow(e.target.value)}
                                        className="bg-transparent border-none outline-none text-xs text-white w-full"
                                        placeholder="08:00 - 10:00"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-white/30 uppercase pl-1">Instrucciones</label>
                            <div className="bg-black border border-white/5 rounded-xl p-3">
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="bg-transparent border-none outline-none text-xs text-white w-full h-20 resize-none placeholder:text-white/10"
                                    placeholder="Detalles de la entrega..."
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-black border border-white/5 rounded-xl">
                            <span className="text-xs text-white/40 font-black uppercase flex items-center gap-3">
                                <AlertCircle className={cn("w-4 h-4", priority === 'HIGH' ? "text-red-500" : "text-info/30")} />
                                Prioridad Alta
                            </span>
                            <button
                                onClick={() => setPriority(priority === 'HIGH' ? 'NORMAL' : 'HIGH')}
                                className={cn(
                                    "w-12 h-6 rounded-full transition-all relative p-1 shadow-inner",
                                    priority === 'HIGH' ? "bg-red-500" : "bg-white/5"
                                )}
                            >
                                <div className={cn(
                                    "w-4 h-4 bg-white rounded-full transition-all shadow-md",
                                    priority === 'HIGH' ? "translate-x-6" : "translate-x-0"
                                )} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex gap-3 pt-2">
                {onCancel && (
                    <button
                        onClick={onCancel}
                        className="flex-1 py-4 bg-white/5 text-white/50 font-black uppercase text-[10px] tracking-widest rounded-2xl border border-white/5 hover:bg-white/10 transition-all"
                    >
                        Cancelar
                    </button>
                )}
                <button
                    onClick={handleSave}
                    disabled={!address}
                    className="flex-[2] py-4 bg-info text-dark font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-30"
                >
                    {isEditing ? 'Guardar Cambios' : 'Registrar Parada'}
                </button>
            </div>
        </div>
    );
};

export default StopInput;
