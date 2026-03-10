'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalContainerProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    maxWidth?: string;
}

export const ModalContainer: React.FC<ModalContainerProps> = ({
    isOpen,
    onClose,
    title,
    children,
    maxWidth = 'max-w-2xl'
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-10">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-[#02040a]/80 backdrop-blur-xl"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className={`relative w-full ${maxWidth} bg-darker/50 border border-white/5 rounded-[40px] shadow-[0_50px_100px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh] overflow-hidden backdrop-blur-3xl`}
                    >
                        {/* Header */}
                        <div className="p-8 flex items-center justify-between border-b border-white/5 shrink-0">
                            <div>
                                <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">{title}</h3>
                                <div className="h-1 w-12 bg-info rounded-full mt-2" />
                            </div>
                            <button
                                onClick={onClose}
                                className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 hover:bg-white/10 transition-all group"
                            >
                                <X className="w-6 h-6 text-white/40 group-hover:text-white transition-colors" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
