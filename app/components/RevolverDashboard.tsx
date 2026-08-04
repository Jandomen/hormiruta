'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Play, CheckCircle, RotateCw, MapPin, 
    Hash, AlertCircle, ChevronDown, ChevronUp,
    LayoutGrid, History, Navigation, Star
} from 'lucide-react';
import { cn } from '../lib/utils';

interface RevolverDashboardProps {
    stops: any[];
    onOptimize: () => void;
    onCompleteCurrent: () => void;
    onStartNavigation?: () => void;
    onFinishRoute?: () => void;
    isOptimizing: boolean;
    activeStop?: any;
    className?: string;
}

export default function RevolverDashboard({
    stops,
    onOptimize,
    onCompleteCurrent,
    onStartNavigation,
    onFinishRoute,
    isOptimizing,
    activeStop,
    className
}: RevolverDashboardProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const completedStops = stops.filter(s => s.isCompleted || s.isFailed).length;
    const totalStops = stops.length;
    const nextStops = stops.filter(s => !s.isCompleted && !s.isFailed).slice(0, 3);
    const currentStop = stops.find(s => s.isCurrent) || stops.find(s => !s.isCompleted && !s.isFailed);

    const blocks = [
        {
            id: 'actions',
            label: 'Comando Central',
            icon: LayoutGrid,
            content: (
                <div className="flex items-center justify-between w-full h-full p-2 px-4 sm:px-8">
                    <div className="flex items-center justify-center gap-2 sm:gap-6 flex-1">
                        <div className="grid grid-cols-3 gap-3 sm:gap-5">
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={onFinishRoute}
                                disabled={totalStops === 0}
                                className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-b from-[#FF3B30] to-[#FF1744] border border-[#FF6E64] ring-2 ring-[#FF1744]/40 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center shadow-[0_0_25px_rgba(255,23,68,0.55),0_4px_14px_rgba(255,59,48,0.4)] disabled:opacity-20 transition-all hover:from-[#FF5252] hover:to-[#FF1744] hover:brightness-110"
                            >
                                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]" />
                                <span className="text-[7px] sm:text-[10px] font-black uppercase tracking-tight leading-none mt-1 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.5)]">Finalizar</span>
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.9, rotate: 5 }}
                                onClick={onOptimize}
                                disabled={isOptimizing || totalStops < 2}
                                className={cn(
                                    "flex flex-col items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl border transition-all active:scale-95",
                                    isOptimizing 
                                        ? "bg-dark/50 border-white/5 text-white/50 animate-pulse" 
                                        : "bg-blue-500/20 border-blue-500/50 text-blue-400 hover:bg-blue-500/30 shadow-[0_0_20px_rgba(96,165,250,0.2)]"
                                )}
                            >
                                <RotateCw className={cn("w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 mb-0.5", isOptimizing && "animate-spin")} />
                                <span className="text-[7px] sm:text-[10px] font-black uppercase tracking-tighter leading-none">Optimizar</span>
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 1.1 }}
                                onClick={onStartNavigation}
                                className="w-12 h-12 sm:w-14 sm:h-14 bg-white/10 border border-white/20 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center shadow-lg transition-all hover:bg-white/20"
                            >
                                <Navigation className="w-4 h-4 sm:w-5 sm:h-5 text-info" />
                                <span className="text-[7px] sm:text-[10px] font-black uppercase tracking-tight leading-none mt-1 text-info">Iniciar</span>
                            </motion.button>
                        </div>
                    </div>

                    <div className="text-right pl-3 sm:pl-6 border-l border-white/10">
                        <div className="flex items-baseline justify-end gap-1">
                            <span className="text-xl sm:text-2xl font-black text-white italic leading-none">{completedStops}</span>
                            <span className="text-[10px] sm:text-xs font-black text-white/50 uppercase">/ {totalStops}</span>
                        </div>
                        <p className="text-[10px] sm:text-xs font-black text-info uppercase tracking-widest mt-0.5 opacity-80">Progreso</p>
                    </div>
                </div>
            )
        },

        // Bloque 2: Vector de Ruta (Detalles)
        {
            id: 'details',
            label: 'Vector de Ruta',
            icon: MapPin,
            content: (
                <div className="flex items-center gap-2 sm:gap-4 w-full h-full p-3 px-3 sm:px-6">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-info/10 flex items-center justify-center border border-info/20 shrink-0 relative overflow-hidden group">
                        <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-info relative z-10" />
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-info/10 blur-xl" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black text-info bg-info/10 px-1.5 py-0.5 rounded-full uppercase italic tracking-tighter">Siguiente</span>
                            <div className="h-[1px] flex-1 bg-white/5" />
                        </div>
                        <h4 className="text-xs sm:text-sm font-black text-white truncate italic uppercase tracking-tight">
                            {currentStop?.address || 'Esperando Paradas'}
                        </h4>
                        <div className="flex gap-3 mt-1.5">
                            {nextStops.slice(1).map((s, i) => (
                                <div key={i} className="flex items-center gap-1 opacity-50">
                                    <div className="w-1 h-1 rounded-full bg-white" />
                                    <span className="text-[10px] font-bold text-white truncate max-w-[30px] sm:max-w-[40px] italic">#{s.order}</span>
                                </div>
                            ))}
                            {nextStops.length > 1 && <span className="text-[10px] font-black text-white/70 uppercase">...</span>}
                        </div>
                    </div>
                    <div className="text-right pl-3 sm:pl-4 border-l border-white/10 shrink-0">
                        <div className="flex items-baseline justify-end gap-1">
                            <span className="text-lg sm:text-xl font-black text-white italic leading-none">{completedStops}</span>
                            <span className="text-[10px] sm:text-xs font-black text-white/50 uppercase">/ {totalStops}</span>
                        </div>
                    </div>
                </div>
            )
        },

        // Bloque 3: Resumen de Progreso
        {
            id: 'progress',
            label: 'Progreso General',
            icon: History,
            content: (
                <div className="flex flex-col justify-center w-full h-full p-3 px-4 sm:px-8">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] sm:text-xs font-black text-white/60 uppercase tracking-widest">Paradas Completadas</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl sm:text-3xl font-black text-white italic leading-none">{completedStops}</span>
                            <span className="text-xs sm:text-sm font-black text-white/50 uppercase">/ {totalStops}</span>
                        </div>
                    </div>
                    <div className="w-full h-2 sm:h-3 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${totalStops > 0 ? (completedStops / totalStops) * 100 : 0}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            className={cn(
                                "h-full rounded-full transition-colors",
                                completedStops === totalStops && totalStops > 0
                                    ? "bg-green-500"
                                    : "bg-gradient-to-r from-info to-blue-500"
                            )}
                        />
                    </div>
                    <div className="flex justify-between mt-2">
                        <span className="text-[10px] sm:text-xs font-black text-white/50 uppercase tracking-widest">
                            {totalStops - completedStops} Pendientes
                        </span>
                        {totalStops > 0 && (
                            <span className="text-[10px] sm:text-xs font-black text-info uppercase tracking-widest">
                                {Math.round((completedStops / totalStops) * 100)}%
                            </span>
                        )}
                    </div>
                </div>
            )
        },


    ];

    const [direction, setDirection] = useState(0);

    const rotate = (newDir: number) => {
        setDirection(newDir);
        if (newDir > 0) {
            setActiveIndex((prev) => (prev + 1) % blocks.length);
        } else {
            setActiveIndex((prev) => (prev - 1 + blocks.length) % blocks.length);
        }
    };

    return (
        <div className={cn(
            "relative h-24 sm:h-28 w-full overflow-hidden bg-darker border-y border-white/10 group select-none perspective-1000",
            className
        )}>
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #fff 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            </div>

            <AnimatePresence mode="popLayout" custom={direction}>
                <motion.div
                    key={activeIndex}
                    custom={direction}
                    initial={{ 
                        opacity: 0, 
                        y: direction > 0 ? 100 : -100,
                        rotateX: direction > 0 ? -45 : 45,
                        scale: 0.8
                    }}
                    animate={{ 
                        opacity: 1, 
                        y: 0, 
                        rotateX: 0,
                        scale: 1
                    }}
                    exit={{ 
                        opacity: 0, 
                        y: direction > 0 ? -100 : 100,
                        rotateX: direction > 0 ? 45 : -45,
                        scale: 0.8
                    }}
                    transition={{ 
                        type: "spring", 
                        damping: 20, 
                        stiffness: 150, 
                        mass: 0.8
                    }}
                    drag="y"
                    dragConstraints={{ top: 0, bottom: 0 }}
                    onDragEnd={(_, info) => {
                        if (info.offset.y < -40) rotate(1);
                        if (info.offset.y > 40) rotate(-1);
                    }}
                    className="absolute inset-0 cursor-ns-resize h-full w-full z-10 p-2"
                >
                    <div className="relative h-full w-full bg-gradient-to-br from-white/[0.03] to-transparent rounded-[24px] border border-white/5 backdrop-blur-sm">
                        <div className="absolute top-3 left-4 sm:left-6 flex items-center gap-2">
                             <div className="w-3 h-3 rounded-lg bg-info/10 flex items-center justify-center">
                                {React.createElement(blocks[activeIndex].icon, { className: "w-1.5 h-1.5 text-info" })}
                             </div>
                             <span className="text-[10px] font-black text-info uppercase tracking-[0.4em] italic opacity-80">
                                {blocks[activeIndex].label}
                             </span>
                        </div>
                        
                        <div className="h-full pt-6 sm:pt-8 overflow-hidden">
                            {blocks[activeIndex].content}
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Tactical Controls (Side) */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3 z-30">
                <button 
                    onClick={() => rotate(-1)} 
                    className="p-1 hover:bg-white/5 rounded-md transition-colors text-white/50 hover:text-info"
                >
                    <ChevronUp className="w-3 h-3" />
                </button>
                <div className="flex flex-col gap-1">
                    {blocks.map((_, i) => (
                        <motion.div
                            key={i}
                            animate={{
                                height: i === activeIndex ? 10 : 3,
                                width: i === activeIndex ? 3 : 2,
                                backgroundColor: i === activeIndex ? '#60a5fa' : 'rgba(255,255,255,0.1)',
                                opacity: i === activeIndex ? 1 : 0.5
                            }}
                            className="rounded-full transition-all"
                        />
                    ))}
                </div>
                <button 
                    onClick={() => rotate(1)} 
                    className="p-1 hover:bg-white/5 rounded-md transition-colors text-white/50 hover:text-info"
                >
                    <ChevronDown className="w-3 h-3" />
                </button>
            </div>

            {/* Edge Shadows for Cylinder Effect */}
            <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black to-transparent pointer-events-none z-20" />
            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black to-transparent pointer-events-none z-20" />
        </div>
    );
}
