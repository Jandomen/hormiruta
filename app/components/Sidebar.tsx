'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Truck, Car, RefreshCw, MapPin, Crosshair,
    LayoutDashboard, User, List, History, Upload,
    Save, Settings as SettingsIcon, Crown
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
    session: any;
    isPro: boolean;
    stops: any[];
    originPoint: any;
    vehicleType: string;
    viewMode: 'map' | 'list';
    activeModal: string | null;
    returnToStart: boolean;
    setReturnToStart: (val: boolean) => void;
    handleReverseRoute: () => void;
    refreshOriginLocation: (sync: boolean) => void;
    setVehicleType: (type: any) => void;
    setActiveModal: (modal: any) => void;
    setViewMode: (mode: 'map' | 'list') => void;

    playNotification: (sound?: string) => void;
    router: any;
    className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
    session,
    isPro,
    stops,
    originPoint,
    vehicleType,
    viewMode,
    activeModal,
    returnToStart,
    setReturnToStart,
    handleReverseRoute,
    refreshOriginLocation,
    setVehicleType,
    setActiveModal,
    setViewMode,
    playNotification,
    router,
    className
}) => {
    const vehicleOptions = [
        { type: 'truck', icon: Truck, label: 'Trailer' },
        { type: 'van', icon: Car, label: 'Van' },
        { type: 'car', icon: Car, label: 'Auto' },
        { type: 'pickup', icon: Car, label: 'Pickup' },
        { type: 'motorcycle', icon: Car, label: 'Moto' },
        { type: 'ufo', icon: Car, label: '🛸 OVNI' },
    ];

    return (
        <aside className={cn("hidden lg:flex w-80 flex-col bg-darker border-r border-white/5 z-50 shadow-[20px_0_100px_rgba(0,0,0,0.5)] overflow-hidden", className)}>
            <Link href="/pricing" className="p-8 pb-0 block hover:opacity-80 transition-opacity group">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-info/20 blur-xl rounded-full animate-pulse group-hover:bg-info/40 transition-colors" />
                        <div className="relative w-12 h-12 bg-dark/40 border border-info/30 rounded-full flex items-center justify-center p-2 backdrop-blur-md shadow-lg">
                            <img src="/LogoHormiruta.png" alt="Logo" className="w-full h-full object-contain" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tighter text-white italic leading-none">HORMIRUTA</h1>
                        <p className="text-[8px] font-black text-info/40 uppercase tracking-[0.2em] mt-1 group-hover:text-info transition-colors">Intelligence Layer</p>
                    </div>
                </div>
            </Link>

            <div className="flex-1 overflow-y-auto p-8 pt-10 space-y-10 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
                <div className="space-y-6">
                    <div className="bg-white/5 p-4 rounded-[28px] border border-white/5 space-y-3">
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] pl-1">Configuración de Trayecto</p>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-white/60 uppercase tracking-tight">Regreso al Inicio</span>
                                <button
                                    onClick={() => setReturnToStart(!returnToStart)}
                                    className={cn(
                                        "w-10 h-5 rounded-full transition-all relative p-1",
                                        returnToStart ? "bg-info" : "bg-white/10"
                                    )}
                                >
                                    <div className={cn(
                                        "w-3 h-3 bg-white rounded-full transition-all shadow-md",
                                        returnToStart ? "translate-x-5" : "translate-x-0"
                                    )} />
                                </button>
                            </div>
                            <p className="text-[9px] text-white/20 leading-relaxed">
                                {returnToStart
                                    ? "La ruta terminará cerca de tu punto de partida."
                                    : "Ruta abierta: terminará en la última entrega."}
                            </p>
                        </div>

                        <div className="pt-2 space-y-2 border-t border-white/5 mt-2 pt-4">
                            <button
                                onClick={handleReverseRoute}
                                disabled={stops.length < 2}
                                className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/5 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-20 disabled:cursor-not-allowed group"
                            >
                                <RefreshCw className="w-3 h-3 group-hover:rotate-180 transition-all duration-500" />
                                Invertir Ruta
                            </button>
                        </div>

                        <div className="pt-2 space-y-2">
                            <label className="text-[9px] font-black text-white/20 uppercase tracking-widest pl-1">Punto de Partida</label>
                            <div className="flex items-center gap-3 p-3 bg-dark/40 rounded-2xl border border-white/5">
                                <MapPin className="w-4 h-4 text-info/40" />
                                <span className="text-[10px] text-white/60 font-bold truncate">{originPoint.address}</span>
                            </div>
                            <button
                                onClick={() => refreshOriginLocation(true)}
                                className="w-full py-3 bg-info/10 hover:bg-info/20 text-info rounded-xl border border-info/20 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all group"
                            >
                                <Crosshair className="w-3 h-3 group-active:rotate-90 transition-all" />
                                Sincronizar Inicio
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] pl-1">Selecciona tu Vehículo</p>
                        <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar -mx-2 px-2 snap-x scroll-smooth">
                            {vehicleOptions.map((opt) => (
                                <button
                                    key={opt.type}
                                    onClick={() => {
                                        setVehicleType(opt.type);
                                        playNotification('sound1');
                                    }}
                                    className={cn(
                                        "flex-shrink-0 w-20 h-24 flex flex-col items-center justify-center rounded-[24px] transition-all duration-500 border-2 snap-center relative group overflow-hidden",
                                        vehicleType === opt.type
                                            ? "bg-info/20 text-info border-info shadow-[0_15px_40px_rgba(49,204,236,0.3)] scale-105"
                                            : "bg-white/5 text-white/20 border-white/5 hover:bg-white/10 hover:text-white/40"
                                    )}
                                >
                                    {vehicleType === opt.type && (
                                        <motion.div
                                            layoutId="activeVehicle"
                                            className="absolute inset-0 bg-gradient-to-b from-info/10 to-transparent"
                                        />
                                    )}
                                    <div className="text-3xl mb-2 group-hover:rotate-[360deg] transition-transform duration-1000">
                                        {opt.type === 'truck' && '🚛'}
                                        {opt.type === 'van' && '🚐'}
                                        {opt.type === 'car' && '🚗'}
                                        {opt.type === 'pickup' && '🛻'}
                                        {opt.type === 'motorcycle' && '🏍️'}
                                        {opt.type === 'ufo' && '🛸'}
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-tight text-center">{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <nav className="space-y-3">
                    {[
                        { icon: LayoutDashboard, label: 'Panel de Control', active: activeModal === null && viewMode === 'map' },
                        { icon: User, label: 'Mis Datos / Perfil', active: activeModal === 'profile', onClick: () => setActiveModal('profile') },
                        { icon: List, label: 'Ver Itinerario', active: viewMode === 'list', onClick: () => setViewMode(viewMode === 'map' ? 'list' : 'map') },
                        { icon: History, label: 'Mis Rutas', active: activeModal === 'saved-routes', onClick: () => setActiveModal('saved-routes') },
                        { icon: Upload, label: 'Importación Masiva', active: activeModal === 'bulk-import', onClick: () => isPro ? setActiveModal('bulk-import') : setActiveModal('pricing') },
                        { icon: RefreshCw, label: 'Nueva Ruta', active: activeModal === 'new-route-confirm', onClick: () => setActiveModal('new-route-confirm') },
                        { icon: Save, label: 'Guardar Ruta', active: activeModal === 'save-route', onClick: () => setActiveModal('save-route'), disabled: stops.length === 0 },
                        { icon: SettingsIcon, label: 'Configuración', active: activeModal === 'settings', onClick: () => setActiveModal('settings') },
                    ].map((item, i) => {
                        const isSaveBtn = item.label === 'Guardar Ruta';
                        const isEnabled = !item.disabled;

                        return (
                            <motion.button
                                key={i}
                                onClick={item.onClick}
                                disabled={item.disabled}
                                whileHover={{ x: 8, rotate: 0.5 }}
                                className={cn(
                                    "w-full flex items-center gap-4 p-4 rounded-2xl transition-all border border-transparent text-left group/nav",
                                    item.active
                                        ? "bg-white/10 text-white font-black italic border-white/5 shadow-xl"
                                        : isSaveBtn && isEnabled
                                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/30"
                                            : "text-white/20 hover:bg-white/5 hover:text-white/40",
                                    item.disabled && "opacity-10 cursor-not-allowed grayscale"
                                )}>
                                <item.icon className={cn(
                                    "w-6 h-6 transition-all duration-500 group-hover/nav:rotate-[15deg] group-hover/nav:scale-110",
                                    item.active ? "text-info" : (isSaveBtn && isEnabled ? "text-emerald-400" : "text-info/40")
                                )} />
                                <span className={cn(
                                    "text-sm font-bold tracking-tight",
                                    isSaveBtn && isEnabled ? "text-emerald-400/90" : ""
                                )}>
                                    {item.label}
                                </span>
                            </motion.button>
                        );
                    })}
                </nav>

                {!isPro && (
                    <div className="p-6 bg-gradient-to-br from-info/10 to-blue-600/5 rounded-[32px] border border-info/20 relative overflow-hidden group">
                        <h4 className="text-sm font-black text-white italic tracking-tight mb-2 uppercase">Pro Level Access</h4>
                        <p className="text-[10px] text-white/40 leading-relaxed mb-4 font-medium">
                            Optimiza paradas ilimitadas y vuela con el modo OVNI.
                        </p>
                        <button
                            onClick={() => router.push('/pricing')}
                            className="block w-full py-3 bg-info text-dark text-center text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-info/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            Ser Premium
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;
