'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    RefreshCw, List, Navigation as NavIcon, CheckCircle, Crosshair, Menu, Plus, Map as MapIcon, Settings as SettingsIcon, ShieldAlert 
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
}

export default function DashboardControls(props: Props) {
    const {
        showTraffic, setShowTraffic, returnToStart, setReturnToStart,
        navigationTargetId, setNavigationTargetId, setNotification,
        stops, handleFinishRoute, optimizeRoute, isOptimizing,
        handleQuickNavigation, handleRecenter, isGpsActive,
        setIsMobileMenuOpen, isMobileMenuOpen, setActiveModal,
        viewMode, setViewMode, handleCompleteStop
    } = props;

    return (
        <>
            {/* Map Controls */}
            <div className="absolute top-20 lg:top-8 left-4 lg:left-6 z-10 flex flex-col gap-3 transition-all">
                <button
                    onClick={() => setShowTraffic(!showTraffic)}
                    className={cn(
                        "flex items-center gap-1.5 px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg lg:rounded-xl border border-white/10 shadow-2xl backdrop-blur-2xl transition-all w-fit",
                        showTraffic ? "bg-info/20 text-info border-info/40" : "bg-black/60 text-white/50 hover:bg-black/80"
                    )}
                >
                    <div className={cn("w-1.5 h-1.5 rounded-full", showTraffic ? "bg-info animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.8)]" : "bg-white/20")} />
                    <span className="text-[8px] lg:text-[10px] font-black uppercase tracking-widest">Tráfico</span>
                </button>

                <button
                    onClick={() => setReturnToStart(!returnToStart)}
                    className={cn(
                        "flex items-center gap-1.5 px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg lg:rounded-xl border border-white/10 shadow-2xl backdrop-blur-2xl transition-all w-fit",
                        returnToStart ? "bg-info/20 text-info border-info/40 shadow-[0_0_20px_rgba(49,204,236,0.2)]" : "bg-black/60 text-white/50 hover:bg-black/80"
                    )}
                >
                    <RefreshCw className={cn("w-3 h-3 lg:w-4 lg:h-4", returnToStart && "animate-spin-slow")} />
                    <span className="text-[8px] lg:text-[10px] font-black uppercase tracking-widest">Circuito</span>
                </button>

                {navigationTargetId && (
                    <button
                        onClick={() => { setNavigationTargetId(null); setNotification('Vista de ruta completa restaurada'); }}
                        className="flex items-center gap-3 px-5 lg:px-6 py-3 lg:py-3.5 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-2xl bg-black/90 text-info hover:bg-black hover:scale-105 transition-all w-fit group"
                    >
                        <List className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                        <span className="text-[11px] font-black uppercase tracking-widest">Ver Ruta Completa</span>
                    </button>
                )}
            </div>
            {/* Command HUD - Visible on Map View */}
            <AnimatePresence>
                {viewMode === 'map' && (
                    <motion.div 
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="absolute bottom-40 left-1/2 -translate-x-1/2 z-30 w-[95%] max-w-lg px-2 pointer-events-none"
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
                                isOptimizing={isOptimizing}
                                className="shadow-[0_40px_100px_rgba(0,0,0,0.8)] border-info/30 bg-darker/80 backdrop-blur-2xl rounded-3xl overflow-hidden h-32 sm:h-36"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom Navigation Bar (Unified Mobile/Web) upgraded size */}
            <nav className="absolute bottom-6 sm:bottom-10 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md h-16 bg-darker/95 backdrop-blur-3xl rounded-3xl border border-white/10 flex items-center justify-between px-4 sm:px-10 shadow-[0_20px_80px_rgba(0,0,0,0.9)] z-50">
                <button onClick={handleRecenter} className={cn("flex flex-col items-center gap-1 p-1 sm:p-2 transition-all", isGpsActive ? "text-info font-black" : "text-white/20")}>
                    <Crosshair className={cn("w-5 h-5 sm:w-6 sm:h-6", isGpsActive && "animate-spin-slow")} />
                    <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-tight">GPS</span>
                </button>
                <button onClick={() => setIsMobileMenuOpen(true)} className={cn("flex flex-col items-center gap-1 p-1 sm:p-2 transition-all", isMobileMenuOpen ? "text-info" : "text-white/10")}>
                    <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-tight">Mando</span>
                </button>
                <div className="relative -mt-16 h-16 sm:h-20 flex items-center justify-center">
                    <motion.button 
                        onClick={() => setActiveModal('add-stop')} 
                        whileTap={{ scale: 0.9, rotate: 180 }} 
                        className="w-14 h-14 sm:w-16 sm:h-16 bg-info rounded-[18px] shadow-[0_15px_60px_rgba(49,204,236,0.5)] flex items-center justify-center text-dark border-2 sm:border-4 border-[#0a0a0a] ring-2 ring-white/5 shrink-0 z-20 relative"
                    >
                        <Plus className="w-8 h-8 sm:w-9 sm:h-9" />
                    </motion.button>
                </div>
                <button onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')} className={cn("flex flex-col items-center gap-1 p-1 sm:p-2 transition-all", viewMode === 'list' ? "text-info" : "text-white/10")}>
                    {viewMode === 'map' ? <List className="w-5 h-5 sm:w-6 sm:h-6" /> : <MapIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
                    <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-tight">{viewMode === 'map' ? 'Lista' : 'Mapa'}</span>
                </button>
                <button onClick={() => setActiveModal('settings')} className="flex flex-col items-center gap-1 p-1 sm:p-2 text-white/10 shrink-0">
                    <SettingsIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-tight">Periferia</span>
                </button>
            </nav>

        </>
    );
}
