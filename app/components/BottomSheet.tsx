'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation, Variants } from 'framer-motion';
import { GripHorizontal, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface BottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
    collapsedContent?: React.ReactNode;
}

const BottomSheet = ({ isOpen, onClose, children, title, collapsedContent }: BottomSheetProps) => {
    const controls = useAnimation();
    const [sheetState, setSheetState] = useState<'collapsed' | 'expanded'>('collapsed');

    useEffect(() => {
        if (isOpen) {
            controls.start(sheetState);
        } else {
            controls.start('hidden');
        }
    }, [isOpen, sheetState, controls]);

    const handleDragEnd = (_: any, info: any) => {
        const velocity = info.velocity.y;
        const offset = info.offset.y;

        if (offset > 150 || velocity > 500) {
            if (sheetState === 'expanded') {
                setSheetState('collapsed');
                controls.start('collapsed');
            } else {
                onClose();
            }
        } else if (offset < -100 || velocity < -500) {
            if (sheetState === 'collapsed') {
                setSheetState('expanded');
                controls.start('expanded');
            }
        } else {
            controls.start(sheetState);
        }
    };

    const variants: Variants = {
        hidden: { y: '100%', transition: { type: 'spring', damping: 30, stiffness: 300 } },
        collapsed: { y: '70%', transition: { type: 'spring', damping: 30, stiffness: 300 } },
        expanded: { y: '10%', transition: { type: 'spring', damping: 30, stiffness: 300 } }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop for expanded state */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: sheetState === 'expanded' ? 1 : 0 }}
                        exit={{ opacity: 0 }}
                        onClick={() => {
                            setSheetState('collapsed');
                        }}
                        className={cn(
                            "fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[55] lg:hidden",
                            sheetState === 'collapsed' && "pointer-events-none"
                        )}
                    />

                    <motion.div
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={0.05}
                        onDragEnd={handleDragEnd}
                        variants={variants}
                        initial="hidden"
                        animate={controls}
                        exit="hidden"
                        className={cn(
                            "fixed bottom-0 left-0 right-0 z-[60] bg-darker/95 backdrop-blur-3xl border-t border-white/10 rounded-t-[40px] shadow-[0_-20px_60px_rgba(0,0,0,0.5)] lg:hidden flex flex-col",
                            sheetState === 'expanded' ? "h-[90vh]" : "h-[30vh]"
                        )}
                        style={{ touchAction: 'none' }}
                    >
                        {/* Drag Handle Container */}
                        <div
                            className="flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing shrink-0"
                            onClick={() => setSheetState(sheetState === 'collapsed' ? 'expanded' : 'collapsed')}
                        >
                            <div className="w-12 h-1.5 bg-white/10 rounded-full mb-4" />

                            {sheetState === 'collapsed' && collapsedContent ? (
                                <div className="w-full px-6 overflow-hidden">
                                    {collapsedContent}
                                </div>
                            ) : (
                                <div className="flex items-center justify-between w-full px-8">
                                    <h3 className="text-white font-black italic tracking-tighter uppercase text-xl">{title || 'En Ruta'}</h3>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                                        className="p-2 bg-white/5 rounded-full text-white/40"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Content Area - Scrollable */}
                        <div className={cn(
                            "flex-1 overflow-y-auto px-6 pb-20 custom-scrollbar touch-pan-y transition-opacity duration-300",
                            sheetState === 'collapsed' && !collapsedContent ? "opacity-0" : "opacity-100"
                        )}>
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default BottomSheet;
