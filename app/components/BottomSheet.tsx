'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

interface FleetDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
    collapsedContent?: React.ReactNode;
}

type SheetSnap = 'handle' | 'peek' | 'half' | 'full';

const BottomSheet = ({ isOpen, onClose, children, title, collapsedContent }: FleetDrawerProps) => {
    const [snap, setSnap] = React.useState<SheetSnap>('handle');

    React.useEffect(() => {
        if (isOpen) setSnap('peek');
    }, [isOpen]);

    const snapOffsets = {
        handle: 'calc(100% - 48px)',
        peek: 'calc(100% - 210px)',
        half: 'calc(100% - 55vh)',
        full: '0px',
    };

    const getNearestSnap = (y: number, velocity: number): SheetSnap => {
        if (velocity < -500) return 'full';
        if (velocity > 500) return 'handle';

        const thresholds: { snap: SheetSnap; threshold: number }[] = [
            { snap: 'handle', threshold: window.innerHeight - 40 },
            { snap: 'peek', threshold: window.innerHeight - 250 },
            { snap: 'half', threshold: window.innerHeight * 0.3 },
            { snap: 'full', threshold: 0 },
        ];

        let nearest: SheetSnap = 'handle';
        let minDist = Infinity;
        for (const t of thresholds) {
            const dist = Math.abs(y - t.threshold);
            if (dist < minDist) {
                minDist = dist;
                nearest = t.snap;
            }
        }
        return nearest;
    };

    return (
        <div onClick={onClose} className={cn("fixed inset-0 z-[200] transition-opacity duration-500", !isOpen ? 'opacity-0 pointer-events-none' : 'pointer-events-auto')}>
            <motion.div
                onClick={(e) => e.stopPropagation()}
                initial={false}
                animate={{ y: snapOffsets[snap] }}
                transition={{ type: 'spring', damping: 30, stiffness: 250 }}
                drag="y"
                dragConstraints={{ top: 0, bottom: window.innerHeight - 48 }}
                dragElastic={0.1}
                onDragEnd={(_, info) => {
                    const currentY = info.point.y;
                    const newSnap = getNearestSnap(currentY, info.velocity.y);
                    setSnap(newSnap);
                }}
                className="pointer-events-auto relative w-full max-w-2xl mx-auto bg-darker/95 backdrop-blur-3xl border-t border-white/10 rounded-t-[40px] shadow-[0_-20px_60px_rgba(0,0,0,0.8)] flex flex-col pt-2 pb-12 overflow-hidden"
                style={{ height: '100vh', maxHeight: '100vh' }}
            >
                {/* Elegant Handle */}
                <div
                    className="mx-auto w-12 h-1.5 bg-white/10 rounded-full mb-3 shrink-0 cursor-grab active:cursor-grabbing"
                    onClick={() => setSnap(snap === 'handle' ? 'peek' : 'handle')}
                />

                <div className="flex justify-between items-center px-6 mb-3 shrink-0">
                    <h2 className="text-sm font-black text-white italic tracking-tighter uppercase leading-none flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-info animate-pulse" />
                        {title || 'Gestión de Flota'}
                    </h2>
                    <div className="flex items-center gap-2">
                        {snap === 'handle' ? (
                            <button
                                onClick={() => setSnap('peek')}
                                className="p-2 bg-white/5 rounded-full text-white/30 hover:text-white transition-all"
                            >
                                <ChevronDown className="w-4 h-4 rotate-180" />
                            </button>
                        ) : (
                            <button
                                onClick={() => setSnap('handle')}
                                className="p-2 bg-white/5 rounded-full text-white/30 hover:text-white transition-all"
                            >
                                <ChevronDown className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col px-6">
                    {collapsedContent && (
                        <motion.div
                            animate={{ opacity: snap === 'handle' ? 0 : 1, height: snap === 'handle' ? 0 : 'auto' }}
                            className="shrink-0 overflow-hidden"
                        >
                            <div className="pb-3">
                                {collapsedContent}
                            </div>
                        </motion.div>
                    )}

                    <motion.div
                        animate={{ opacity: snap === 'handle' ? 0 : snap === 'peek' ? 0.3 : 1 }}
                        className={cn(
                            "flex-1 overflow-y-auto no-scrollbar space-y-6 pb-20",
                            snap === 'handle' && "pointer-events-none"
                        )}
                    >
                        <div className="space-y-6">
                            <p className="text-[7px] font-black text-white/10 uppercase tracking-[0.4em] text-center italic mb-2">P R O T O C O L O — D E — O P E R A C I Ó N</p>
                            {children}
                        </div>
                    </motion.div>
                </div>

                {/* Visual Decorative Grid */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
                    <div className="grid grid-cols-12 h-full w-full">
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className="border-r border-info h-full" />
                        ))}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default BottomSheet;
