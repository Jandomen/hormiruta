'use client';

import React from 'react';
import { Navigation, CheckCircle, Clock, MapPin, AlertCircle, FileText, ExternalLink } from 'lucide-react';
import { motion, Reorder, useDragControls } from 'framer-motion';
import { cn } from '../lib/utils';

interface Stop {
    id: string;
    address: string;
    customerName?: string;
    timeWindow?: string;
    notes?: string;
    priority: 'HIGH' | 'NORMAL';
    estimatedArrival?: string;
    isCompleted: boolean;
    isCurrent: boolean;
    order: number;
    lat: number;
    lng: number;
}

interface StopCardProps {
    stop: Stop;
    onNavigate: (stop: Stop) => void;
    onComplete: (id: string) => void;
    onEdit?: (stop: Stop) => void;
}

const StopCard = ({ stop, onNavigate, onComplete, onEdit }: StopCardProps) => {
    return (
        <Reorder.Item
            value={stop}
            id={stop.id}
            dragListener={true}
        >
            <motion.div
                layout
                className={cn(
                    "bg-[#0a0a0a] border border-white/5 p-4 rounded-3xl transition-all duration-300 relative group overflow-hidden shadow-2xl",
                    stop.isCurrent ? "ring-2 ring-info/50" : "",
                    stop.isCompleted && "opacity-40 grayscale"
                )}
            >
                {/* Visual Drag Handle (Visible for user guidance) */}
                <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-100 transition-opacity flex flex-col gap-1.5 p-1">
                    {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1.5 bg-white/40 rounded-full" />)}
                </div>

                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 space-y-3 pl-4">
                        <div className="flex items-center gap-3">
                            <span className={cn(
                                "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0",
                                stop.isCurrent ? "bg-info text-dark" : "bg-white/5 text-white/40"
                            )}>
                                {stop.order}
                            </span>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-white font-bold text-sm truncate uppercase tracking-tight">{stop.address}</h3>
                                {stop.customerName && (
                                    <p className="text-[10px] text-info/60 font-black uppercase tracking-widest mt-0.5">
                                        {stop.customerName}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {stop.estimatedArrival && !stop.isCompleted && (
                                <div className="flex items-center gap-1.5 bg-info/10 px-2.5 py-1 rounded-lg border border-info/20 text-[10px] text-info font-black uppercase shadow-[0_0_10px_rgba(49,204,236,0.1)]">
                                    ETA: {stop.estimatedArrival}
                                </div>
                            )}
                            {stop.timeWindow && (
                                <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 text-[10px] text-white/50 font-bold uppercase">
                                    <Clock className="w-3 h-3 text-info/50" />
                                    {stop.timeWindow}
                                </div>
                            )}
                            {stop.priority === 'HIGH' && (
                                <div className="flex items-center gap-1.5 bg-red-500/10 text-red-500 px-2.5 py-1 rounded-lg border border-red-500/20 text-[10px] font-black uppercase">
                                    <AlertCircle className="w-3 h-3" />
                                    URGENTE
                                </div>
                            )}
                        </div>

                        {stop.notes && (
                            <div className="bg-black/40 p-3 rounded-2xl border border-white/5">
                                <p className="text-[10px] text-white/40 font-medium leading-relaxed italic">
                                    "{stop.notes}"
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        {!stop.isCompleted && (
                            <>
                                <button
                                    onClick={() => onNavigate(stop)}
                                    className="w-12 h-12 flex items-center justify-center bg-info text-dark rounded-2xl shadow-[0_0_20px_rgba(49,204,236,0.2)] hover:scale-105 active:scale-90 transition-all"
                                >
                                    <Navigation className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={() => onEdit?.(stop)}
                                    className="w-12 h-12 flex items-center justify-center bg-white/5 text-white/50 rounded-2xl hover:bg-white/10 transition-all active:scale-90 border border-white/5"
                                >
                                    <ExternalLink className="w-5 h-5 opacity-40" />
                                </button>
                                <button
                                    onClick={() => onComplete(stop.id)}
                                    className="w-12 h-12 flex items-center justify-center bg-white/5 text-positive rounded-2xl hover:bg-positive/20 transition-all active:scale-90 border border-white/5"
                                >
                                    <CheckCircle className="w-6 h-6" />
                                </button>
                            </>
                        )}
                        {stop.isCompleted && (
                            <div className="w-12 h-12 flex items-center justify-center">
                                <CheckCircle className="w-8 h-8 text-positive/30 stroke-[3px]" />
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </Reorder.Item>
    );
};

export default StopCard;
