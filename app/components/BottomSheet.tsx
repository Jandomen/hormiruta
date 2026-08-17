'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, GripHorizontal } from 'lucide-react';
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
    const [isDragging, setIsDragging] = React.useState(false);
    const dragStartY = React.useRef(0);
    const dragStartSnap = React.useRef<SheetSnap>('handle');

    React.useEffect(() => {
        setSnap(isOpen ? 'peek' : 'handle');
    }, [isOpen]);

    const snapOffsets: Record<SheetSnap, string> = {
        handle: 'calc(100% - 48px)',
        peek: 'calc(100% - 210px)',
        half: 'calc(100% - 55vh)',
        full: '0px',
    };

    const snapOrder: SheetSnap[] = ['handle', 'peek', 'half', 'full'];

    const getSnapForDelta = (deltaY: number, current: SheetSnap): SheetSnap => {
        const idx = snapOrder.indexOf(current);
        if (deltaY < -30 && idx < snapOrder.length - 1) return snapOrder[idx + 1];
        if (deltaY > 30 && idx > 0) return snapOrder[idx - 1];
        return current;
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        dragStartY.current = e.touches[0].clientY;
        dragStartSnap.current = snap;
        setIsDragging(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        e.preventDefault();
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!isDragging) return;
        setIsDragging(false);
        const deltaY = e.changedTouches[0].clientY - dragStartY.current;
        const newSnap = getSnapForDelta(deltaY, dragStartSnap.current);
        setSnap(newSnap);
    };

    return (
        <div
            onClick={onClose}
            className={cn(
                "fixed inset-0 z-[200] transition-opacity duration-500",
                !isOpen ? 'opacity-0 pointer-events-none' : 'pointer-events-auto'
            )}
        >
            <motion.div
                onClick={(e) => e.stopPropagation()}
                initial={false}
                animate={{ y: snapOffsets[snap] }}
                transition={{ type: 'spring', damping: 32, stiffness: 280 }}
                className={cn(
                    "pointer-events-auto relative w-full max-w-2xl mx-auto bg-darker/95 border-t border-white/10 rounded-t-[40px] shadow-[0_-20px_60px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden",
                    !isOpen && "pointer-events-none"
                )}
                style={{ height: '100vh', maxHeight: '100vh' }}
            >
                {/* Draggable Header — solo aquí se capturan gestos de drag */}
                <div
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onClick={() => {
                        if (snap === 'handle') setSnap('peek');
                        else if (snap === 'peek') setSnap('half');
                        else if (snap === 'half') setSnap('full');
                        else setSnap('handle');
                    }}
                    className="shrink-0 pt-2 px-6 pb-3 cursor-grab active:cursor-grabbing select-none"
                >
                    <div className="mx-auto w-12 h-1.5 bg-white/10 rounded-full mb-3" />

                    <div className="flex justify-between items-center">
                        <h2 className="text-sm font-black text-white italic tracking-tighter uppercase leading-none flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-info animate-pulse" />
                            {title || 'Gestión de Flota'}
                        </h2>
                        <div className="flex items-center gap-2">
                            <ChevronDown
                                className={cn(
                                    "w-4 h-4 text-white/70 transition-transform duration-300",
                                    snap === 'full' ? "rotate-0" : "rotate-180"
                                )}
                            />
                        </div>
                    </div>
                </div>

                {/* Content — scroll nativo sin interferencia de drag */}
                <div className="flex-1 overflow-hidden flex flex-col px-6">
                    {collapsedContent && (
                        <div
                            className="shrink-0 overflow-hidden transition-all duration-300"
                            style={{
                                opacity: snap === 'handle' ? 0 : 1,
                                maxHeight: snap === 'handle' ? '0px' : '300px',
                            }}
                        >
                            <div className="pb-3">
                                {collapsedContent}
                            </div>
                        </div>
                    )}

                    <div
                        className={cn(
                            "flex-1 overflow-y-auto overscroll-contain space-y-2 pb-20",
                            snap === 'handle' && "opacity-0 pointer-events-none"
                        )}
                        style={{
                            WebkitOverflowScrolling: 'touch',
                            scrollBehavior: 'smooth',
                        }}
                    >
                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.4em] text-center italic mb-2">
                                P R O T O C O L O — D E — O P E R A C I Ó N
                            </p>
                            {children}
                        </div>
                    </div>
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
