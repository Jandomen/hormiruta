'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function LoadingScreen() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex h-screen bg-darker items-center justify-center"
        >
            <div className="text-center">
                <motion.img
                    initial={{ scale: 0.8 }}
                    animate={{ scale: [0.8, 1.1, 1], rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    src="/LogoHormiruta.png"
                    alt="Logo"
                    className="w-16 h-16 mx-auto mb-4"
                />
                <p className="text-info font-black text-xs uppercase tracking-widest animate-pulse">Verificando Protocolo...</p>
            </div>
        </motion.div>
    );
}
