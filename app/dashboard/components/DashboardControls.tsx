'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    RefreshCw, List, Navigation as NavIcon, CheckCircle, Crosshair, Menu, Plus, Map as MapIcon, Settings as SettingsIcon, ShieldAlert, RotateCcw, Sun, Moon, ArrowUpDown
} from 'lucide-react';
import { cn } from '../../lib/utils';
import RevolverDashboard from '../../components/RevolverDashboard';
import { Stop, ActiveModal } from '../types';

interface Props {
    showTraffic: boolean;
    setShowTraffic: (val: boolean) => void;
    returnToStart: boolean;
    setReturnToStart: (val: boolean) => void;
    navigationTargetId: string | null;
    setNavigationTargetId: (id: string | null) => void;
    setNotification: (msg: string | null) => void;
    stops: Stop[];
    handleFinishRoute: () => void;
    optimizeRoute: () => void;
    isOptimizing: boolean;
    handleQuickNavigation: () => void;
    handleRecenter: () => void;
    isGpsActive: boolean;
    setIsMobileMenuOpen: (val: boolean) => void;
    isMobileMenuOpen: boolean;
    setActiveModal: (modal: ActiveModal) => void;
    viewMode: 'map' | 'list';
    setViewMode: (mode: 'map' | 'list') => void;
    handleCompleteStop: (id: string) => void;
    onReset: () => void;
    mapTheme: 'light' | 'dark';
    setMapTheme: (theme: 'light' | 'dark') => void;
    handleReverseRoute: () => void;
    isRouteReversed: boolean;
}

