'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPinOff } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden text-center">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 max-w-lg"
            >
                <div className="mb-6 flex justify-center">
                    <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.2)]">
                        <MapPinOff className="w-12 h-12 text-red-500" />
                    </div>
                </div>

                <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-600 mb-2 tracking-tighter">
                    404
                </h1>
                <h2 className="text-2xl font-bold text-white mb-6">Ruta no encontrada</h2>
                <p className="text-white/50 mb-10 leading-relaxed">
                    Parece que te has desviado del camino. La página que buscas no existe o ha sido movida.
                </p>

                <div className="flex justify-center">
                    <Link href="/dashboard" className="px-8 py-4 bg-gradient-to-r from-info to-blue-600 text-white font-black rounded-2xl shadow-[0_0_20px_rgba(49,204,236,0.4)] hover:shadow-[0_0_40px_rgba(49,204,236,0.6)] hover:scale-105 transition-all flex items-center gap-2 group border border-white/10">
                        <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                        Regresar al Mapa
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
