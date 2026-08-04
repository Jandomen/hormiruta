'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Route as RouteIcon, Trash2, Loader2, ChevronRight, History, CalendarDays } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

interface SavedRoutesProps {
    onLoadRoute: (route: any) => void;
    onClose: () => void;
}

export default function SavedRoutes({ onLoadRoute, onClose }: SavedRoutesProps) {
    const [routes, setRoutes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchRoutes();
    }, []);

    const fetchRoutes = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/routes');
            if (response.ok) {
                const data = await response.json();
                setRoutes(data);
            } else {
                setError('Error al cargar las rutas');
            }
        } catch (err) {
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const deleteRoute = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();

        // Custom toast confirmation
        toast((t) => (
            <div className="flex flex-col gap-3">
                <span className="font-black text-white text-sm">¿Eliminar esta ruta?</span>
                <span className="text-white/60 text-xs">Esta acción no se puede deshacer.</span>
                <div className="flex gap-2 justify-end mt-1">
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            performDelete(id);
                        }}
                        className="px-4 py-1.5 bg-red-500 text-white font-black text-xs rounded-xl uppercase tracking-widest"
                    >
                        Sí, eliminar
                    </button>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="px-4 py-1.5 bg-white/10 text-white font-black text-xs rounded-xl uppercase tracking-widest"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        ), { duration: 8000, style: { background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' } });
    };

    const performDelete = async (id: string) => {

        try {
            const response = await fetch(`/api/routes/${id}`, { method: 'DELETE' });
            if (response.ok) {
                setRoutes(prev => prev.filter(r => r._id !== id));
            }
        } catch (err) {
            toast.error('Error al eliminar la ruta');
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-MX', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const isToday = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-5 bg-black/60 backdrop-blur-sm"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                    className="w-full max-w-[300px] sm:max-w-xl bg-[#0a0a0a] border border-white/10 rounded-2xl sm:rounded-[32px] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)]"
            >
                <div className="p-3 sm:p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <div className="min-w-0">
                        <h2 className="text-sm sm:text-lg font-black italic tracking-tighter text-white uppercase leading-tight truncate">Mis Rutas</h2>
                        <p className="text-[10px] sm:text-xs font-bold text-white/60 uppercase tracking-widest mt-0.5">Historial y Planificación</p>
                    </div>
                    <button onClick={onClose} className="p-2 sm:p-3 hover:bg-white/5 rounded-xl sm:rounded-2xl transition-colors text-white/70 hover:text-white shrink-0">
                        <X className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                    </button>
                </div>

                <div className="p-3 sm:p-6 max-h-[50vh] overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-8 sm:py-16 space-y-2 sm:space-y-3">
                            <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-info animate-spin" />
                            <p className="text-[10px] sm:text-xs font-black text-white/60 uppercase tracking-[0.2em]">Accediendo...</p>
                        </div>
                    ) : error ? (
                        <div className="p-3 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-lg sm:rounded-xl text-red-500 text-[10px] sm:text-xs italic text-center">
                            {error}
                        </div>
                    ) : routes.length === 0 ? (
                        <div className="text-center py-8 sm:py-16 space-y-3 sm:space-y-4 opacity-30">
                            <History className="w-6 h-6 sm:w-10 sm:h-10 mx-auto text-white" />
                            <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest">No hay rutas guardadas</p>
                        </div>
                    ) : (
                        <div className="space-y-1.5 sm:space-y-3">
                            {routes.map((route) => (
                                <div
                                    key={route._id}
                                    onClick={() => onLoadRoute(route)}
                                    className="group relative flex items-center justify-between p-2 sm:p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg sm:rounded-2xl transition-all cursor-pointer"
                                >
                                    <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
                                        <div className={cn(
                                            "w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-all shrink-0",
                                            isToday(route.date) ? "bg-info text-dark shadow-[0_0_20px_rgba(96,165,250,0.3)]" : "bg-white/5 text-white/70"
                                        )}>
                                            <CalendarDays className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                                        </div>
                                        <div className="overflow-hidden">
                                            <h3 className="text-white font-black text-[10px] sm:text-xs uppercase tracking-tight truncate italic">{route.name}</h3>
                                            <div className="flex items-center gap-1 sm:gap-2 mt-0.5 truncate">
                                                <span className="text-[10px] sm:text-xs font-black text-white/60 uppercase tracking-widest">{formatDate(route.date)}</span>
                                                <span className="w-0.5 h-0.5 rounded-full bg-white/10 shrink-0" />
                                                <span className="text-[10px] sm:text-xs font-black text-info uppercase tracking-widest">{route.stops.length} Paradas</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                                        <button
                                            onClick={(e) => deleteRoute(route._id, e)}
                                            className="p-1.5 sm:p-2.5 bg-red-500/10 text-red-500 rounded-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
                                        >
                                            <Trash2 className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                                        </button>
                                        <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white/70 group-hover:text-white/70 transition-colors shrink-0" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-3 sm:p-6 bg-white/[0.02] border-t border-white/5">
                    <button
                        onClick={onClose}
                        className="w-full py-3 sm:py-4 rounded-lg sm:rounded-2xl border border-white/10 text-white font-black uppercase text-[10px] sm:text-xs tracking-widest hover:bg-white/5 transition-all"
                    >
                        Cerrar
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
