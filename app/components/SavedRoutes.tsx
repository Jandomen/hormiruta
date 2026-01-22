'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Route as RouteIcon, Trash2, Loader2, ChevronRight, History, CalendarDays } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

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
        if (!confirm('¿Estás seguro de eliminar esta ruta?')) return;

        try {
            const response = await fetch(`/api/routes/${id}`, { method: 'DELETE' });
            if (response.ok) {
                setRoutes(prev => prev.filter(r => r._id !== id));
            }
        } catch (err) {
            alert('Error al eliminar');
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
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-[32px] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)]"
            >
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <div>
                        <h2 className="text-2xl font-black italic tracking-tighter text-white uppercase">Mis Rutas</h2>
                        <p className="text-xs font-bold text-white/30 uppercase tracking-widest mt-1">Historial y Planificación</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <Loader2 className="w-8 h-8 text-info animate-spin" />
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Accediendo al servidor...</p>
                        </div>
                    ) : error ? (
                        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm italic text-center">
                            {error}
                        </div>
                    ) : routes.length === 0 ? (
                        <div className="text-center py-20 space-y-6 opacity-30">
                            <History className="w-12 h-12 mx-auto text-white" />
                            <p className="text-xs font-black uppercase tracking-widest">No hay rutas guardadas aún</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {routes.map((route) => (
                                <div
                                    key={route._id}
                                    onClick={() => onLoadRoute(route)}
                                    className="group relative flex items-center justify-between p-6 bg-white/5 hover:bg-white/10 border border-white/5 rounded-3xl transition-all cursor-pointer hover:scale-[1.01]"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                                            isToday(route.date) ? "bg-info text-dark shadow-[0_0_20px_rgba(49,204,236,0.3)]" : "bg-white/5 text-white/40"
                                        )}>
                                            <CalendarDays className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-bold text-sm uppercase tracking-tight">{route.name}</h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{formatDate(route.date)}</span>
                                                <span className="w-1 h-1 rounded-full bg-white/10" />
                                                <span className="text-[10px] font-black text-info uppercase tracking-widest">{route.stops.length} Paradas</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={(e) => deleteRoute(route._id, e)}
                                            className="p-3 bg-red-500/10 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <ChevronRight className="w-5 h-5 text-white/10 group-hover:text-white/40 transition-colors" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-8 bg-white/[0.02] border-t border-white/5">
                    <button
                        onClick={onClose}
                        className="w-full py-4 rounded-2xl border border-white/10 text-white font-black uppercase text-[10px] tracking-widest hover:bg-white/5 transition-all"
                    >
                        Cerrar Panel
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
