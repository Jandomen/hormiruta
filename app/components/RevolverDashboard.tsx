'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, CheckCircle, RotateCw, BarChart3, MapPin, ChevronLeft, ChevronRight, Package, Clock, AlertCircle } from 'lucide-react';
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
        // Bloque 1: Acciones Principales
        {
            id: 'actions',
            label: 'Centro de Mando',
            content: (
                <div className="grid grid-cols-4 gap-3 w-full h-full items-center p-4">
                    <div className="flex flex-col items-center gap-2">
                        <motion.button
                            whileTap={{ scale: 0.85, backgroundColor: 'rgba(34, 197, 94, 0.8)' }}
                            onClick={onCompleteCurrent}
                            disabled={!nextStop}
                            className="w-14 h-14 sm:w-16 sm:h-16 bg-green-500 rounded-2xl flex items-center justify-center shadow-[0_10px_20px_rgba(34,197,94,0.3)] disabled:opacity-30 disabled:grayscale transition-all"
                        >
                            <CheckCircle className="w-7 h-7 text-white" />
                        </motion.button>
                        <span className="text-[9px] font-black uppercase tracking-tight text-white/60">Finalizar</span>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                        <motion.button
                            whileTap={{ scale: 0.85 }}
                            onClick={onOptimize}
                            disabled={isOptimizing || totalStops < 2}
                            className="w-14 h-14 sm:w-16 sm:h-16 bg-info rounded-2xl flex items-center justify-center shadow-[0_10px_20px_rgba(6,182,212,0.3)] disabled:opacity-30 transition-all font-black"
                        >
                            <RotateCw className={cn("w-7 h-7 text-darker", isOptimizing && "animate-spin")} />
                        </motion.button>
                        <span className="text-[9px] font-black uppercase tracking-tight text-white/60">Optimizar</span>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                        <motion.button
                            whileTap={{ scale: 0.85 }}
                            className="w-14 h-14 sm:w-16 sm:h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all"
                        >
                            <Play className="w-7 h-7 text-info" />
                        </motion.button>
                        <span className="text-[9px] font-black uppercase tracking-tight text-white/60">Navegar</span>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                        <motion.button
                            whileTap={{ scale: 0.85 }}
                            className="w-14 h-14 sm:w-16 sm:h-16 bg-red-500/90 rounded-2xl flex items-center justify-center shadow-[0_10px_20px_rgba(239,68,68,0.3)] transition-all"
                        >
                            <AlertCircle className="w-7 h-7 text-white" />
                        </motion.button>
                        <span className="text-[9px] font-black uppercase tracking-tight text-white/60 italic font-black text-red-400">Emergencia</span>
                    </div>
                </div>
            )
        },

        // Bloque 2: Progreso
        {
            id: 'stats',
            label: 'Progreso de Misión',
            content: (
                <div className="flex items-center justify-between w-full h-full p-4 px-6 gap-6">
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Rendimiento</span>
                            <span className="text-2xl font-black text-info italic">{totalStops > 0 ? Math.round((completedStops / totalStops) * 100) : 0}%</span>
                        </div>
                        <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden border border-white/5 p-1">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${totalStops > 0 ? (completedStops / totalStops) * 100 : 0}%` }}
                                className="h-full bg-gradient-to-r from-info via-cyan-400 to-purple-500 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                        <div className="flex items-baseline gap-1">
                            <span className="text-5xl font-black text-white italic tracking-tighter drop-shadow-lg">{completedStops}</span>
                            <span className="text-lg font-black text-white/20 italic">/ {totalStops}</span>
                        </div>
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.15em] text-right">Completadas</p>
                    </div>
                </div>
            )
        },
        // Bloque 3: Siguiente Parada / Detalles
        {
            id: 'details',
            label: 'Objetivo Actual',
            content: (
                <div className="flex items-center gap-5 w-full h-full p-4 px-6">
                    <div className="w-16 h-16 rounded-2xl bg-info/10 flex items-center justify-center border border-info/20 shadow-xl shrink-0">
                        <MapPin className="w-8 h-8 text-info" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="px-1.5 py-0.5 bg-info/20 text-info text-[8px] font-bold rounded uppercase tracking-widest">Siguiente</div>
                        </div>
                        <h4 className="text-base font-black text-white truncate italic uppercase tracking-tight leading-tight">
                            {nextStop?.address || 'Misión Finalizada'}
                        </h4>
                        <div className="flex gap-4 mt-2">
                            <div className="flex items-center gap-1.5">
                                <Package className="w-3.5 h-3.5 text-info/60" />
                                <span className="text-[10px] font-bold text-white/50">{nextStop?.numPackages || 0} Paquetes</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-info/60" />
                                <span className="text-[10px] font-bold text-white/50">{nextStop?.timeWindow || 'Inmediato'}</span>
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
        <div className={cn(
            "relative h-48 sm:h-56 w-full overflow-hidden bg-gradient-to-b from-white/[0.12] via-darker/60 to-transparent rounded-[32px] sm:rounded-[48px] border border-white/10 group select-none shadow-[0_20px_80px_rgba(0,0,0,0.6)]",
            className
        )}>
            {/* Fondo decorativo animado */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-info to-transparent scale-y-150" />
                <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-info to-transparent scale-y-150" />
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeIndex}
                    initial={{ x: 100, opacity: 0, scale: 0.9 }}
                    animate={{ x: 0, opacity: 1, scale: 1 }}
                    exit={{ x: -100, opacity: 0, scale: 0.9 }}
                    transition={{ type: "spring", damping: 20, stiffness: 120 }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.4}
                    onDragEnd={(_, info) => {
                        if (info.offset.x < -40) rotate(1);
                        if (info.offset.x > 40) rotate(-1);
                    }}
                    className="absolute inset-0 cursor-grab active:cursor-grabbing lg:cursor-default"
                >
                    <div className="absolute top-4 left-6 sm:left-8 text-[10px] font-black text-info/70 uppercase tracking-[0.4em] italic z-10 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        {blocks[activeIndex].label}
                    </div>

                    <div className="h-full flex items-center pt-6">
                        {blocks[activeIndex].content}
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Navegación por puntos inferior */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 z-30">
                {blocks.map((_, i) => (
                    <motion.button
                        key={i}
                        onClick={() => setActiveIndex(i)}
                        initial={false}
                        animate={{
                            width: i === activeIndex ? 24 : 8,
                            backgroundColor: i === activeIndex ? '#31CCEC' : 'rgba(255,255,255,0.15)'
                        }}
                        className="h-1.5 rounded-full transition-all cursor-pointer"
                    />
                ))}
            </div>

            {/* Controles laterales para Escritorio / Tablets */}
            <div className="hidden sm:flex absolute inset-0 pointer-events-none items-center justify-between px-2">
                <motion.button
                    whileHover={{ x: -2, opacity: 1 }}
                    onClick={() => rotate(-1)}
                    className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center pointer-events-auto opacity-10 transition-all border border-white/10"
                >
                    <ChevronLeft className="w-6 h-6 text-white" />
                </motion.button>
                <motion.button
                    whileHover={{ x: 2, opacity: 1 }}
                    onClick={() => rotate(1)}
                    className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center pointer-events-auto opacity-10 transition-all border border-white/10"
                >
                    <ChevronRight className="w-6 h-6 text-white" />
                </motion.button>
            </div>
        </div>
    );
}
