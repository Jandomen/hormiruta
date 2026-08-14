'use client';

import React from 'react';
import Link from 'next/link';
import { CloudOff, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { VehicleType, VEHICLE_OPTIONS } from '../types';

interface Props {
    isOnline: boolean;
    vehicleType: VehicleType;
    isVehicleSelectorOpen: boolean;
    setIsVehicleSelectorOpen: (val: boolean) => void;
    setVehicleType: (type: VehicleType) => void;
    userPlan: string;
    subStatus: string;
    isFleet?: boolean;
}

export default function DashboardHeader({ isOnline, vehicleType, isVehicleSelectorOpen, setIsVehicleSelectorOpen, setVehicleType, userPlan, subStatus, isFleet }: Props) {
    const isPro = userPlan !== 'free' && (subStatus === 'active' || subStatus === 'trialing');

    const planBadge = isPro
        ? { label: isFleet ? 'FLOTA' : 'PRO', cls: 'bg-info/15 text-info border-info/30' }
        : { label: 'GRATIS', cls: 'bg-white/10 text-white/70 border-white/20' };

    return (
        <header className="lg:hidden bg-darker/60 backdrop-blur-2xl py-3 sm:py-4 px-4 sm:px-6 shadow-2xl z-[120] flex justify-between items-center border-b border-white/5 relative">
            <Link href="/pricing" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity">
                <div className="relative">
                    <div className="absolute inset-0 bg-info/20 blur-xl rounded-full" />
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 bg-dark/40 border border-info/30 rounded-full flex items-center justify-center p-1.5 sm:p-2 backdrop-blur-md">
                        <img src="/LogoHormiruta.png" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                </div>
                <h1 className="text-lg sm:text-xl font-black tracking-tighter text-white italic">HORMIRUTA</h1>
            </Link>

            <div className="flex items-center gap-1 sm:gap-2">
                {!isOnline && (
                    <div className="flex items-center gap-1 bg-red-500/10 text-red-500 border border-red-500/20 px-1.5 py-0.5 rounded-full animate-pulse">
                        <CloudOff className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        <span className="text-[10px] sm:text-xs font-black uppercase hidden sm:inline">Offline</span>
                    </div>
                )}
                <span className={cn("text-[10px] sm:text-xs font-black uppercase px-1.5 sm:px-2 py-0.5 rounded-full border", planBadge.cls)}>{planBadge.label}</span>
                <span className="text-[10px] sm:text-xs bg-info/10 text-info border border-info/20 px-1.5 sm:px-2 py-0.5 rounded-full font-black hidden sm:block">V2.1</span>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
                <button
                    onClick={() => setIsVehicleSelectorOpen(!isVehicleSelectorOpen)}
                    className={cn(
                        "px-2 sm:px-5 py-1.5 sm:py-2.5 rounded-lg sm:rounded-2xl transition-all active:scale-95 flex items-center gap-1 sm:gap-2 border",
                        isVehicleSelectorOpen
                            ? "bg-info text-dark border-info shadow-[0_0_20px_rgba(96,165,250,0.5)]"
                            : "bg-info/10 text-info border-info/20 hover:bg-info/20"
                    )}
                >
                    <span className="text-[10px] sm:text-sm font-black uppercase italic tracking-tight">
                        {VEHICLE_OPTIONS.find(opt => opt.type === vehicleType)?.label.split(' ')[0] || 'Camión'}
                    </span>
                    <ChevronDown className={cn("w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-300", isVehicleSelectorOpen && "rotate-180")} />
                </button>
            </div>

            {/* Compact Vehicle Dropdown */}
            <AnimatePresence>
                {isVehicleSelectorOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute top-full right-3 mt-2 w-40 bg-darker/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-[130]"
                    >
                        <div className="py-1">
                            {VEHICLE_OPTIONS.map((opt) => (
                                <button
                                    key={opt.type}
                                    onClick={() => {
                                        setVehicleType(opt.type);
                                        setIsVehicleSelectorOpen(false);
                                    }}
                                    className={cn(
                                        "w-full flex items-center justify-between px-4 py-2 text-left transition-colors",
                                        vehicleType === opt.type 
                                            ? "bg-info/10 text-info" 
                                            : "text-white/70 hover:bg-white/5 hover:text-white"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">
                                            {opt.type === 'truck' && '🚛'}
                                            {opt.type === 'van' && '🚐'}
                                            {opt.type === 'car' && '🚗'}
                                            {opt.type === 'pickup' && '🛻'}
                                            {opt.type === 'motorcycle' && '🏍️'}
                                            {opt.type === 'ufo' && '🛸'}
                                        </span>
                                        <span className="text-[10px] font-black uppercase tracking-tight">{opt.label}</span>
                                    </div>
                                    {vehicleType === opt.type && <Check className="w-3.5 h-3.5" />}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
