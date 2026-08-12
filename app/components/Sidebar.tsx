'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Truck, Car, RefreshCw, MapPin, Crosshair,
    LayoutDashboard, User, List, History, Upload,
    Save, Settings as SettingsIcon, Crown, LogOut, ShieldCheck, Plus, Users, KeyRound
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { cn } from '../lib/utils';

interface SidebarProps {
    session: any;
    isPro: boolean;
    isFleet: boolean;
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
    isFleet,
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
        { type: 'ufo', icon: Car, label: 'OVNI' },
    ];

    return (
        <aside className={cn("hidden lg:flex w-72 xl:w-80 flex-col bg-darker border-r border-white/5 z-50 shadow-[20px_0_100px_rgba(0,0,0,0.5)] overflow-hidden", className)}>
            <Link href="/pricing" className="p-6 xl:p-8 pb-0 block hover:opacity-80 transition-opacity group">
                <div className="flex items-center gap-3 xl:gap-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-info/20 blur-xl rounded-full animate-pulse group-hover:bg-info/40 transition-colors" />
                        <div className="relative w-14 h-14 xl:w-16 xl:h-16 bg-dark/40 border border-info/30 rounded-full flex items-center justify-center p-2 backdrop-blur-md shadow-lg">
                            <img src="/LogoHormiruta.png" alt="Logo" className="w-full h-full object-contain" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-xl xl:text-2xl font-black tracking-tighter text-white italic leading-none">HORMIRUTA</h1>
                        <p className="text-[10px] xl:text-xs font-black text-info/60 uppercase tracking-[0.2em] mt-0.5 xl:mt-1 group-hover:text-info transition-colors">Intelligence Layer</p>
                    </div>
                </div>
            </Link>

            <div className="flex-1 overflow-y-auto p-6 xl:p-8 pt-8 xl:pt-10 space-y-8 xl:space-y-10 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
                <div className="space-y-5 xl:space-y-6">
                    <div className="bg-white/5 p-3 xl:p-4 rounded-2xl xl:rounded-[28px] border border-white/5 space-y-2 xl:space-y-3">
                        <p className="text-[10px] xl:text-xs font-black text-white/60 uppercase tracking-[0.2em] pl-1">Configuración de Trayecto</p>

                        <div className="space-y-2 xl:space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] xl:text-[11px] font-bold text-white/60 uppercase tracking-tight">Regreso al Inicio</span>
                                <button
                                    onClick={() => setReturnToStart(!returnToStart)}
                                    className={cn(
                                        "w-9 xl:w-10 h-4 xl:h-5 rounded-full transition-all relative p-0.5 xl:p-1",
                                        returnToStart ? "bg-info" : "bg-white/10"
                                    )}
                                >
                                    <div className={cn(
                                        "w-2.5 xl:w-3 h-2.5 xl:h-3 bg-white rounded-full transition-all shadow-md",
                                        returnToStart ? "translate-x-[18px] xl:translate-x-5" : "translate-x-0"
                                    )} />
                                </button>
                            </div>
                            <p className="text-[10px] xl:text-xs text-white/50 leading-relaxed">
                                {returnToStart
                                    ? "La ruta terminará cerca de tu punto de partida."
                                    : "Ruta abierta: terminará en la última entrega."}
                            </p>
                        </div>

                        <div className="pt-1 xl:pt-2 space-y-1.5 xl:space-y-2 border-t border-white/5 mt-1 xl:mt-2 pt-3 xl:pt-4">
                            <button
                                onClick={handleReverseRoute}
                                disabled={stops.length < 2}
                                className="w-full py-2.5 xl:py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg xl:rounded-xl border border-white/5 text-[10px] xl:text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5 xl:gap-2 transition-all disabled:opacity-20 disabled:cursor-not-allowed group"
                            >
                                <RefreshCw className="w-2.5 h-2.5 xl:w-3 xl:h-3 group-hover:rotate-180 transition-all duration-500" />
                                Invertir Ruta
                            </button>
                        </div>

                        <div className="pt-1 xl:pt-2 space-y-1.5 xl:space-y-2">
                            <label className="text-[10px] xl:text-xs font-black text-white/50 uppercase tracking-widest pl-1">Punto de Partida</label>
                            <div className="flex items-center gap-2 xl:gap-3 p-2 xl:p-3 bg-dark/40 rounded-xl xl:rounded-2xl border border-white/5">
                                <MapPin className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-info/60 shrink-0" />
                                <span className="text-[10px] xl:text-xs text-white/60 font-bold truncate">{originPoint.address}</span>
                            </div>
                            <button
                                onClick={() => refreshOriginLocation(true)}
                                className="w-full py-2.5 xl:py-3 bg-info/10 hover:bg-info/20 text-info rounded-lg xl:rounded-xl border border-info/20 text-[10px] xl:text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5 xl:gap-2 transition-all group"
                            >
                                <Crosshair className="w-2.5 h-2.5 xl:w-3 xl:h-3 group-active:rotate-90 transition-all" />
                                Sincronizar Inicio
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2 xl:space-y-3">
                        <p className="text-[10px] xl:text-xs font-black text-white/60 uppercase tracking-[0.2em] pl-1">Selecciona tu Vehículo</p>
                        <div className="flex gap-3 xl:gap-4 overflow-x-auto pb-4 xl:pb-6 no-scrollbar -mx-2 px-2 snap-x scroll-smooth">
                            {vehicleOptions.map((opt) => (
                                <button
                                    key={opt.type}
                                    onClick={() => {
                                        setVehicleType(opt.type);
                                        playNotification('sound1');
                                    }}
                                    className={cn(
                                        "flex-shrink-0 w-[72px] xl:w-20 h-[88px] xl:h-24 flex flex-col items-center justify-center rounded-[20px] xl:rounded-[24px] transition-all duration-500 border-2 snap-center relative group overflow-hidden",
                                        vehicleType === opt.type
                                            ? "bg-info/20 text-info border-info shadow-[0_15px_40px_rgba(96,165,250,0.3)] scale-105"
                                            : "bg-white/10 text-white border-white/10 hover:bg-white/15 hover:text-white"
                                    )}
                                >
                                    {vehicleType === opt.type && (
                                        <motion.div
                                            layoutId="activeVehicle"
                                            className="absolute inset-0 bg-gradient-to-b from-info/10 to-transparent"
                                        />
                                    )}
                                    <div className="text-2xl xl:text-3xl mb-1 xl:mb-2 group-hover:rotate-[360deg] transition-transform duration-1000">
                                        {opt.type === 'truck' && '🚛'}
                                        {opt.type === 'van' && '🚐'}
                                        {opt.type === 'car' && '🚗'}
                                        {opt.type === 'pickup' && '🛻'}
                                        {opt.type === 'motorcycle' && '🏍️'}
                                        {opt.type === 'ufo' && '🛸'}
                                    </div>
                                    <span className="text-[10px] xl:text-xs font-black uppercase tracking-tight text-center">{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <nav className="space-y-2 xl:space-y-3">
                    {[
                        { icon: LayoutDashboard, label: 'Panel de Control', active: activeModal === null && viewMode === 'map' },
                        { icon: Plus, label: 'Nueva Parada', active: activeModal === 'add-stop', onClick: () => setActiveModal('add-stop') },
                        { icon: User, label: 'Mis Datos / Perfil', active: activeModal === 'profile', onClick: () => setActiveModal('profile') },
                        { icon: List, label: 'Ver Itinerario', active: viewMode === 'list', onClick: () => setViewMode(viewMode === 'map' ? 'list' : 'map') },
                        { icon: Users, label: 'Mi Flotilla', active: activeModal === 'fleet-manage', onClick: () => setActiveModal('fleet-manage'), fleetOnly: true },
                        { icon: KeyRound, label: 'Unirme a Flotilla', active: activeModal === 'join-fleet', onClick: () => setActiveModal('join-fleet') },
                        { icon: History, label: 'Mis Rutas', active: activeModal === 'saved-routes', onClick: () => setActiveModal('saved-routes') },
                        { icon: Upload, label: 'Importación Masiva', active: activeModal === 'bulk-import', onClick: () => isPro ? setActiveModal('bulk-import') : setActiveModal('pricing') },
                        { icon: RefreshCw, label: 'Nueva Ruta', active: activeModal === 'new-route-confirm', onClick: () => setActiveModal('new-route-confirm') },
                        { icon: Save, label: 'Guardar Ruta', active: activeModal === 'save-route', onClick: () => setActiveModal('save-route'), disabled: stops.length === 0 },
                        { icon: SettingsIcon, label: 'Configuración', active: activeModal === 'settings', onClick: () => setActiveModal('settings') },
                    ].filter(item => !('fleetOnly' in item) || !item.fleetOnly || isFleet).map((item, i) => {
                        const isSaveBtn = item.label === 'Guardar Ruta';
                        const isEnabled = !item.disabled;

                        return (
                            <motion.button
                                key={i}
                                onClick={item.onClick}
                                disabled={item.disabled}
                                whileHover={{ x: 6, rotate: 0.5 }}
                                className={cn(
                                    "w-full flex items-center gap-3 xl:gap-4 p-3 xl:p-4 rounded-xl xl:rounded-2xl transition-all border border-transparent text-left group/nav",
                                    item.active
                                        ? "bg-white/10 text-white font-black italic border-white/5 shadow-xl"
                                        : isSaveBtn && isEnabled
                                            ? "bg-blue-500/10 text-blue-300 border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/30"
                                            : "text-white/50 hover:bg-white/5 hover:text-white/70",
                                    item.disabled && "opacity-10 cursor-not-allowed grayscale"
                                )}>
                                <item.icon className={cn(
                                    "w-5 h-5 xl:w-6 xl:h-6 transition-all duration-500 group-hover/nav:rotate-[15deg] group-hover/nav:scale-110",
                                    item.active ? "text-info" : (isSaveBtn && isEnabled ? "text-blue-300" : "text-info/60")
                                )} />
                                <span className={cn(
                                    "text-xs xl:text-sm font-bold tracking-tight",
                                    isSaveBtn && isEnabled ? "text-blue-300/90" : ""
                                )}>
                                    {item.label}
                                </span>
                            </motion.button>
                        );
                    })}
                </nav>

                {!isPro && (
                    <div className="p-5 xl:p-6 bg-gradient-to-br from-info/10 to-blue-600/5 rounded-2xl xl:rounded-[32px] border border-info/20 relative overflow-hidden group">
                        <h4 className="text-xs xl:text-sm font-black text-white italic tracking-tight mb-1.5 xl:mb-2 uppercase">Pro Level Access</h4>
                        <p className="text-[10px] xl:text-xs text-white/70 leading-relaxed mb-3 xl:mb-4 font-medium">
                            Optimiza paradas ilimitadas y vuela con el modo OVNI.
                        </p>
                        <button
                            onClick={() => router.push('/pricing')}
                            className="block w-full py-2.5 xl:py-3 bg-info text-dark text-center text-[10px] xl:text-xs font-black uppercase tracking-widest rounded-lg xl:rounded-xl shadow-lg shadow-info/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            Ser Premium
                        </button>
                    </div>
                )}
            </div>

            {/* User Profile Footer */}
            <div className="p-4 xl:p-5 border-t border-white/5 bg-black/20">
                <div className="flex items-center gap-3 xl:gap-4">
                    <div className="relative shrink-0">
                        <div className="w-10 h-10 xl:w-12 xl:h-12 rounded-2xl bg-gradient-to-tr from-info to-blue-600 flex items-center justify-center text-dark font-black text-sm xl:text-base shadow-lg">
                            {session?.user?.image ? (
                                <img src={session.user.image} alt="" className="w-full h-full rounded-2xl object-cover" />
                            ) : (
                                (session?.user?.name || 'U').charAt(0).toUpperCase()
                            )}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 xl:w-4 xl:h-4 rounded-full bg-emerald-500 border-2 border-darker" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs xl:text-sm font-black text-white truncate italic leading-tight">{session?.user?.name || 'Usuario'}</p>
                        <p className="text-[10px] font-bold text-white/50 truncate">{session?.user?.email}</p>
                    </div>
                </div>
                <div className="mt-3 xl:mt-4 flex items-center gap-2">
                    <span className={cn(
                        "shrink-0 text-[9px] xl:text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full border",
                        isPro ? "bg-info/15 text-info border-info/30" : "bg-white/10 text-white/70 border-white/20"
                    )}>
                        {isPro ? 'PRO' : 'GRATIS'}
                    </span>
                    <button
                        onClick={() => setActiveModal('profile')}
                        className="flex-1 py-2 xl:py-2.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-white/70 hover:text-white border border-white/5 transition-all flex items-center justify-center gap-1.5"
                    >
                        <ShieldCheck className="w-3 h-3 xl:w-3.5 xl:h-3.5" /> Perfil
                    </button>
                    <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="py-2 xl:py-2.5 px-3 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 border border-red-500/20 transition-all"
                        title="Cerrar sesión"
                    >
                        <LogOut className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