export default function DashboardControls(props: Props) {
    const {
        showTraffic, setShowTraffic, returnToStart, setReturnToStart,
        navigationTargetId, setNavigationTargetId, setNotification,
        stops, handleFinishRoute, optimizeRoute, isOptimizing,
        handleQuickNavigation, handleRecenter, isGpsActive,
        setIsMobileMenuOpen, isMobileMenuOpen, setActiveModal,
        viewMode, setViewMode, handleCompleteStop, onReset,
        mapTheme, setMapTheme, handleReverseRoute, isRouteReversed
    } = props;

    return (
        <>
            {/* Map Controls — hidden on mobile (<640px), only SOS floats */}
            <div className="absolute top-20 lg:top-8 left-4 lg:left-6 z-10 hidden sm:flex flex-col gap-3 transition-all pointer-events-auto">
                <button
                    onClick={onReset}
                    className="flex items-center gap-1.5 px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg lg:rounded-xl border border-red-500/20 shadow-2xl backdrop-blur-2xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all w-fit group"
                >
                    <RotateCcw className="w-3 h-3 lg:w-4 lg:h-4 group-active:-rotate-180 transition-transform" />
                    <span className="text-[10px] lg:text-[11px] font-black uppercase tracking-widest leading-none">Reset</span>
                </button>

                <button
                    onClick={() => setShowTraffic(!showTraffic)}
                    className={cn(
                        "flex items-center gap-1.5 px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg lg:rounded-xl border border-white/10 shadow-2xl backdrop-blur-2xl transition-all w-fit",
                        showTraffic ? "bg-info/20 text-info border-info/40" : "bg-black/60 text-white/50 hover:bg-black/80"
                    )}
                >
                    <div className={cn("w-1.5 h-1.5 rounded-full", showTraffic ? "bg-info animate-pulse shadow-[0_0_10px_rgba(96,165,250,0.8)]" : "bg-white/20")} />
                    <span className="text-[10px] lg:text-[11px] font-black uppercase tracking-widest">Tráfico</span>
                </button>

                <button
                    onClick={() => setReturnToStart(!returnToStart)}
                    className={cn(
                        "flex items-center gap-1.5 px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg lg:rounded-xl border border-white/10 shadow-2xl backdrop-blur-2xl transition-all w-fit",
                        returnToStart ? "bg-info/20 text-info border-info/40 shadow-[0_0_20px_rgba(96,165,250,0.2)]" : "bg-black/60 text-white/50 hover:bg-black/80"
                    )}
                >
                    <RefreshCw className={cn("w-3 h-3 lg:w-4 lg:h-4", returnToStart && "animate-spin-slow")} />
                    <span className="text-[10px] lg:text-[11px] font-black uppercase tracking-widest">Circuito</span>
                </button>

                <button
                    onClick={() => setMapTheme(mapTheme === 'dark' ? 'light' : 'dark')}
                    className={cn(
                        "flex items-center gap-1.5 px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg lg:rounded-xl border border-white/10 shadow-2xl backdrop-blur-2xl transition-all w-fit",
                        mapTheme === 'dark' ? "bg-info/20 text-info border-info/40" : "bg-amber-500/20 text-amber-400 border-amber-500/20"
                    )}
                >
                    {mapTheme === 'dark' ? <Moon className="w-3 h-3 lg:w-4 lg:h-4" /> : <Sun className="w-3 h-3 lg:w-4 lg:h-4" />}
                    <span className="text-[10px] lg:text-[11px] font-black uppercase tracking-widest">{mapTheme === 'dark' ? 'Noche' : 'Día'}</span>
                </button>

                {navigationTargetId && (
                    <button
                        onClick={() => { setNavigationTargetId(null); setNotification('Vista de ruta completa restaurada'); }}
                        className="flex items-center gap-2 lg:gap-3 px-3 lg:px-6 py-2 lg:py-3.5 rounded-xl lg:rounded-2xl border border-white/10 shadow-2xl backdrop-blur-2xl bg-black/90 text-info hover:bg-black hover:scale-105 transition-all w-fit group"
                    >
                        <List className="w-3.5 h-3.5 lg:w-4 lg:h-4 group-hover:rotate-12 transition-transform" />
                        <span className="text-[10px] lg:text-[11px] font-black uppercase tracking-widest">Ver Ruta Completa</span>
                    </button>
                )}
            </div>
            {/* Circuito — floating button on mobile main screen */}
            <div className="absolute top-[196px] left-4 z-10 sm:hidden">
                <button
                    onClick={() => setReturnToStart(!returnToStart)}
                    className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 shadow-2xl backdrop-blur-2xl transition-all w-fit",
                        returnToStart ? "bg-info/20 text-info border-info/40 shadow-[0_0_20px_rgba(96,165,250,0.2)]" : "bg-black/60 text-white/50 hover:bg-black/80"
                    )}
                >
                    <RefreshCw className={cn("w-3 h-3", returnToStart && "animate-spin-slow")} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Circuito</span>
                </button>
                <button
                    onClick={handleReverseRoute}
                    className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 mt-2 rounded-lg border border-white/10 shadow-2xl backdrop-blur-2xl transition-all w-fit",
                        isRouteReversed
                            ? "bg-info/20 text-info border-info/40 shadow-[0_0_20px_rgba(96,165,250,0.2)]"
                            : "bg-black/60 text-white/50 hover:bg-black/80"
                    )}
                >
                    <ArrowUpDown className={cn("w-3 h-3", isRouteReversed && "text-info")} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{isRouteReversed ? 'Ruta Invertida' : 'Invertir Ruta'}</span>
                </button>
            </div>
            {/* Command HUD - Visible on Map View */}
            <AnimatePresence>
                {viewMode === 'map' && (
                    <motion.div 
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="absolute bottom-32 sm:bottom-40 left-1/2 -translate-x-1/2 lg:left-auto lg:right-6 lg:translate-x-0 lg:bottom-6 z-30 w-[95%] max-w-lg lg:w-[400px] px-2 pointer-events-none"
                    >
                        <div className="w-full pointer-events-auto">
                            <RevolverDashboard
                                stops={stops}
                                onOptimize={optimizeRoute}
                                onStartNavigation={handleQuickNavigation}
                                onCompleteCurrent={() => {
                                    const currentStop = stops.find(s => s.isCurrent) || stops.find(s => !s.isCompleted && !s.isFailed);
                                    if (currentStop) handleCompleteStop(currentStop.id);
                                }}
                                onFinishRoute={handleFinishRoute}
                                isOptimizing={isOptimizing}
                                className="shadow-[0_40px_100px_rgba(0,0,0,0.8)] border-info/30 bg-darker/80 backdrop-blur-2xl rounded-3xl overflow-hidden h-28 sm:h-32"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom Navigation Bar */}
            <nav className="fixed bottom-[9px] sm:bottom-12 left-1 right-1 sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md h-14 sm:h-20 bg-darker/95 rounded-xl sm:rounded-3xl border border-white/15 flex items-center justify-center shadow-[0_25px_100px_rgba(0,0,0,0.95)] ring-1 ring-info/5 z-50 touch-action-manipulation lg:hidden">
                <div className="flex-1 flex justify-center">
                    <motion.button whileTap={{ scale: 0.9 }} onClick={handleRecenter} className={cn("flex flex-col items-center gap-0.5 sm:gap-1.5 p-0.5 sm:p-2.5 transition-all", isGpsActive ? "text-info font-black drop-shadow-[0_0_8px_rgba(96,165,250,0.3)]" : "text-white/50 hover:text-white/70")}>
                        <Crosshair className={cn("w-4 h-4 sm:w-7 sm:h-7", isGpsActive && "animate-spin-slow")} />
                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-wide">GPS</span>
                    </motion.button>
                </div>
                <div className="flex-1 flex justify-center">
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsMobileMenuOpen(true)} className={cn("flex flex-col items-center gap-0.5 sm:gap-1.5 p-0.5 sm:p-2.5 transition-all", isMobileMenuOpen ? "text-info drop-shadow-[0_0_8px_rgba(96,165,250,0.3)]" : "text-white/50 hover:text-white/70")}>
                        <Menu className="w-4 h-4 sm:w-7 sm:h-7" />
                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-wide">Mando</span>
                    </motion.button>
                </div>
                <div className="flex-1 flex justify-center relative">
                    <div className="relative -mt-10 sm:-mt-20 h-12 sm:h-24 flex items-center justify-center">
                        <motion.button 
                            onClick={() => setActiveModal('add-stop')} 
                            whileTap={{ scale: 0.9, rotate: 180 }} 
                            className="w-10 h-10 sm:w-[72px] sm:h-[72px] bg-info rounded-xl sm:rounded-[20px] shadow-[0_15px_60px_rgba(96,165,250,0.6)] flex items-center justify-center text-dark border-2 sm:border-4 border-[#0a0a0a] ring-2 ring-white/10 z-20 relative hover:shadow-[0_20px_80px_rgba(96,165,250,0.8)] transition-shadow"
                        >
                            <Plus className="w-5 h-5 sm:w-10 sm:h-10" />
                        </motion.button>
                    </div>
                </div>
                <div className="flex-1 flex justify-center">
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')} className={cn("flex flex-col items-center gap-0.5 sm:gap-1.5 p-0.5 sm:p-2.5 transition-all", viewMode === 'list' ? "text-info drop-shadow-[0_0_8px_rgba(96,165,250,0.3)]" : "text-white/50 hover:text-white/70")}>
                        {viewMode === 'map' ? <List className="w-4 h-4 sm:w-7 sm:h-7" /> : <MapIcon className="w-4 h-4 sm:w-7 sm:h-7" />}
                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-wide">{viewMode === 'map' ? 'Lista' : 'Mapa'}</span>
                    </motion.button>
                </div>
                <div className="flex-1 flex justify-center">
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => setActiveModal('settings')} className="flex flex-col items-center gap-0.5 sm:gap-1.5 p-0.5 sm:p-2.5 text-white/50 hover:text-white/70 transition-all">
                        <SettingsIcon className="w-4 h-4 sm:w-7 sm:h-7" />
                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-wide">Ajustes</span>
                    </motion.button>
                </div>
            </nav>

        </>
    );
}
