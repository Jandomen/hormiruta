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

            {/* Desktop Command HUD - Hidden to unify with Mobile Bar as requested */}
            <div className="hidden absolute bottom-10 left-1/2 -translate-x-1/2 z-30 w-full max-w-2xl px-6 pointer-events-none">
                <div className="w-full pointer-events-auto">
                    <RevolverDashboard
                        stops={stops}
                        onOptimize={optimizeRoute}
                        onCompleteCurrent={() => {
                            const currentStop = stops.find(s => s.isCurrent);
                            if (currentStop) handleCompleteStop(currentStop.id);
                        }}
                        isOptimizing={isOptimizing}
                        className="shadow-[0_40px_100px_rgba(0,0,0,0.8)] border-info/30 bg-darker/60 backdrop-blur-2xl"
                    />
                </div>
            </div>

            {/* Desktop Floating Add Button - Hidden to unify with Mobile Bar */}
            <div className="hidden absolute bottom-10 right-10 z-30">
                <button
                    onClick={() => setActiveModal('add-stop')}
                    className="w-20 h-20 bg-info rounded-3xl shadow-[0_20px_50px_rgba(49,204,236,0.5)] flex items-center justify-center text-dark hover:scale-110 active:scale-90 transition-all border-4 border-[#0a0a0a] group relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                    <Plus className="w-10 h-10 relative z-10 group-hover:rotate-90 transition-transform duration-500" />
                </button>
            </div>

            {/* Mobile Optimization / Reset Buttons Overlay - REMOVED (Moved to Revolver) */}

            {/* Bottom Navigation Bar (Unified Mobile/Web) */}
            <nav className="absolute bottom-12 left-3 right-3 sm:left-6 sm:right-6 h-14 bg-darker/95 backdrop-blur-3xl rounded-full border border-white/10 flex items-center justify-between px-4 sm:px-8 shadow-[0_20px_80px_rgba(0,0,0,0.9)] z-50 max-[340px]:gap-0.5">
                <button onClick={handleRecenter} className={cn("flex flex-col items-center gap-0.5 p-1 transition-all", isGpsActive ? "text-info font-black" : "text-white/20")}>
                    <Crosshair className={cn("w-5 h-5", isGpsActive && "animate-spin-slow")} />
                    <span className="text-[7px] font-black uppercase tracking-tighter">GPS</span>
                </button>
                <button onClick={() => setIsMobileMenuOpen(true)} className={cn("flex flex-col items-center gap-0.5 p-1 transition-all", isMobileMenuOpen ? "text-info" : "text-white/10")}>
                    <Menu className="w-5 h-5" />
                    <span className="text-[7px] font-black uppercase tracking-tighter">Mando</span>
                </button>
                <div className="relative -mt-14 h-16 flex items-center justify-center">
                    <motion.button 
                        onClick={() => setActiveModal('add-stop')} 
                        whileTap={{ scale: 0.9, rotate: 180 }} 
                        className="w-14 h-14 bg-info rounded-full shadow-[0_15px_60px_rgba(49,204,236,0.5)] flex items-center justify-center text-dark border-4 border-[#0a0a0a] ring-2 ring-white/5 shrink-0 z-20 relative"
                    >
                        <Plus className="w-8 h-8" />
                    </motion.button>
                </div>
                <button onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')} className={cn("flex flex-col items-center gap-0.5 p-1 transition-all", viewMode === 'list' ? "text-info" : "text-white/10")}>
                    {viewMode === 'map' ? <List className="w-5 h-5" /> : <MapIcon className="w-5 h-5" />}
                    <span className="text-[7px] font-black uppercase tracking-tighter">{viewMode === 'map' ? 'Lista' : 'Mapa'}</span>
                </button>
                <button onClick={() => setActiveModal('settings')} className="flex flex-col items-center gap-0.5 p-1 text-white/10 shrink-0"><SettingsIcon className="w-5 h-5" /><span className="text-[7px] font-black uppercase tracking-tighter">Config</span></button>
            </nav>
        </>
    );
}
