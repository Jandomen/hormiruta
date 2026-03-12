'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, User, List, Crosshair, History, Upload, Save, Settings as SettingsIcon, RefreshCw, ShieldAlert 
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { VEHICLE_OPTIONS, VehicleType, Stop, ActiveModal } from '../types';

interface Props {
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (val: boolean) => void;
    vehicleType: VehicleType;
    setVehicleType: (type: VehicleType) => void;
    handleOpenModal: (modal: ActiveModal, push?: boolean) => void;
    setViewMode: (mode: 'map' | 'list') => void;
    viewMode: 'map' | 'list';
    handleRecenter: () => void;
    stops: Stop[];
    returnToStart: boolean;
    setReturnToStart: (val: boolean) => void;
    handleLogout: () => void;
}

export default function NavigationMenu(props: Props) {
    const {
        isMobileMenuOpen, setIsMobileMenuOpen, vehicleType, setVehicleType,
        handleOpenModal, setViewMode, viewMode, handleRecenter, stops,
        returnToStart, setReturnToStart, handleLogout
    } = props;

    return (
        <AnimatePresence>
            {isMobileMenuOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="fixed inset-0 z-[190] bg-black/60 backdrop-blur-sm"
                    />

                    {/* Left Side Drawer */}
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 left-0 z-[200] w-4/5 max-w-[280px] bg-darker/98 border-r border-white/5 shadow-2xl flex flex-col pt-safe"
                    >
                        <div className="flex justify-between items-center p-4 border-b border-white/5">
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-info/20 blur-xl rounded-full" />
                                    <div className="relative w-7 h-7 bg-dark/40 border border-info/30 rounded-full flex items-center justify-center p-1.5 backdrop-blur-md">
                                        <img src="/LogoHormiruta.png" alt="Logo" className="w-full h-full object-contain" />
                                    </div>
                                </div>
                                <h2 className="text-sm font-black text-white italic tracking-tighter uppercase leading-none">Centro de Mando</h2>
                            </div>
                            <button 
                                onClick={() => setIsMobileMenuOpen(false)} 
                                className="p-2 bg-white/5 rounded-xl active:scale-90 transition-all"
                            >
                                <X className="w-4 h-4 text-white/40" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
                            <div className="space-y-3">
                                <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] pl-1">Vehículo Activo</p>
                                <div className="flex gap-2.5 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2">
                                    {VEHICLE_OPTIONS.map((opt) => (
                                        <motion.button
                                            key={opt.type}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setVehicleType(opt.type)}
                                            className={cn(
                                                "snap-center flex-shrink-0 w-14 h-16 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-0.5",
                                                vehicleType === opt.type
                                                    ? "bg-info text-dark border-info shadow-[0_5_15px_rgba(49,204,236,0.2)]"
                                                    : "bg-white/5 text-white/20 border-white/5 scale-90 opacity-40"
                                            )}
                                        >
                                            <span className="text-xl">
                                                {opt.type === 'truck' && '🚛'}
                                                {opt.type === 'van' && '🚐'}
                                                {opt.type === 'car' && '🚗'}
                                                {opt.type === 'pickup' && '🛻'}
                                                {opt.type === 'motorcycle' && '🏍️'}
                                                {opt.type === 'ufo' && '🛸'}
                                            </span>
                                            <span className="text-[6px] font-black uppercase tracking-widest">{opt.label}</span>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] pl-1">Operaciones de Flota</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { icon: User, label: 'Perfil', onClick: () => handleOpenModal('profile', true) },
                                        { icon: List, label: 'Itinerario', onClick: () => setViewMode(viewMode === 'map' ? 'list' : 'map') },
                                        { icon: Crosshair, label: 'Centrar', onClick: () => handleRecenter() },
                                        { icon: History, label: 'Rutas', onClick: () => handleOpenModal('saved-routes', true) },
                                        { icon: Upload, label: 'Bulk', onClick: () => handleOpenModal('bulk-import', true) },
                                        { icon: Save, label: 'Guardar', onClick: () => handleOpenModal('save-route', true), disabled: stops.length === 0 },
                                        { icon: ShieldAlert, label: 'SOS Protocol', onClick: () => handleOpenModal('sos-config', true) },
                                        { icon: SettingsIcon, label: 'Ajustes', onClick: () => handleOpenModal('settings', true) },
                                        { icon: RefreshCw, label: 'Reset', onClick: () => handleOpenModal('new-route-confirm', true) },
                                    ].map((item, i) => (
                                        <motion.button
                                            key={i}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => { item.onClick(); }}
                                            disabled={item.disabled}
                                            className="flex items-center gap-2 p-2.5 bg-white/5 border border-white/5 rounded-xl text-white transition-all disabled:opacity-20"
                                        >
                                            <div className="w-6 h-6 bg-info/10 rounded-lg flex items-center justify-center shrink-0">
                                                <item.icon className="w-3 h-3 text-info" />
                                            </div>
                                            <span className="text-[8px] font-black uppercase tracking-tight text-left italic">{item.label}</span>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 bg-info/5 border border-info/10 rounded-2xl relative overflow-hidden group">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[8px] font-black text-white/40 uppercase tracking-widest pl-1 leading-none">Circular</span>
                                    <button
                                        onClick={() => setReturnToStart(!returnToStart)}
                                        className={cn("w-7 h-4 rounded-full relative p-0.5 transition-all text-[8px]", returnToStart ? "bg-info" : "bg-white/10")}
                                    >
                                        <motion.div
                                            animate={{ x: returnToStart ? 12 : 0 }}
                                            className="w-3 h-3 bg-white rounded-full"
                                        />
                                    </button>
                                </div>
                                <p className="text-[7px] text-white/20 italic leading-tight">Retorno al punto origen.</p>
                            </div>
                        </div>

                        <div className="p-4 border-t border-white/5">
                            <button
                                onClick={handleLogout}
                                className="w-full py-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl font-black uppercase text-[8px] tracking-widest"
                            >
                                Cerrar Sesión
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
