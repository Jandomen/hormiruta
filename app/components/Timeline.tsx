'use client';

import React from 'react';
import StopCard from './StopCard';
import { Reorder, AnimatePresence } from 'framer-motion';

interface Stop {
    id: string;
    address: string;
    customerName?: string;
    timeWindow?: string;
    notes?: string;
    priority: 'HIGH' | 'NORMAL';
    isCompleted: boolean;
    isCurrent: boolean;
    order: number;
    lat: number;
    lng: number;
}

interface TimelineProps {
    stops: Stop[];
    onReorder: (newStops: Stop[]) => void;
    onNavigate: (stop: Stop) => void;
    onComplete: (id: string) => void;
    onEdit?: (stop: Stop) => void;
}

const Timeline = ({ stops, onReorder, onNavigate, onComplete, onEdit, onDuplicate, onRemove }: any) => {
    return (
        <div className="pb-32">
            <Reorder.Group
                axis="y"
                values={stops}
                onReorder={onReorder}
                className="space-y-6"
            >
                <AnimatePresence mode="popLayout">
                    {stops.map((stop: any) => (
                        <StopCard
                            key={stop.id}
                            stop={stop}
                            onNavigate={onNavigate}
                            onComplete={onComplete}
                            onEdit={onEdit}
                            onDuplicate={onDuplicate}
                            onRemove={onRemove}
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
                        <p className="text-white/20 text-xs font-black uppercase tracking-[0.3em]">
                            Sin Itinerario
                        </p>
                        <p className="text-info/20 text-[9px] font-bold uppercase mt-2">Añade paradas desde el mapa</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Timeline;
