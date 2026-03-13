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
}

export default function DashboardHeader({ isOnline, vehicleType, isVehicleSelectorOpen, setIsVehicleSelectorOpen, setVehicleType }: Props) {
    return (
        <header className="lg:hidden bg-darker/60 backdrop-blur-2xl py-2.5 sm:py-3 px-3 sm:px-6 shadow-2xl z-[120] flex justify-between items-center border-b border-white/5 relative">
            <Link href="/pricing" className="flex items-center gap-1.5 sm:gap-2 hover:opacity-80 transition-opacity">
                <div className="relative">
                    <div className="absolute inset-0 bg-info/20 blur-xl rounded-full" />
                    <div className="relative w-7 h-7 bg-dark/40 border border-info/30 rounded-full flex items-center justify-center p-1.5 backdrop-blur-md">
                        <img src="/LogoHormiruta.png" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                </div>
                <h1 className="text-sm font-black tracking-tighter text-white italic">HORMIRUTA</h1>
            </Link>

            <div className="flex items-center gap-1.5 sm:gap-2">
                {!isOnline && (
                    <div className="flex items-center gap-1.5 bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded-full animate-pulse">
                        <CloudOff className="w-3 h-3" />
                        <span className="text-[10px] font-black uppercase">Offline</span>
                    </div>
                )}
                <span className="text-[10px] bg-info/10 text-info border border-info/20 px-2 py-0.5 rounded-full font-black">V2.1</span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                    onClick={() => setIsVehicleSelectorOpen(!isVehicleSelectorOpen)}
                    className={cn(
                        "px-2 sm:px-5 py-1.5 sm:py-2.5 rounded-lg sm:rounded-2xl transition-all active:scale-95 flex items-center gap-1 sm:gap-2 border",
                        isVehicleSelectorOpen
                            ? "bg-info text-dark border-info shadow-[0_0_20px_rgba(49,204,236,0.5)]"
                            : "bg-info/10 text-info border-info/20 hover:bg-info/20"
                    )}
                >
                    <span className="text-[9px] sm:text-xs font-black uppercase italic tracking-tight">
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
                        className="absolute top-full right-3 mt-2 w-40 bg-darker/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-[130]"
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
                                            : "text-white/40 hover:bg-white/5 hover:text-white"
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
