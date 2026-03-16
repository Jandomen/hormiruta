'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface FleetDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
    collapsedContent?: React.ReactNode;
    sheetMode?: 'collapsed' | 'expanded';
    onModeChange?: (mode: 'collapsed' | 'expanded') => void;
}

const BottomSheet = ({ isOpen, onClose, children, title, collapsedContent }: FleetDrawerProps) => {
    const [isExpanded, setIsExpanded] = React.useState(false);
    
    // Bottom height for collapsed state (just enough for the Revolver + Header)
    const collapsedHeight = 160; 
    
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-x-0 bottom-0 z-[200] pointer-events-none">
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: isExpanded ? 0 : 'calc(100% - 180px)' }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 180 }}
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        onDragEnd={(_, info) => {
                            if (info.offset.y < -50) setIsExpanded(true);
                            if (info.offset.y > 50) setIsExpanded(false);
                        }}
                        className="pointer-events-auto relative w-full max-w-2xl mx-auto bg-darker/95 backdrop-blur-3xl border-t border-white/10 rounded-t-[40px] shadow-[0_-20px_60px_rgba(0,0,0,0.8)] flex flex-col pt-2 pb-12 overflow-hidden"
                        style={{ height: '50vh' }}
                    >
                        {/* Elegant Handle */}
                        <div 
                            className="mx-auto w-12 h-1.5 bg-white/10 rounded-full mb-4 shrink-0 cursor-grab active:cursor-grabbing" 
                            onClick={() => setIsExpanded(!isExpanded)}
                        />

                        <div className="flex justify-between items-center px-6 mb-4">
                            <h2 className="text-sm font-black text-white italic tracking-tighter uppercase leading-none flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-info animate-pulse" />
                                {title || 'Gestión de Flota'}
                            </h2>
                            <button 
                                onClick={onClose} 
                                className="p-2 bg-white/5 rounded-full text-white/30 hover:text-white transition-all transform rotate-90"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-hidden flex flex-col px-6">
                            {collapsedContent && (
                                <div className="mb-6 shrink-0">
                                    {collapsedContent}
                                </div>
                            )}
                            
                            <motion.div 
                                initial={false}
                                animate={{ opacity: isExpanded ? 1 : 0, y: isExpanded ? 0 : 20 }}
                                className={cn(
                                    "flex-1 overflow-y-auto no-scrollbar space-y-6 pb-20",
                                    !isExpanded && "pointer-events-none"
                                )}
                            >
                                <div className="space-y-6">
                                    <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.5em] text-center italic mb-2">P R O T O C O L O — D E — O P E R A C I Ó N</p>
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
            )}
        </AnimatePresence>
    );
};

export default BottomSheet;
