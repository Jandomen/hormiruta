'use client';

import { useState, useEffect } from 'react';
import {
    Mic, Plus, Map as MapIcon, Settings, Navigation,
    CheckCircle, ShieldAlert, List, X, DollarSign,
    TrendingUp, Users, LayoutDashboard, ChevronRight,
    Truck, Car, ArrowUpCircle, Crosshair
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Map from '../components/Map';
import Timeline from '../components/Timeline';
import StopInput from '../components/StopInput';
import ExpenseForm from '../components/ExpenseForm';
import { cn } from '../lib/utils';
import { openNavigation } from '../lib/navigation';

type VehicleType = 'car' | 'truck' | 'arrow';

export default function Dashboard() {
    const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
    const [activeModal, setActiveModal] = useState<'add-stop' | 'add-expense' | 'edit-stop' | null>(null);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [returnToStart, setReturnToStart] = useState(false);
    const [stops, setStops] = useState<any[]>([]);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [initialStopData, setInitialStopData] = useState<{ lat: number; lng: number; address?: string } | undefined>(undefined);
    const [activeStop, setActiveStop] = useState<any>(null);

    // New State for Vehicle and GPS
    const [vehicleType, setVehicleType] = useState<VehicleType>('truck');
    const [isGpsActive, setIsGpsActive] = useState(false);
    const [notification, setNotification] = useState<string | null>(null);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                console.log('Location access check');
            });
        }
    }, []);

    const optimizeRoute = async () => {
        const pendingStops = stops.filter(s => !s.isCompleted);
        if (pendingStops.length < 2) return;

        setIsOptimizing(true);
        setNotification('Calculando ruta inteligente...');
        try {
            const origin = { lat: 19.4326, lng: -99.1332 };
            const response = await fetch('/api/optimize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    stops: pendingStops,
                    origin,
                    returnToStart
                }),
            });

            const data = await response.json();
            if (data.optimizedStops) {
                const completed = stops.filter(s => s.isCompleted);
                const reordered = data.optimizedStops.map((s: any, i: number) => ({
                    ...s,
                    order: completed.length + i + 1,
                    isCurrent: i === 0 && !completed.some(c => c.isCurrent),
                }));
                setStops([...completed, ...reordered]);
                setNotification('Ruta optimizada correctamente');
            }
        } catch (error) {
            console.error('Error optimizando:', error);
            setNotification('Error de conexión con el optimizador');
        } finally {
            setIsOptimizing(false);
        }
    };

    const handleAddStop = (newStop: any) => {
        const updatedStops = [...stops, { ...newStop, order: stops.length + 1 }];
        setStops(updatedStops.sort((a, b) => a.order - b.order));
        setActiveModal(null);
        setInitialStopData(undefined);
        setNotification('Parada añadida');
    };

    const handleUpdateStop = (updatedStop: any) => {
        setStops(prev => prev.map(s => s.id === updatedStop.id ? updatedStop : s));
        setActiveModal(null);
        setActiveStop(null);
        setNotification('Parada actualizada');
    };

    const handleRemoveStop = (id: string) => {
        setStops(prev => {
            const filtered = prev.filter(s => s.id !== id);
            return filtered.map((s, i) => ({ ...s, order: i + 1 }));
        });
        setNotification('Parada eliminada del itinerario');
    };

    const handleMapClick = (coords?: { lat: number; lng: number }) => {
        if (!coords) return;

        const newStop = {
            id: Math.random().toString(36).substr(2, 9),
            lat: coords.lat,
            lng: coords.lng,
            address: `Destino ${stops.length + 1}`,
            customerName: '',
            priority: 'NORMAL',
            isCompleted: false,
            isCurrent: false,
            order: stops.length + 1
        };

        setStops(prev => [...prev, newStop]);
        setNotification('Nueva ubicación marcada');
    };

    const handleCompleteStop = (id: string) => {
        setStops(stops.map(s => {
            if (s.id === id) return { ...s, isCompleted: true, isCurrent: false };
            return s;
        }));
        setNotification('Punto de entrega marcado como realizado');
    };

    const handleReorder = (newStops: any[]) => {
        const updated = newStops.map((s, i) => ({ ...s, order: i + 1 }));
        setStops(updated);
    };

    const currentStop = stops.find(s => s.isCurrent);
    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    return (
        <div className="flex h-screen bg-[#050505] text-foreground overflow-hidden font-sans selection:bg-info/30">
            {/* Sidebar with enhanced dark style */}
            <aside className="hidden lg:flex w-80 flex-col bg-black border-r border-white/5 p-8 space-y-10 z-50 shadow-[20px_0_100px_rgba(0,0,0,0.5)]">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-info rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(49,204,236,0.2)]">
                        <img src="/LogoHormiruta.png" alt="Logo" className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tighter text-white italic leading-none">HORMIRUTA</h1>
                        <p className="text-[10px] font-black text-info/40 uppercase tracking-[0.2em] mt-1">Intelligence Layer</p>
                    </div>
                </div>

                <div className="space-y-5">
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] pl-1">Vehículo de Ruta</p>
                    <div className="grid grid-cols-3 gap-3">
                        {['car', 'truck', 'arrow'].map((type) => (
                            <button
                                key={type}
                                onClick={() => setVehicleType(type as VehicleType)}
                                className={cn(
                                    "flex flex-col items-center justify-center p-4 rounded-3xl transition-all border-2",
                                    vehicleType === type
                                        ? "bg-info text-dark border-info shadow-[0_10px_30px_rgba(49,204,236,0.3)] scale-110"
                                        : "bg-white/5 text-white/30 border-transparent hover:bg-white/10 hover:text-white/50"
                                )}
                            >
                                {type === 'car' && <Car className="w-7 h-7" />}
                                {type === 'truck' && <Truck className="w-7 h-7" />}
                                {type === 'arrow' && <ArrowUpCircle className="w-7 h-7" />}
                            </button>
                        ))}
                    </div>
                </div>

                <nav className="flex-1 space-y-3">
                    {[
                        { icon: LayoutDashboard, label: 'Panel de Control', active: true },
                        { icon: List, label: 'Ruta Activa', active: false },
                        { icon: TrendingUp, label: 'Reporte de Gastos', active: false },
                    ].map((item, i) => (
                        <button key={i} className={cn(
                            "w-full flex items-center gap-4 p-4 rounded-2xl transition-all border border-transparent",
                            item.active ? "bg-white/10 text-white font-black italic border-white/5 shadow-xl" : "text-white/20 hover:bg-white/5 hover:text-white/40"
                        )}>
                            <item.icon className={cn("w-6 h-6", item.active ? "text-info" : "text-info/40")} />
                            <span className="text-sm">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-6 bg-white/5 rounded-[32px] border border-white/5 text-center">
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-4 italic">Seguridad activa</p>
                    <div className="flex justify-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <div className="w-2 h-2 rounded-full bg-info/20" />
                        <div className="w-2 h-2 rounded-full bg-info/20" />
                    </div>
                </div>
            </aside>

            {/* Main App Area */}
            <div className="flex-1 flex flex-col relative">
                {/* Notification Toast - Premium Styling */}
                <AnimatePresence>
                    {notification && (
                        <motion.div
                            initial={{ y: -50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -50, opacity: 0 }}
                            className="absolute top-10 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 bg-black/95 border border-info/20 rounded-[28px] shadow-[0_50px_100px_rgba(0,0,0,0.8)] backdrop-blur-3xl flex items-center gap-4"
                        >
                            <div className="w-2 h-2 rounded-full bg-info animate-ping" />
                            <p className="text-white text-[11px] font-black uppercase tracking-[0.2em]">{notification}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Mobile Header */}
                <header className="lg:hidden bg-black/90 backdrop-blur-3xl py-6 px-8 shadow-2xl z-30 flex justify-between items-center border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <img src="/LogoHormiruta.png" alt="Logo" className="w-10 h-10" />
                        <div>
                            <h1 className="text-xl font-black tracking-tighter text-white italic leading-none">HORMIRUTA</h1>
                        </div>
                    </div>

                    <div className="flex bg-white/5 rounded-2xl p-1.5 border border-white/5">
                        {['car', 'truck', 'arrow'].map((type) => (
                            <button
                                key={type}
                                onClick={() => setVehicleType(type as VehicleType)}
                                className={cn(
                                    "p-2.5 rounded-xl transition-all",
                                    vehicleType === type ? "bg-info text-dark shadow-xl scale-110" : "text-white/20"
                                )}
                            >
                                {type === 'car' && <Car className="w-5 h-5" />}
                                {type === 'truck' && <Truck className="w-5 h-5" />}
                                {type === 'arrow' && <ArrowUpCircle className="w-5 h-5" />}
                            </button>
                        ))}
                    </div>
                </header>

                <main className="flex-1 relative overflow-hidden bg-black">
                    {/* Map Layer - Darkened for vision */}
                    <div className={cn(
                        "absolute inset-0 z-0 transition-all duration-1000",
                        viewMode === 'list' ? 'opacity-10 scale-105 blur-sm' : 'opacity-100 scale-100 blur-0'
                    )}>
                        <Map
                            stops={stops}
                            onMapClick={handleMapClick}
                            onRemoveStop={handleRemoveStop}
                            userVehicle={{ type: vehicleType, isActive: isGpsActive }}
                        />
                    </div>

                    {/* List Overlay with Ultra-Dark Theme */}
                    <AnimatePresence>
                        {viewMode === 'list' && (
                            <motion.div
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                className="absolute inset-0 lg:left-auto lg:w-[500px] z-20 bg-black/95 backdrop-blur-[100px] p-10 overflow-y-auto border-l border-white/5"
                            >
                                <div className="flex justify-between items-start mb-12">
                                    <div>
                                        <h2 className="text-4xl font-black text-white italic tracking-tighter">Itinerario</h2>
                                        <p className="text-[10px] text-info font-black uppercase tracking-[0.4em] mt-3 bg-white/5 px-2 py-1 rounded-md inline-block">
                                            {stops.filter(s => !s.isCompleted).length} Pendientes
                                        </p>
                                    </div>
                                    <button onClick={() => setViewMode('map')} className="p-4 text-white/20 bg-white/5 rounded-[24px] hover:bg-white/10 transition-colors border border-white/5">
                                        <X className="w-7 h-7" />
                                    </button>
                                </div>
                                <Timeline
                                    stops={stops}
                                    onReorder={handleReorder}
                                    onNavigate={(stop) => {
                                        setIsGpsActive(true);
                                        setViewMode('map');
                                        setNotification('Navegación interna activa');
                                    }}
                                    onEdit={(stop) => {
                                        setActiveStop(stop);
                                        setActiveModal('edit-stop');
                                    }}
                                    onComplete={handleCompleteStop}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Persistent Optimize / Reset Buttons */}
                    <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-6 flex items-center justify-center gap-3 pointer-events-none">
                        {(isOptimizing || stops.length > 2) && (
                            <button
                                onClick={() => {
                                    setIsOptimizing(false);
                                    setStops(prev => [...prev].sort((a, b) => a.id.localeCompare(b.id)));
                                    setNotification('Ruta reiniciada');
                                }}
                                className="pointer-events-auto w-16 h-16 bg-[#1a1a1a] text-red-500 rounded-2xl shadow-2xl border border-white/5 hover:bg-red-500 hover:text-white transition-all active:scale-95 flex items-center justify-center"
                            >
                                <X className="w-7 h-7" />
                            </button>
                        )}

                        <button
                            onClick={optimizeRoute}
                            disabled={isOptimizing || stops.length < 2}
                            className={cn(
                                "pointer-events-auto flex-1 flex items-center justify-center gap-3 py-5 bg-[#0a0a0a] text-info font-black text-lg rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.5)] border border-info/20 transition-all active:scale-95 disabled:opacity-0 disabled:translate-y-10",
                                isOptimizing && "animate-pulse"
                            )}
                        >
                            <img src="/LogoHormiruta.png" alt="Opt" className={cn("w-7 h-7", isOptimizing && "animate-spin")} />
                            {isOptimizing ? 'PROCESANDO...' : 'OPTIMIZAR'}
                        </button>
                    </div>

                    {/* Optimized Bottom Bar */}
                    <nav className="absolute bottom-8 left-6 right-6 h-22 bg-[#0a0a0a]/90 backdrop-blur-3xl rounded-[32px] border border-white/5 flex items-center justify-between px-10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-30 lg:hidden">

                        <button
                            onClick={() => setIsGpsActive(!isGpsActive)}
                            className={cn(
                                "flex flex-col items-center gap-1.5 p-2 transition-all",
                                isGpsActive ? "text-green-500" : "text-white/30"
                            )}
                        >
                            <Crosshair className={cn("w-7 h-7", isGpsActive && "animate-spin-slow")} />
                            <span className="text-[10px] font-black uppercase tracking-tighter">GPS</span>
                        </button>

                        <button
                            onClick={() => setActiveModal('add-stop')}
                            className="w-18 h-18 -mt-10 bg-info rounded-3xl shadow-[0_10px_30px_rgba(49,204,236,0.3)] flex items-center justify-center text-dark hover:scale-110 active:scale-90 transition-all border-4 border-black"
                        >
                            <Plus className="w-10 h-10" />
                        </button>

                        <button
                            onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
                            className={cn(
                                "flex flex-col items-center gap-1.5 p-2 transition-all",
                                viewMode === 'list' ? "text-info" : "text-white/30"
                            )}
                        >
                            {viewMode === 'map' ? <List className="w-7 h-7" /> : <MapIcon className="w-7 h-7" />}
                            <span className="text-[10px] font-black uppercase tracking-tighter">{viewMode === 'map' ? 'Lista' : 'Mapa'}</span>
                        </button>
                    </nav>
                </main>

                {/* Modals with ultra dark theme */}
                <AnimatePresence>
                    {activeModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-[100] bg-black/90 backdrop-blur-[80px] flex items-center justify-center p-8"
                        >
                            <motion.div
                                initial={{ scale: 0.95, y: 40 }}
                                animate={{ scale: 1, y: 0 }}
                                className="w-full max-w-md bg-black border border-white/5 rounded-[48px] p-10 shadow-[0_50px_200px_rgba(0,0,0,1)] relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-info to-transparent opacity-20" />

                                <div className="flex justify-between items-center mb-10">
                                    <div>
                                        <h3 className="text-3xl font-black text-white italic tracking-tighter">
                                            {activeModal === 'edit-stop' ? 'Ajustar Punto' : activeModal === 'add-stop' ? 'Nueva Parada' : 'Gasto Ruta'}
                                        </h3>
                                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mt-1">Hormiruta Protocol</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setActiveModal(null);
                                            setActiveStop(null);
                                        }}
                                        className="p-4 bg-white/5 rounded-[24px] text-white/20 hover:text-white transition-all shadow-inner"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                {activeModal === 'add-stop' || activeModal === 'edit-stop' ? (
                                    <StopInput
                                        isEditing={activeModal === 'edit-stop'}
                                        initialData={activeModal === 'edit-stop' ? activeStop : initialStopData}
                                        onAddStop={handleAddStop}
                                        onUpdateStop={handleUpdateStop}
                                        onCancel={() => {
                                            setActiveModal(null);
                                            setActiveStop(null);
                                        }}
                                    />
                                ) : (
                                    <ExpenseForm
                                        onAddExpense={(exp) => setExpenses([...expenses, exp])}
                                        onClose={() => setActiveModal(null)}
                                    />
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
