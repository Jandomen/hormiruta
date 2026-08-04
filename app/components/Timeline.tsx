'use client';

import React from 'react';
import StopCard from './StopCard';
import { Reorder, AnimatePresence, motion } from 'framer-motion';
import { RotateCw, Sparkles, Trash2 } from 'lucide-react';

interface Stop {
    id: string;
    address: string;
    customerName?: string;
    timeWindow?: string;
    notes?: string;
    priority: 'HIGH' | 'NORMAL';
    isCompleted: boolean;
    isFailed: boolean;
    isCurrent: boolean;
    order: number;
    lat: number;
    lng: number;
}

interface TimelineProps {
    stops: Stop[];
    onReorder: (newStops: Stop[]) => void;
    onNavigate: (stop: Stop) => void;
    onComplete: (id: string, isFailed?: boolean) => void;
    onEdit?: (stop: Stop) => void;
    onDuplicate?: (stop: Stop) => void;
    onRemove?: (id: string) => void;
    onRevert?: (id: string) => void;
    onOptimize?: () => void;
    onCleanDuplicates?: () => void;
    isOptimizing?: boolean;
}

const Timeline = ({ stops, onReorder, onNavigate, onComplete, onEdit, onDuplicate, onRemove, onRevert, onOptimize, onCleanDuplicates, isOptimizing }: any) => {
    const pendingStops = stops.filter((s: any) => !s.isCompleted && !s.isFailed);
    const sortedStops = [...stops].sort((a: any, b: any) => a.order - b.order);

    return (
        <div className="pb-4">
            {pendingStops.length >= 2 && onOptimize && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-2 mb-4"
                >
                    <button
                        onClick={onOptimize}
                        disabled={isOptimizing}
                        className="w-full py-4 bg-gradient-to-r from-info to-blue-600 text-dark font-black uppercase text-sm tracking-widest rounded-2xl shadow-[0_10px_40px_rgba(96,165,250,0.35)] hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                        {isOptimizing ? (
                            <>
                                <RotateCw className="w-5 h-5 animate-spin" />
                                Optimizando...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5" />
                                Optimizar Ruta Ahora
                            </>
                        )}
                    </button>
                    <p className="text-[10px] text-info/70 font-bold uppercase tracking-widest text-center mt-2">
                        Mejora el orden con tráfico en tiempo real
                    </p>
                </motion.div>
            )}

            {stops.length > 1 && onCleanDuplicates && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-2 mb-2"
                >
                    <button
                        onClick={onCleanDuplicates}
                        className="w-full py-2.5 bg-white/5 border border-white/10 text-white/70 hover:text-red-400 hover:border-red-500/20 hover:bg-red-500/5 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        Limpiar Duplicados
                    </button>
                </motion.div>
            )}

            <Reorder.Group
                axis="y"
                values={sortedStops}
                onReorder={onReorder}
                className="space-y-2"
            >
                <AnimatePresence mode="popLayout">
                    {sortedStops.map((stop: any) => (
                        <StopCard
                            key={stop.id}
                            stop={stop}
                            onNavigate={onNavigate}
                            onComplete={onComplete}
                            onEdit={onEdit}
                            onDuplicate={onDuplicate}
                            onRemove={onRemove}
                            onRevert={onRevert}
                        />
                    ))}
                </AnimatePresence>
            </Reorder.Group>

            {stops.length === 0 && (
                <div className="flex flex-col items-center justify-center p-20 text-center space-y-6 bg-white/5 rounded-[40px] border border-white/5 mx-2">
                    <div className="w-20 h-20 rounded-3xl bg-black flex items-center justify-center shadow-inner">
                        <img src="/LogoHormiruta.png" alt="No stops" className="w-12 h-12 opacity-10 grayscale" />
                    </div>
                    <div>
                        <p className="text-white/60 text-xs font-black uppercase tracking-[0.3em]">
                            Sin Itinerario
                        </p>
                        <p className="text-info/60 text-[10px] font-bold uppercase mt-2">Añade paradas desde el mapa</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Timeline;
