'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { Play, CheckCircle, RotateCw, BarChart3, MapPin, ChevronUp, ChevronDown, Package, Clock } from 'lucide-react';
import { cn } from '../lib/utils';

interface RevolverDashboardProps {
    stops: any[];
    onOptimize: () => void;
    onCompleteCurrent: () => void;
    isOptimizing: boolean;
    activeStop?: any;
    className?: string;
}

export default function RevolverDashboard({
    stops,
    onOptimize,
    onCompleteCurrent,
    isOptimizing,
    activeStop,
    className
}: RevolverDashboardProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const completedStops = stops.filter(s => s.isCompleted || s.isFailed).length;
    const totalStops = stops.length;
    const nextStop = stops.find(s => !s.isCompleted && !s.isFailed);

    const blocks = [
        // Bloch 1: Acciones Principales
        {
            id: 'actions',
            label: 'Centro de Mando',
            content: (
                <div className="flex gap-4 w-full h-full items-center p-4">
                    <button
                        onClick={onCompleteCurrent}
                        disabled={!nextStop}
                        className="flex-1 h-full bg-green-500 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-lg shadow-green-500/20 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
                    >
                        <CheckCircle className="w-6 h-6 text-white" />
                        <span className="text-[10px] font-black uppercase tracking-tighter text-white">Finalizar</span>
                    </button>
                    <button
                        onClick={onOptimize}
                        disabled={isOptimizing || totalStops < 2}
                        className="flex-1 h-full bg-info rounded-2xl flex flex-col items-center justify-center gap-2 shadow-lg shadow-info/20 active:scale-95 transition-all disabled:opacity-30"
                    >
                        <RotateCw className={cn("w-6 h-6 text-dark", isOptimizing && "animate-spin")} />
                        <span className="text-[10px] font-black uppercase tracking-tighter text-dark">Optimizar</span>
                    </button>
                    <button
                        className="flex-1 h-full bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-white/10 active:scale-95 transition-all"
                    >
                        <Play className="w-6 h-6 text-info" />
                        <span className="text-[10px] font-black uppercase tracking-tighter text-white">Ruta</span>
                    </button>
                </div>
            )
        },
        // Bloque 2: Progreso
        {
            id: 'stats',
            label: 'Progreso de Ruta',
            content: (
                <div className="flex items-center justify-between w-full h-full p-6 px-8 gap-8">
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Eficiencia</span>
                            <span className="text-xl font-black text-info italic">{totalStops > 0 ? Math.round((completedStops / totalStops) * 100) : 0}%</span>
                        </div>
                        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${totalStops > 0 ? (completedStops / totalStops) * 100 : 0}%` }}
                                className="h-full bg-gradient-to-r from-info to-purple-500 rounded-full shadow-[0_0_15px_rgba(49,204,236,0.5)]"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black text-white italic tracking-tighter">{completedStops}</span>
                            <span className="text-sm font-black text-white/20 italic">/ {totalStops}</span>
                        </div>
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Paradas Completadas</p>
                    </div>
                </div>
            )
        },
        // Bloque 3: Siguiente Parada / Detalles
        {
            id: 'details',
            label: 'Siguiente Objetivo',
            content: (
                <div className="flex items-center gap-6 w-full h-full p-5 px-8">
                    <div className="w-14 h-14 rounded-2xl bg-info/10 flex items-center justify-center border border-info/20 shadow-xl shrink-0">
                        <MapPin className="w-7 h-7 text-info" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-black text-white truncate italic uppercase tracking-tight">
                            {nextStop?.address || 'Fin del Itinerario'}
                        </h4>
                        <div className="flex gap-4 mt-2">
                            <div className="flex items-center gap-1.5">
                                <Package className="w-3 h-3 text-info/50" />
                                <span className="text-[9px] font-bold text-white/40">{nextStop?.numPackages || 0} Paquetes</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Clock className="w-3 h-3 text-info/50" />
                                <span className="text-[9px] font-bold text-white/40">{nextStop?.timeWindow || 'Cualquier hora'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
    ];

    const rotate = (direction: number) => {
        if (direction > 0) {
            setActiveIndex((prev) => (prev + 1) % blocks.length);
        } else {
            setActiveIndex((prev) => (prev - 1 + blocks.length) % blocks.length);
        }
    };

    return (
        <div className={cn("relative h-32 w-full overflow-hidden bg-white/5 rounded-[32px] border border-white/10 group select-none", className)}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeIndex}
                    initial={{ y: 50, opacity: 0, scale: 0.9 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: -50, opacity: 0, scale: 0.9 }}
                    transition={{ type: "spring", damping: 20, stiffness: 120 }}
                    drag="y"
                    dragConstraints={{ top: 0, bottom: 0 }}
                    onDragEnd={(_, info) => {
                        if (info.offset.y < -30) rotate(1);
                        if (info.offset.y > 30) rotate(-1);
                    }}
                    className="absolute inset-0 cursor-grab active:cursor-grabbing"
                >
                    <div className="absolute top-4 left-8 text-[9px] font-black text-info/40 uppercase tracking-[0.4em] italic z-10 flex items-center gap-2">
                        <BarChart3 className="w-3 h-3" />
                        {blocks[activeIndex].label}
                    </div>

                    {blocks[activeIndex].content}

                    {/* Indicadores laterales */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {blocks.map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "w-1 h-3 rounded-full transition-all",
                                    i === activeIndex ? "bg-info h-5" : "bg-white/10"
                                )}
                            />
                        ))}
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Hint icons for swipe */}
            <div className="absolute left-1/2 top-1 -translate-x-1/2 flex flex-col items-center gap-0.5 opacity-0 group-hover:opacity-30 pointer-events-none transition-all">
                <ChevronUp className="w-3 h-3 text-white" />
            </div>
            <div className="absolute left-1/2 bottom-1 -translate-x-1/2 flex flex-col items-center gap-0.5 opacity-0 group-hover:opacity-30 pointer-events-none transition-all">
                <ChevronDown className="w-3 h-3 text-white" />
            </div>
        </div>
    );
}
