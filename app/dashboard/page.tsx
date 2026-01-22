'use client';

import { useState, useCallback, useEffect } from 'react';
import {
    Mic, Plus, Map as MapIcon, Settings, Navigation,
    CheckCircle, ShieldAlert, List, X, DollarSign,
    TrendingUp, Users, LayoutDashboard, ChevronRight,
    Truck, Car, ArrowUpCircle, Crosshair, Upload, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Map from '../components/Map';
import GeofenceAlertsManager from '../components/GeofenceAlertsManager';
import Timeline from '../components/Timeline';
import StopInput from '../components/StopInput';
import ExpenseForm from '../components/ExpenseForm';
import SOSButton from '../components/SOSButton';
import BulkImport from '../components/BulkImport';
import SOSConfig from '../components/SOSConfig';
import SavedRoutes from '../components/SavedRoutes';
import { Shield, Settings as SettingsIcon, LogOut, Save, RefreshCw, History, Calendar, Route as RouteIcon, Sun, Moon } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { cn } from '../lib/utils';
import { openNavigation } from '../lib/navigation';

type VehicleType = 'car' | 'truck' | 'van' | 'motorcycle' | 'pickup';

export default function Dashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeModal, setActiveModal] = useState<'add-stop' | 'edit-stop' | 'expense' | 'bulk-import' | 'settings' | 'saved-routes' | 'save-route' | 'new-route-confirm' | 'route-summary' | null>(null);
    const [routeName, setRouteName] = useState('');
    const [routeSummary, setRouteSummary] = useState<{ distance: number, time: string, completedStops: number } | null>(null);
    const [routeDate, setRouteDate] = useState(new Date().toISOString().split('T')[0]);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [returnToStart, setReturnToStart] = useState(false);
    const [stops, setStops] = useState<any[]>([]);
    const [expenses, setExpenses] = useState<any[]>([]);

    const [initialStopData, setInitialStopData] = useState<{ lat: number; lng: number; address?: string } | undefined>(undefined);
    const [originPoint, setOriginPoint] = useState<{ lat: number, lng: number, address: string }>({
        lat: 19.4326,
        lng: -99.1332,
        address: 'Mi Ubicación Actual'
    });
    const [activeStop, setActiveStop] = useState<any>(null);

    // New State for Vehicle and GPS
    const [vehicleType, setVehicleType] = useState<VehicleType>('truck');
    const [userCoords, setUserCoords] = useState<{ lat: number, lng: number } | null>(null);
    const [showTraffic, setShowTraffic] = useState(false);
    const [avoidTolls, setAvoidTolls] = useState(false);
    const [isGpsActive, setIsGpsActive] = useState(false);
    const [notification, setNotification] = useState<string | null>(null);
    const [geofenceRadius] = useState(100); // Radio de geofence en metros
    const [mapTheme, setMapTheme] = useState<'light' | 'dark'>('dark');
    const [currentRouteId, setCurrentRouteId] = useState<string | null>(null);
    const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>(undefined);

    // Audio Notification System
    const [alertSound, setAlertSound] = useState('sound1');
    const [hasPlayedWelcome, setHasPlayedWelcome] = useState(false);

    const soundOptions = [
        { id: 'sound1', label: 'Hormi-Tone', url: '/sound/sound1.mp3' },
        { id: 'sound2', label: 'Logi-Beep', url: '/sound/sound2.mp3' },
        { id: 'sound3', label: 'Route-Alert', url: '/sound/sound3.mp3' },
    ];

    const playNotification = useCallback((soundId?: string) => {
        const sound = soundOptions.find(s => s.id === (soundId || alertSound));
        if (sound) {
            const audio = new Audio(sound.url);
            audio.volume = 0.5;
            audio.play().catch(e => console.warn("[AUDIO] Auto-play blocked by browser", e));
        }
    }, [alertSound]);

    // Play welcome sound on initial load
    useEffect(() => {
        if (status === 'authenticated' && !hasPlayedWelcome) {
            const timer = setTimeout(() => {
                playNotification();
                setHasPlayedWelcome(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [status, hasPlayedWelcome, playNotification]);



    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    useEffect(() => {
        console.log("[DASHBOARD] Component mounted");
        if (typeof window !== 'undefined') {
            console.log("[DASHBOARD] Current URL:", window.location.href);
        }
    }, []);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                console.log('[DASHBOARD] Geolocation access granted');
            }, (error) => {
                console.warn('[DASHBOARD] Geolocation error:', error.message);
            });
        }
    }, []);

    useEffect(() => {
        if (navigator.geolocation && !isGpsActive) {
            navigator.geolocation.getCurrentPosition((position) => {
                setOriginPoint(prev => ({
                    ...prev,
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                }));
            });
        }
    }, []);

    // Geofencing logic is now handled in the Map component via onGeofenceAlert
    // This redundant logic was causing conflicts and using a less accurate distance calculation


    useEffect(() => {
        console.log("[DASHBOARD] Session Status Update:", status);
        if (status === 'unauthenticated') {
            console.log("[DASHBOARD] No active session, redirecting to login...");
            router.push('/auth/login');
        } else if (status === 'authenticated') {
            console.log("[DASHBOARD] Session established for:", session?.user?.email);
        }
    }, [status, router, session]);

    const handleCompleteStop = useCallback((id: string) => {
        setStops(prevStops => prevStops.map(s => {
            if (s.id === id) return { ...s, isCompleted: true, isCurrent: false };
            return s;
        }));
        setNotification('Punto de entrega marcado como realizado');
    }, []);

    const handleGeofenceAlert = useCallback((stop: { stopId: string; stopOrder: number; address?: string; timestamp: number }) => {
        console.log(`[GEOFENCE] Alerta: ¡Llegaste a la parada ${stop.stopOrder}!`, stop.address);
        setNotification(`¡Has llegado a la parada ${stop.stopOrder}!`);

        // Auto-completar la parada al llegar
        handleCompleteStop(stop.stopId);
    }, [handleCompleteStop]);

    const handleRecenter = useCallback(() => {
        if (userCoords) {
            setMapCenter({ ...userCoords, _f: Date.now() } as any);
            setIsGpsActive(true);
            setNotification('Centrado en tu ubicación actual');
        } else {
            refreshOriginLocation(false);
        }
    }, [userCoords]);

    const refreshOriginLocation = (syncOrigin: boolean = true) => {
        if (!navigator.geolocation) {
            setNotification('GPS no disponible en este navegador');
            return;
        }

        // Si ya tenemos coordenadas del rastreador activo, las usamos de inmediato para ahorrar tiempo y batería
        if (userCoords) {
            if (syncOrigin) {
                setOriginPoint({
                    lat: userCoords.lat,
                    lng: userCoords.lng,
                    address: 'Ubicación GPS Actual'
                });
            }
            setMapCenter({ ...userCoords, _f: Date.now() } as any);
            setIsGpsActive(true);
            setNotification(syncOrigin ? 'Inicio sincronizado' : 'Mapa centrado');
            return;
        }

        setNotification('Sincronizando con satélites...');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                if (syncOrigin) {
                    setOriginPoint({
                        ...coords,
                        address: 'Ubicación GPS Actual'
                    });
                }

                setMapCenter({ ...coords, _f: Date.now() } as any);
                setIsGpsActive(true);
                setNotification(syncOrigin ? 'Inicio sincronizado' : 'Mapa centrado');
            },
            (error) => {
                console.error('Error GPS Detallado:', { code: error.code, message: error.message });

                let msg = 'Error de conexión GPS';
                if (error.code === 1) msg = '⚠️ Por favor permite el acceso al GPS';
                if (error.code === 3) msg = '⏳ Tiempo agotado (Señal débil)';

                setNotification(msg);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000, // Aumentamos a 10s para dar tiempo al usuario/dispositivo
                maximumAge: 0   // Forzamos ubicación fresca
            }
        );
    };

    if (status === 'loading') {
        return (
            <div className="flex h-screen bg-[#060914] items-center justify-center">
                <div className="text-center">
                    <img src="/LogoHormiruta.png" alt="Logo" className="w-16 h-16 animate-pulse mx-auto mb-4" />
                    <p className="text-info font-black text-xs uppercase tracking-widest animate-pulse">Verificando Protocolo...</p>
                </div>
            </div>
        );
    }

    const optimizeRoute = async () => {
        const completedStops = stops.filter(s => s.isCompleted);
        const pendingStops = stops.filter(s => !s.isCompleted);

        if (pendingStops.length < 2) {
            setNotification('No hay suficientes paradas pendientes para optimizar');
            return;
        }

        setIsOptimizing(true);
        setNotification('Optimizando ruta con tráfico real...');
        try {
            const response = await fetch('/api/optimize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    stops: pendingStops,
                    origin: originPoint,
                    returnToStart,
                    avoidTolls
                }),
            });

            const data = await response.json();
            if (response.ok && data.optimizedStops) {
                // Determine new order starting after completed stops
                const newPending = data.optimizedStops.map((s: any, i: number) => ({
                    ...s,
                    order: completedStops.length + i + 1,
                    isCurrent: i === 0 && completedStops.length === 0 ? true : false
                }));

                // If we have new pending stops, set first as current
                if (newPending.length > 0) {
                    newPending[0].isCurrent = true;
                }

                // Ensure completed stops are not current
                const cleanCompleted = completedStops.map(s => ({ ...s, isCurrent: false }));

                setStops([...cleanCompleted, ...newPending]);
                setNotification(data.message || 'Ruta optimizada correctamente');
            } else {
                setNotification(data.error || 'Error al optimizar');
            }
        } catch (error) {
            console.error('Error optimizando:', error);
            setNotification('Error de conexión con el optimizador');
        } finally {
            setIsOptimizing(false);
        }
    };

    const isDuplicate = (address: string, lat: number, lng: number) => {
        return stops.some(s =>
            s.address.toLowerCase().trim() === address.toLowerCase().trim() ||
            (Math.abs(s.lat - lat) < 0.0001 && Math.abs(s.lng - lng) < 0.0001)
        );
    };

    const handleAddStop = (newStop: any) => {
        if (isDuplicate(newStop.address, newStop.lat, newStop.lng)) {
            setNotification('Esta parada ya está en tu itinerario');
            return;
        }
        const updatedStops = [...stops, { ...newStop, order: stops.length + 1 }];
        setStops(updatedStops.sort((a, b) => a.order - b.order));
        setInitialStopData(undefined);
        setNotification('Parada añadida');
    };

    const handleBulkImport = (newStops: any[]) => {
        setStops(prev => {
            const uniqueNewStops = newStops.filter(ns =>
                !prev.some(s =>
                    s.address.toLowerCase().trim() === ns.address.toLowerCase().trim() ||
                    (Math.abs(s.lat - ns.lat) < 0.0001 && Math.abs(s.lng - ns.lng) < 0.0001)
                )
            );

            if (uniqueNewStops.length < newStops.length) {
                setNotification(`${newStops.length - uniqueNewStops.length} duplicados omitidos`);
            }

            const updated = [...prev, ...uniqueNewStops.map((s, i) => ({ ...s, order: prev.length + i + 1 }))];
            return updated.sort((a, b) => a.order - b.order);
        });
        setNotification('Importación completada');
    };

    const handleSaveRoute = async () => {
        if (!routeName) {
            setNotification('Por favor ingresa un nombre para la ruta');
            return;
        }

        try {
            const response = await fetch('/api/routes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: routeName,
                    date: routeDate,
                    stops,
                    isOptimized: false,
                    status: 'active'
                })
            });

            const data = await response.json();
            if (response.ok) {
                setCurrentRouteId(data._id);
                setNotification('Ruta guardada exitosamente');
                setActiveModal(null);
                setRouteName('');
            } else {
                setNotification('Error al guardar la ruta');
            }
        } catch (err) {
            setNotification('Error de conexión');
        }
    };

    const handleLoadRoute = (route: any) => {
        setStops(route.stops);
        setCurrentRouteId(route._id);
        setNotification(`Ruta loaded: ${route.name}`);
        setActiveModal(null);
    };

    const handleNewRoute = () => {
        setStops([]);
        setRouteName('');
        setNotification('Nuevo listado iniciado');
        setActiveModal(null);
    };

    const handleFinishRoute = () => {
        const completed = stops.filter(s => s.isCompleted).length;
        setRouteSummary({
            distance: (stops.length * 2.5), // Mock distance
            time: "2h 45m", // Mock time
            completedStops: completed
        });
        setActiveModal('route-summary');
    };

    const confirmFinish = async () => {
        try {
            if (currentRouteId && routeSummary) {
                await fetch('/api/routes', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: currentRouteId,
                        stops,
                        status: 'completed',
                        totalDistance: routeSummary.distance,
                        totalTime: routeSummary.time
                    })
                });
            }

            setStops([]);
            setCurrentRouteId(null);
            setNotification('Ruta finalizada y guardada en el historial');
            setActiveModal(null);
        } catch (error) {
            console.error('Error finalizando ruta:', error);
            setNotification('Error al guardar reporte final');
        }
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

    const handleMarkerClick = (stopId: string) => {
        if (activeStop?.id === stopId) {
            handleRemoveStop(stopId);
            setActiveStop(null);
            setNotification('Parada eliminada');
        } else {
            const stop = stops.find(s => s.id === stopId);
            if (stop) {
                setActiveStop(stop);
                setNotification(`Parada ${stop.order} seleccionada. Clicka de nuevo para borrar.`);
            }
        }
    };

    const handleMapClick = (coords?: { lat: number; lng: number }) => {
        if (!coords) return;

        const newStop = {
            id: Math.random().toString(36).substr(2, 9),
            lat: coords.lat,
            lng: coords.lng,
            address: `Nueva Parada ${stops.length + 1}`,
            customerName: '',
            priority: 'NORMAL',
            isCompleted: false,
            isCurrent: false,
            order: stops.length + 1
        };

        setStops(prev => [...prev, newStop]);
        setNotification('Parada añadida (Modo Rápido)');
    };



    const handleReorder = (newStops: any[]) => {
        const updated = newStops.map((s, i) => ({ ...s, order: i + 1 }));
        setStops(updated);
    };

    const currentStop = stops.find(s => s.isCurrent);
    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    const vehicleOptions = [
        { type: 'truck' as VehicleType, icon: Truck, label: 'Trailer' },
        { type: 'van' as VehicleType, icon: Car, label: 'Van' }, // We'll use different emojis in Map
        { type: 'car' as VehicleType, icon: Car, label: 'Auto' },
        { type: 'pickup' as VehicleType, icon: Car, label: 'Pickup' },
        { type: 'motorcycle' as VehicleType, icon: Car, label: 'Moto' },
    ];

    return (
        <div className="flex h-screen bg-[#060914] text-foreground overflow-hidden font-sans selection:bg-info/30">
            <SOSButton
                driverName={session?.user?.name || undefined}
                currentPos={userCoords || undefined}
            />
            {/* Sidebar with enhanced dark style */}
            <aside className="hidden lg:flex w-80 flex-col bg-black border-r border-white/5 z-50 shadow-[20px_0_100px_rgba(0,0,0,0.5)] overflow-hidden">
                {/* Fixed Header */}
                <div className="p-8 pb-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-info rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(49,204,236,0.2)]">
                            <img src="/LogoHormiruta.png" alt="Logo" className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tighter text-white italic leading-none">HORMIRUTA</h1>
                            <p className="text-[10px] font-black text-info/40 uppercase tracking-[0.2em] mt-1">Intelligence Layer</p>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
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

                            <div className="pt-2 space-y-2">
                                <label className="text-[9px] font-black text-white/20 uppercase tracking-widest pl-1">Punto de Partida</label>
                                <div className="flex items-center gap-3 p-3 bg-black/40 rounded-2xl border border-white/5">
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
                            <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2 snap-x">
                                {vehicleOptions.map((opt) => (
                                    <button
                                        key={opt.type}
                                        onClick={() => setVehicleType(opt.type)}
                                        className={cn(
                                            "flex-shrink-0 w-16 flex flex-col items-center justify-center p-2 rounded-xl transition-all border-2 snap-center",
                                            vehicleType === opt.type
                                                ? "bg-info text-dark border-info shadow-[0_10px_30px_rgba(49,204,236,0.2)] scale-105"
                                                : "bg-white/5 text-white/30 border-transparent hover:bg-white/10 hover:text-white/50"
                                        )}
                                    >
                                        <div className="text-xl mb-1">
                                            {opt.type === 'truck' && '🚛'}
                                            {opt.type === 'van' && '🚐'}
                                            {opt.type === 'car' && '🚗'}
                                            {opt.type === 'pickup' && '🛻'}
                                            {opt.type === 'motorcycle' && '🏍️'}
                                        </div>
                                        <span className="text-[8px] font-black uppercase tracking-tight">{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <nav className="space-y-3">
                        {[
                            { icon: LayoutDashboard, label: 'Panel de Control', active: activeModal === null && viewMode === 'map' },
                            { icon: List, label: 'Ver Itinerario', active: viewMode === 'list', onClick: () => setViewMode(viewMode === 'map' ? 'list' : 'map') },
                            { icon: History, label: 'Mis Rutas', active: activeModal === 'saved-routes', onClick: () => setActiveModal('saved-routes') },
                            { icon: Upload, label: 'Importación Masiva', active: activeModal === 'bulk-import', onClick: () => setActiveModal('bulk-import') },
                            { icon: RefreshCw, label: 'Nueva Ruta', active: activeModal === 'new-route-confirm', onClick: () => setActiveModal('new-route-confirm') },
                            { icon: Save, label: 'Guardar Ruta', active: activeModal === 'save-route', onClick: () => setActiveModal('save-route'), disabled: stops.length === 0 },
                            { icon: SettingsIcon, label: 'Configuración', active: activeModal === 'settings', onClick: () => setActiveModal('settings') },
                        ].map((item, i) => {
                            const isSaveBtn = item.label === 'Guardar Ruta';
                            const isEnabled = !item.disabled;

                            return (
                                <button
                                    key={i}
                                    onClick={item.onClick}
                                    disabled={item.disabled}
                                    className={cn(
                                        "w-full flex items-center gap-4 p-4 rounded-2xl transition-all border border-transparent text-left group",
                                        item.active
                                            ? "bg-white/10 text-white font-black italic border-white/5 shadow-xl"
                                            : isSaveBtn && isEnabled
                                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                                                : "text-white/20 hover:bg-white/5 hover:text-white/40",
                                        item.disabled && "opacity-10 cursor-not-allowed grayscale"
                                    )}>
                                    <item.icon className={cn(
                                        "w-6 h-6 transition-colors",
                                        item.active ? "text-info" : (isSaveBtn && isEnabled ? "text-emerald-400" : "text-info/40"),
                                        isSaveBtn && isEnabled && "animate-pulse"
                                    )} />
                                    <span className={cn(
                                        "text-sm font-bold",
                                        isSaveBtn && isEnabled ? "text-emerald-400/90" : ""
                                    )}>
                                        {item.label}
                                    </span>
                                    {isSaveBtn && isEnabled && (
                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse" />
                                    )}
                                </button>
                            );
                        })}
                    </nav>

                    <div className="p-6 bg-white/5 rounded-[32px] border border-white/5 text-center">
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-4 italic">Seguridad activa</p>
                        <div className="flex justify-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <div className="w-2 h-2 rounded-full bg-info/20" />
                            <div className="w-2 h-2 rounded-full bg-info/20" />
                        </div>
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

                {/* Mobile Header - Cleaner */}
                <header className="lg:hidden bg-black/80 backdrop-blur-2xl py-4 px-6 shadow-2xl z-40 flex justify-between items-center border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <img src="/LogoHormiruta.png" alt="Logo" className="w-8 h-8" />
                        <h1 className="text-lg font-black tracking-tighter text-white italic">HORMIRUTA</h1>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="px-3 py-1.5 bg-info/10 border border-info/20 rounded-full">
                            <span className="text-[10px] font-black text-info uppercase">
                                {vehicleOptions.find(opt => opt.type === vehicleType)?.label || 'Camión'}
                            </span>
                        </div>
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
                            onMarkerClick={handleMarkerClick}
                            onRemoveStop={handleRemoveStop}
                            onGeofenceAlert={handleGeofenceAlert}
                            onUserLocationUpdate={setUserCoords}
                            userVehicle={{ type: vehicleType, isActive: isGpsActive }}
                            showTraffic={showTraffic}
                            geofenceRadius={geofenceRadius}
                            selectedStopId={activeStop?.id}
                            theme={mapTheme}
                            center={mapCenter}
                        />

                        {/* Map Controls Overlay */}
                        <div className="absolute top-20 lg:top-8 left-4 lg:left-6 z-10 transition-all">
                            <button
                                onClick={() => setShowTraffic(!showTraffic)}
                                className={cn(
                                    "flex items-center gap-2 px-3 lg:px-5 py-2 lg:py-2.5 rounded-xl lg:rounded-2xl border border-white/10 shadow-2xl backdrop-blur-2xl transition-all",
                                    showTraffic ? "bg-info/20 text-info border-info/40" : "bg-black/60 text-white/40 hover:bg-black/80"
                                )}
                            >
                                <div className={cn("w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full", showTraffic ? "bg-info animate-pulse" : "bg-white/20")} />
                                <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest">Tráfico</span>
                            </button>
                        </div>
                    </div>

                    {/* List Overlay with Ultra-Dark Theme */}
                    <AnimatePresence>
                        {viewMode === 'list' && (
                            <motion.div
                                drag="x"
                                dragConstraints={{ left: 0, right: 100 }}
                                dragElastic={0.05}
                                onDragEnd={(_, info) => {
                                    if (info.offset.x > 150) {
                                        setViewMode('map');
                                    }
                                }}
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                className="absolute inset-0 lg:left-auto lg:w-[400px] z-20 bg-black/95 backdrop-blur-[100px] p-8 overflow-y-auto border-l border-white/5 touch-none"
                            >
                                {/* Sidebar Drag Handle (Left vertical line) */}
                                <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-12 bg-white/10 rounded-full lg:hidden" />

                                <div className="flex justify-between items-start mb-12">
                                    <div className="mt-2">
                                        <h2 className="text-4xl font-black text-white italic tracking-tighter">Itinerario</h2>
                                        <div className="flex gap-2 mt-3">
                                            <p className="text-[10px] text-info font-black uppercase tracking-[0.4em] bg-white/5 px-2 py-1 rounded-md inline-block">
                                                {stops.filter(s => !s.isCompleted).length} Pendientes
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => setViewMode('map')} className="p-4 text-white/20 bg-white/5 rounded-[24px] hover:bg-white/10 transition-colors border border-white/5 mt-2">
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

                        {stops.length > 0 && stops.every(s => s.isCompleted) && (
                            <button
                                onClick={handleFinishRoute}
                                className="pointer-events-auto flex-1 flex items-center justify-center gap-3 py-5 bg-green-500 text-dark font-black text-lg rounded-2xl shadow-[0_20px_40px_rgba(34,197,94,0.3)] transition-all animate-bounce hover:scale-105"
                            >
                                <CheckCircle className="w-6 h-6" />
                                FINALIZAR
                            </button>
                        )}
                    </div>

                    {/* Optimized Bottom Bar */}
                    <nav className="absolute bottom-6 left-6 right-6 h-20 bg-[#0a0a0a]/90 backdrop-blur-3xl rounded-[32px] border border-white/10 flex items-center justify-between px-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-50 lg:hidden font-sans">

                        <button
                            onClick={handleRecenter}
                            className={cn(
                                "flex flex-col items-center gap-1.5 p-2 transition-all",
                                isGpsActive ? "text-info font-black" : "text-white/30"
                            )}
                        >
                            <Crosshair className={cn("w-7 h-7", isGpsActive && "animate-spin-slow")} />
                            <span className="text-[10px] font-black uppercase tracking-tighter">GPS</span>
                        </button>

                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className={cn(
                                "flex flex-col items-center gap-1 p-2 transition-all",
                                isMobileMenuOpen ? "text-info" : "text-white/20"
                            )}
                        >
                            <LayoutDashboard className="w-6 h-6" />
                            <span className="text-[9px] font-black uppercase tracking-tighter">Menú</span>
                        </button>

                        <button
                            onClick={() => setActiveModal('add-stop')}
                            className="w-16 h-16 -mt-10 bg-info rounded-2xl shadow-[0_15px_40px_rgba(49,204,236,0.4)] flex items-center justify-center text-dark hover:scale-110 active:scale-90 transition-all border-4 border-[#0a0a0a]"
                        >
                            <Plus className="w-8 h-8" />
                        </button>

                        <button
                            onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
                            className={cn(
                                "flex flex-col items-center gap-1 p-2 transition-all",
                                viewMode === 'list' ? "text-info" : "text-white/20"
                            )}
                        >
                            {viewMode === 'map' ? <List className="w-6 h-6" /> : <MapIcon className="w-6 h-6" />}
                            <span className="text-[9px] font-black uppercase tracking-tighter">{viewMode === 'map' ? 'Lista' : 'Mapa'}</span>
                        </button>

                        <button
                            onClick={() => setActiveModal('settings')}
                            className="flex flex-col items-center gap-1.5 p-2 text-white/20 hover:text-white transition-all shadow-xl"
                        >
                            <SettingsIcon className="w-6 h-6" />
                            <span className="text-[9px] font-black uppercase tracking-tighter">Config</span>
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
                                initial={{ scale: 0.95, y: 100, opacity: 0 }}
                                animate={{ scale: 1, y: 0, opacity: 1 }}
                                exit={{ scale: 0.95, y: 100, opacity: 0 }}
                                className="w-full max-w-sm bg-black border border-white/5 rounded-[40px] shadow-[0_50px_200px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col max-h-[85vh]"
                            >
                                {/* Modal Header / Drag Zone */}
                                <motion.div
                                    drag="y"
                                    dragConstraints={{ top: 0, bottom: 200 }}
                                    dragElastic={0.1}
                                    onDragEnd={(_, info) => {
                                        if (info.offset.y > 100) {
                                            setActiveModal(null);
                                            setActiveStop(null);
                                        }
                                    }}
                                    className="p-8 pb-4 pt-10 relative cursor-grab active:cursor-grabbing touch-none"
                                >
                                    {/* Drag Handle / Deslizador Visual */}
                                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/10 rounded-full hover:bg-white/20 transition-colors" />

                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-info to-transparent opacity-20" />

                                    <div className="flex justify-between items-center mb-4">
                                        <div>
                                            <h3 className="text-2xl font-black text-white italic tracking-tighter">
                                                {activeModal === 'edit-stop' ? 'Ajustar Punto' :
                                                    activeModal === 'add-stop' ? 'Nueva Parada' :
                                                        activeModal === 'settings' ? 'Configuración' : 'Gasto Ruta'}
                                            </h3>
                                            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mt-1">Hormiruta Protocol</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setActiveModal(null);
                                                setActiveStop(null);
                                            }}
                                            className="p-3 bg-white/5 rounded-[20px] text-white/20 hover:text-white transition-all shadow-inner relative z-20"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </motion.div>

                                {/* Scrollable Content Area */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-0 pb-12">
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
                                    ) : activeModal === 'bulk-import' ? (
                                        <BulkImport
                                            onImport={handleBulkImport}
                                            onClose={() => setActiveModal(null)}
                                        />
                                    ) : activeModal === 'saved-routes' ? (
                                        <SavedRoutes
                                            onLoadRoute={handleLoadRoute}
                                            onClose={() => setActiveModal(null)}
                                        />
                                    ) : activeModal === 'new-route-confirm' ? (
                                        <div className="space-y-8 text-center py-4">
                                            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                                                <RefreshCw className="w-10 h-10 text-red-500" />
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-white font-bold text-lg">¿Empezar de cero?</p>
                                                <p className="text-white/30 text-xs">Esto borrará todas las paradas actuales. Asegúrate de haber guardado tu ruta si quieres conservarla.</p>
                                            </div>
                                            <div className="flex gap-4">
                                                <button onClick={() => setActiveModal(null)} className="flex-1 py-4 bg-white/5 rounded-2xl text-[10px] font-black uppercase text-white/40 tracking-widest border border-white/5 hover:bg-white/10 transition-all">Cancelar</button>
                                                <button onClick={handleNewRoute} className="flex-1 py-4 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20 hover:scale-105 active:scale-95 transition-all">Sí, Borrar Todo</button>
                                            </div>
                                        </div>
                                    ) : activeModal === 'save-route' ? (
                                        <div className="space-y-8 py-4">
                                            <div className="space-y-6">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] pl-1">Nombre de la Ruta</label>
                                                    <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/5 rounded-2xl focus-within:border-info/50 transition-all">
                                                        <RouteIcon className="w-5 h-5 text-info/50" />
                                                        <input
                                                            value={routeName}
                                                            onChange={(e) => setRouteName(e.target.value)}
                                                            placeholder="Ej. Entregas Lunes Norte"
                                                            className="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-white/10"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] pl-1">Fecha de Ejecución</label>
                                                    <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/5 rounded-2xl focus-within:border-info/50 transition-all">
                                                        <Calendar className="w-5 h-5 text-info/50" />
                                                        <input
                                                            type="date"
                                                            value={routeDate}
                                                            onChange={(e) => setRouteDate(e.target.value)}
                                                            className="bg-transparent border-none outline-none text-white text-sm w-full [color-scheme:dark]"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-4">
                                                <button onClick={() => setActiveModal(null)} className="flex-1 py-4 bg-white/5 rounded-2xl text-[10px] font-black uppercase text-white/40 tracking-widest border border-white/5 hover:bg-white/10 transition-all">Cancelar</button>
                                                <button
                                                    onClick={handleSaveRoute}
                                                    disabled={!routeName}
                                                    className="flex-1 py-4 bg-info text-dark rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-info/10 hover:scale-105 active:scale-95 transition-all disabled:opacity-20"
                                                >
                                                    Guardar Ruta
                                                </button>
                                            </div>
                                        </div>
                                    ) : activeModal === 'route-summary' ? (
                                        <div className="space-y-8 text-center py-4">
                                            <div className="w-20 h-20 bg-info/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <TrendingUp className="w-10 h-10 text-info" />
                                            </div>
                                            <h4 className="text-2xl font-black text-white italic tracking-tighter uppercase">Ruta Completada</h4>

                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Paradas</p>
                                                    <p className="text-lg font-black text-info">{routeSummary?.completedStops}</p>
                                                </div>
                                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Distancia</p>
                                                    <p className="text-lg font-black text-info">{routeSummary?.distance}km</p>
                                                </div>
                                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Tiempo</p>
                                                    <p className="text-lg font-black text-info">{routeSummary?.time}</p>
                                                </div>
                                            </div>

                                            <button
                                                onClick={confirmFinish}
                                                className="w-full py-5 bg-info text-dark rounded-3xl text-sm font-black uppercase tracking-widest shadow-2xl hover:brightness-110 transition-all"
                                            >
                                                Finalizar y Subir Reporte
                                            </button>
                                        </div>
                                    ) : activeModal === 'settings' ? (
                                        <div className="space-y-8">
                                            <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                                                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Apariencia del Mapa</p>
                                                <div className="flex bg-black/50 p-1 rounded-2xl border border-white/5">
                                                    <button
                                                        onClick={() => setMapTheme('light')}
                                                        className={cn(
                                                            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all",
                                                            mapTheme === 'light' ? "bg-white text-black shadow-lg" : "text-white/40 hover:text-white"
                                                        )}
                                                    >
                                                        <Sun className="w-4 h-4" />
                                                        <span className="text-[10px] font-bold uppercase">Modo Día</span>
                                                    </button>
                                                    <button
                                                        onClick={() => setMapTheme('dark')}
                                                        className={cn(
                                                            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all",
                                                            mapTheme === 'dark' ? "bg-info text-dark shadow-lg" : "text-white/40 hover:text-white"
                                                        )}
                                                    >
                                                        <Moon className="w-4 h-4" />
                                                        <span className="text-[10px] font-bold uppercase">Modo Noche</span>
                                                    </button>
                                                </div>
                                            </div>

                                            <SOSConfig />

                                            <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                                                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Sonido de Notificación</p>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {soundOptions.map((sound) => (
                                                        <button
                                                            key={sound.id}
                                                            onClick={() => {
                                                                setAlertSound(sound.id);
                                                                // Play a preview
                                                                const audio = new Audio(sound.url);
                                                                audio.volume = 0.4;
                                                                audio.play();
                                                                setNotification(`Sonido ${sound.label} seleccionado`);
                                                            }}
                                                            className={cn(
                                                                "flex items-center justify-between p-4 rounded-2xl border transition-all",
                                                                alertSound === sound.id
                                                                    ? "bg-info/10 border-info/40 text-info"
                                                                    : "bg-white/5 border-transparent text-white/40 hover:bg-white/10"
                                                            )}
                                                        >
                                                            <span className="text-xs font-bold uppercase tracking-tight">{sound.label}</span>
                                                            <div className={cn(
                                                                "w-2 h-2 rounded-full",
                                                                alertSound === sound.id ? "bg-info shadow-[0_0_8px_rgba(49,204,236,0.8)]" : "bg-white/20"
                                                            )} />
                                                        </button>
                                                    ))}
                                                </div>
                                                <p className="text-[8px] text-white/20 italic text-center">Este sonido sonará al entrar al panel y al llegar a una parada.</p>
                                            </div>

                                            <button
                                                onClick={() => signOut({ callbackUrl: '/' })}
                                                className="w-full flex items-center justify-between p-5 bg-red-500/5 hover:bg-red-500/10 rounded-2xl border border-red-500/10 transition-all group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <LogOut className="w-5 h-5 text-red-500/40 group-hover:text-red-500 transition-colors" />
                                                    <span className="text-sm font-bold text-red-500/80 group-hover:text-red-500 transition-colors">Cerrar Sesión</span>
                                                </div>
                                                <div className="text-[10px] font-black text-red-500/20 group-hover:text-red-500/50 uppercase tracking-widest transition-colors">Salir</div>
                                            </button>
                                        </div>
                                    ) : (
                                        <ExpenseForm
                                            onAddExpense={async (exp) => {
                                                try {
                                                    const res = await fetch('/api/expenses', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                            ...exp,
                                                            routeId: currentRouteId
                                                        })
                                                    });
                                                    if (res.ok) {
                                                        const savedExpense = await res.json();
                                                        setExpenses([...expenses, savedExpense]);
                                                        setNotification('Gasto registrado oficialmente');
                                                        return true;
                                                    } else {
                                                        setNotification('Error al guardar el gasto en el servidor');
                                                        return false;
                                                    }
                                                } catch (err) {
                                                    setNotification('Error de conexión al guardar gasto');
                                                    return false;
                                                }
                                            }}
                                            onClose={() => setActiveModal(null)}
                                        />
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Gestor de alertas de Geofencing */}
                {isGpsActive && <GeofenceAlertsManager onGeofenceAlert={handleGeofenceAlert} />}

                {/* Mobile Menu Overlay (Sidebar functionality for phone) */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-[110] bg-black/95 backdrop-blur-3xl lg:hidden flex flex-col"
                        >
                            <div className="flex justify-between items-center p-8 border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <img src="/LogoHormiruta.png" alt="Logo" className="w-8 h-8" />
                                    <h2 className="text-xl font-black text-white italic">Centro de Control</h2>
                                </div>
                                <button onClick={() => setIsMobileMenuOpen(false)} className="p-3 bg-white/5 rounded-2xl">
                                    <X className="w-6 h-6 text-white/40" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-10">
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Tipo de Vehículo</p>
                                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                                        {vehicleOptions.map((opt) => (
                                            <button
                                                key={opt.type}
                                                onClick={() => setVehicleType(opt.type)}
                                                className={cn(
                                                    "flex-shrink-0 px-6 py-4 rounded-2xl border transition-all flex flex-col items-center gap-2",
                                                    vehicleType === opt.type ? "bg-info text-dark border-info" : "bg-white/5 text-white/30 border-transparent"
                                                )}
                                            >
                                                <span className="text-2xl">{opt.type === 'truck' && '🚛'}
                                                    {opt.type === 'van' && '🚐'}
                                                    {opt.type === 'car' && '🚗'}
                                                    {opt.type === 'pickup' && '🛻'}
                                                    {opt.type === 'motorcycle' && '🏍️'}
                                                </span>
                                                <span className="text-[8px] font-black uppercase">{opt.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Acciones de Ruta</p>
                                    <div className="grid grid-cols-1 gap-3">
                                        {[
                                            { icon: Crosshair, label: 'Centrar Mapa en Mí', onClick: () => { handleRecenter(); setIsMobileMenuOpen(false); } },
                                            { icon: History, label: 'Mis Rutas Guardadas', onClick: () => { setActiveModal('saved-routes'); setIsMobileMenuOpen(false); } },
                                            { icon: Upload, label: 'Importar Excel/CSV', onClick: () => { setActiveModal('bulk-import'); setIsMobileMenuOpen(false); } },
                                            { icon: Save, label: 'Guardar Itinerario Actual', onClick: () => { setActiveModal('save-route'); setIsMobileMenuOpen(false); }, disabled: stops.length === 0 },
                                            { icon: RefreshCw, label: 'Reiniciar Todo', onClick: () => { setActiveModal('new-route-confirm'); setIsMobileMenuOpen(false); } },
                                        ].map((item, i) => (
                                            <button
                                                key={i}
                                                onClick={item.onClick}
                                                disabled={item.disabled}
                                                className="w-full flex items-center gap-4 p-5 bg-white/5 border border-white/5 rounded-3xl text-white/70 active:scale-95 transition-all text-left disabled:opacity-20"
                                            >
                                                <item.icon className="w-5 h-5 text-info" />
                                                <span className="text-sm font-bold uppercase tracking-tight">{item.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-6 bg-info/5 border border-info/10 rounded-3xl">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Regreso al Inicio</span>
                                        <button
                                            onClick={() => setReturnToStart(!returnToStart)}
                                            className={cn("w-10 h-5 rounded-full relative p-1 transition-all", returnToStart ? "bg-info" : "bg-white/10")}
                                        >
                                            <div className={cn("w-3 h-3 bg-white rounded-full transition-all", returnToStart ? "translate-x-5" : "0")} />
                                        </button>
                                    </div>
                                    <p className="text-[9px] text-white/20 italic">Si se activa, el optimizador buscará una ruta circular que termine donde empezaste.</p>
                                </div>
                            </div>

                            <div className="p-8 border-t border-white/5">
                                <button
                                    onClick={() => signOut({ callbackUrl: '/' })}
                                    className="w-full p-5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-[32px] font-black uppercase text-[10px] tracking-widest mb-6"
                                >
                                    Cerrar Sesión
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div >
    );
}
