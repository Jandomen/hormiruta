'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
    Mic, Plus, Map as MapIcon, Settings, Navigation,
    CheckCircle, ShieldAlert, List, X, DollarSign, Check,
    TrendingUp, Users, LayoutDashboard, ChevronRight,
    Truck, Car, ArrowUpCircle, Crosshair, Upload, MapPin, User,
    XCircle, RefreshCw, History, Save, Shield, Settings as SettingsIcon,
    LogOut, Calendar, Route as RouteIcon, Sun, Moon, Crown, FileText,
    Fingerprint, Contact, RotateCw, Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NavMap from '../components/NavMap';
import GeofenceAlertsManager from '../components/GeofenceAlertsManager';
import Timeline from '../components/Timeline';
import StopInput from '../components/StopInput';
import ExpenseForm from '../components/ExpenseForm';
import SOSButton from '../components/SOSButton';
import BulkImport from '../components/BulkImport';
import SOSConfig from '../components/SOSConfig';
import SavedRoutes from '../components/SavedRoutes';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { cn } from '../lib/utils';
import { openInGoogleMaps, openInWaze } from '../lib/navigation';
import PermissionGuard from '../components/PermissionGuard';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

type VehicleType = 'car' | 'truck' | 'van' | 'motorcycle' | 'pickup' | 'ufo';

export default function Dashboard() {
    const { data: session, status, update } = useSession();
    const router = useRouter();

    const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeModal, setActiveModal] = useState<'add-stop' | 'edit-stop' | 'expense' | 'bulk-import' | 'settings' | 'saved-routes' | 'save-route' | 'new-route-confirm' | 'route-summary' | 'navigation-choice' | 'profile' | 'welcome-map-preference' | 'marker-actions' | null>(null);
    const [routeName, setRouteName] = useState('');
    const [routeSummary, setRouteSummary] = useState<{ distance: number, time: string, completedStops: number } | null>(null);
    const [routeDate, setRouteDate] = useState(new Date().toISOString().split('T')[0]);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [returnToStart, setReturnToStart] = useState(false);
    const [stops, setStops] = useState<any[]>([]);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [preferredMapApp, setPreferredMapApp] = useState<'google' | 'waze' | null>(null);

    const [initialStopData, setInitialStopData] = useState<{ lat: number; lng: number; address?: string } | undefined>(undefined);
    const [originPoint, setOriginPoint] = useState<{ lat: number, lng: number, address: string }>({
        lat: 19.4326,
        lng: -99.1332,
        address: 'Mi Ubicación Actual'
    });
    const [activeStop, setActiveStop] = useState<any>(null);

    // New State for Vehicle and GPS
    const [vehicleType, setVehicleType] = useState<VehicleType>('truck');
    const [isVehicleSelectorOpen, setIsVehicleSelectorOpen] = useState(false);
    const [userCoords, setUserCoords] = useState<{ lat: number, lng: number } | null>(null);
    const [showTraffic, setShowTraffic] = useState(false);
    const [avoidTolls, setAvoidTolls] = useState(false);
    const [isGpsActive, setIsGpsActive] = useState(false);
    const [navigationTargetId, setNavigationTargetId] = useState<string | null>(null);
    const [notification, setNotification] = useState<string | null>(null);
    const [geofenceRadius] = useState(100); // Radio de geofence en metros
    const [mapTheme, setMapTheme] = useState<'light' | 'dark'>('dark');
    const [currentRouteId, setCurrentRouteId] = useState<string | null>(null);
    const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>(undefined);
    const hasInitializedFromSession = useRef(false);
    const swapScrollRef = useRef<HTMLDivElement>(null); // Added useRef for swap list

    // Audio Notification System
    const [alertSound, setAlertSound] = useState('sound1');
    const [hasPlayedWelcome, setHasPlayedWelcome] = useState(false);

    // Pro check based on session
    const isPro = (session?.user as any)?.plan === 'premium' || (session?.user as any)?.plan === 'elite';

    /* useEffect(() => {
         // Future: Sync from API if session is stale
    }, []); */

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
            // Play notification sound automatically when a text notification appears
            playNotification();
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification, playNotification]);

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

    // Auto-scroll swap list to active stop
    useEffect(() => {
        if (activeModal === 'marker-actions' && activeStop && swapScrollRef.current) {
            const container = swapScrollRef.current;
            const activeElement = container.querySelector('[data-active-stop="true"]') as HTMLElement;
            if (activeElement) {
                const containerWidth = container.offsetWidth;
                const elementOffset = activeElement.offsetLeft;
                const elementWidth = activeElement.offsetWidth;
                container.scrollTo({
                    left: elementOffset - (containerWidth / 2) + (elementWidth / 2),
                    behavior: 'smooth'
                });
            }
        }
    }, [activeModal, activeStop]);

    // Load data from localStorage on mount
    useEffect(() => {
        const savedStops = localStorage.getItem('hormiruta_stops');
        const savedExpenses = localStorage.getItem('hormiruta_expenses');
        const savedReturnToStart = localStorage.getItem('hormiruta_returnToStart');
        const savedVehicleType = localStorage.getItem('hormiruta_vehicleType');

        if (savedStops) {
            try {
                const parsed = JSON.parse(savedStops);
                if (Array.isArray(parsed)) setStops(parsed);
            } catch (e) {
                console.error("Error loading stops", e);
            }
        }
        if (savedExpenses) {
            try {
                const parsed = JSON.parse(savedExpenses);
                if (Array.isArray(parsed)) setExpenses(parsed);
            } catch (e) {
                console.error("Error loading expenses", e);
            }
        }
        if (savedReturnToStart) setReturnToStart(savedReturnToStart === 'true');
        if (savedVehicleType) setVehicleType(savedVehicleType as VehicleType);
    }, []);

    const syncSettings = async (data: { preferredMapApp?: string, vehicleType?: string, sosContact?: string }) => {
        if (status !== 'authenticated') return;
        try {
            const res = await fetch('/api/user/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                // Update local session to keep it in sync without page reload
                update(data);
            }
        } catch (e) {
            console.error("[SYNC_SETTINGS] Failed", e);
        }
    };

    useEffect(() => {
        if (typeof window === 'undefined' || hasInitializedFromSession.current) return;

        if (status === 'authenticated' && session?.user) {
            const sessionMapApp = (session.user as any).preferredMapApp;
            const sessionVehicleType = (session.user as any).vehicleType;

            if (sessionMapApp) {
                setPreferredMapApp(sessionMapApp);
                localStorage.setItem('hormiruta_preferredMapApp', sessionMapApp);
            }
            if (sessionVehicleType) {
                setVehicleType(sessionVehicleType as VehicleType);
                localStorage.setItem('hormiruta_vehicleType', sessionVehicleType);
            }

            if (sessionMapApp || (localStorage.getItem('hormiruta_preferredMapApp'))) {
                hasInitializedFromSession.current = true;
            } else {
                setActiveModal('welcome-map-preference');
                hasInitializedFromSession.current = true;
            }
        } else if (status === 'unauthenticated') {
            const savedMapApp = localStorage.getItem('hormiruta_preferredMapApp');
            if (savedMapApp === 'google' || savedMapApp === 'waze') {
                setPreferredMapApp(savedMapApp as 'google' | 'waze');
            }
            hasInitializedFromSession.current = true;
        }
    }, [status, session]);

    // Save data to localStorage on changes
    useEffect(() => {
        localStorage.setItem('hormiruta_stops', JSON.stringify(stops));
    }, [stops]);

    useEffect(() => {
        localStorage.setItem('hormiruta_expenses', JSON.stringify(expenses));
    }, [expenses]);

    useEffect(() => {
        localStorage.setItem('hormiruta_returnToStart', String(returnToStart));
    }, [returnToStart]);

    useEffect(() => {
        localStorage.setItem('hormiruta_vehicleType', vehicleType);
        if (status === 'authenticated' && (session?.user as any)?.vehicleType !== vehicleType) {
            syncSettings({ vehicleType });
        }
    }, [vehicleType, status]);

    useEffect(() => {
        if (preferredMapApp) {
            localStorage.setItem('hormiruta_preferredMapApp', preferredMapApp);
            if (status === 'authenticated' && (session?.user as any)?.preferredMapApp !== preferredMapApp) {
                syncSettings({ preferredMapApp });
            }
        }
    }, [preferredMapApp, status]);

    useEffect(() => {
        if (navigator.geolocation && !isGpsActive) {
            navigator.geolocation.getCurrentPosition((position) => {
                const coords = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                setOriginPoint(prev => ({
                    ...prev,
                    ...coords
                }));
                // Auto-center on load
                setMapCenter(coords);
            });
        }
    }, [isGpsActive]);

    // Geofencing logic is now handled in the Map component via onGeofenceAlert
    // This redundant logic was causing conflicts and using a less accurate distance calculation


    const lastOriginCoords = useRef<{ lat: number, lng: number } | null>(null);

    useEffect(() => {
        if (status === 'authenticated' && userCoords && isGpsActive) {
            // Check if user has moved significantly (> ~50m) before updating originPoint
            const hasMovedSignificantly = !lastOriginCoords.current ||
                Math.abs(userCoords.lat - lastOriginCoords.current.lat) > 0.0005 ||
                Math.abs(userCoords.lng - lastOriginCoords.current.lng) > 0.0005;

            if (hasMovedSignificantly) {
                setOriginPoint({
                    lat: userCoords.lat,
                    lng: userCoords.lng,
                    address: 'Mi Ubicación Actual'
                });
                lastOriginCoords.current = userCoords;
            }

            const syncLocation = async () => {
                try {
                    await fetch('/api/user/location', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            lat: userCoords.lat,
                            lng: userCoords.lng,
                            vehicleType: vehicleType
                        })
                    });
                } catch (e) {
                    console.error("Location sync failed", e);
                }
            };

            const interval = setInterval(syncLocation, 30000); // Sincronizar cada 30 segundos
            syncLocation(); // Ejecutar inmediatamente la primera vez
            return () => clearInterval(interval);
        }
    }, [status, userCoords, isGpsActive, vehicleType]);

    useEffect(() => {
        console.log("[DASHBOARD] Session Status Update:", status);
        if (status === 'unauthenticated') {
            console.log("[DASHBOARD] No active session, redirecting to login...");
            router.push('/auth/login');
        } else if (status === 'authenticated') {
            console.log("[DASHBOARD] Session established for:", session?.user?.email);
        }
    }, [status, router, session]);

    const handleLogout = async () => {
        // 1. Clear Native Google Session
        if (Capacitor.isNativePlatform()) {
            try {
                await FirebaseAuthentication.signOut();
                console.log("Sesión nativa Google cerrada");
            } catch (e) {
                console.warn("No se pudo cerrar sesión nativa Google", e);
            }
        }

        // 2. Clear Local Storage and Cookies manually
        localStorage.clear();
        sessionStorage.clear();

        // Extra cleanup for cookies (common in Capacitor/Webview issues)
        document.cookie.split(";").forEach((c) => {
            document.cookie = c
                .replace(/^ +/, "")
                .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });

        // 3. Force sign out with full redirect
        await signOut({ callbackUrl: '/auth/login', redirect: true });
    };

    const handleReverseRoute = () => {
        if (stops.length < 2) return;

        // Mantener las paradas completadas al principio y solo invertir las pendientes
        const completed = stops.filter(s => s.isCompleted);
        const pending = stops.filter(s => !s.isCompleted);

        const reversedPending = [...pending].reverse();
        const updated = [...completed, ...reversedPending].map((s, i) => ({
            ...s,
            order: i + 1,
            isCurrent: i === completed.length // La primera pendiente ahora es la actual
        }));

        setStops(updated);
        setNotification('Ruta invertida correctamente');
    };

    // --- MANEJO DEL BOTÓN ATRÁS (ANDROID / WEB) ---
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Función centralizada para cerrar overlays
        const handleBackAction = () => {
            if (activeModal !== null) {
                setActiveModal(null);
                setActiveStop(null);
                return true;
            }
            if (isMobileMenuOpen) {
                setIsMobileMenuOpen(false);
                return true;
            }
            if (viewMode === 'list') {
                setViewMode('map');
                return true;
            }
            return false;
        };

        // 1. Lógica para Navegador/Web (popstate)
        const onPopState = (e: PopStateEvent) => {
            const handled = handleBackAction();
            if (handled) {
                // Si cerramos algo, volvemos a empujar el estado para que el siguiente "atrás"
                // siga siendo capturado si el usuario abre otro modal.
                window.history.pushState({ dashboard: true }, '');
            }
        };

        // Aseguramos que el estado base del dashboard esté marcado
        if (!window.history.state?.dashboard) {
            window.history.replaceState({ dashboard: true }, '');
        }

        // Si hay una capa abierta, empujamos una entrada al historial para "atrapar" el botón atrás
        const isOverlayOpen = activeModal !== null || isMobileMenuOpen || viewMode === 'list';
        if (isOverlayOpen) {
            // Empujamos solo si el estado actual no es ya un overlay (evitar bucles)
            if (!window.history.state?.overlay) {
                window.history.pushState({ dashboard: true, overlay: true }, '');
            }
            window.addEventListener('popstate', onPopState);
        }

        // 2. Lógica para Android Nativo (Capacitor App Plugin)
        let nativeListener: any;
        if (Capacitor.isNativePlatform()) {
            nativeListener = App.addListener('backButton', (data) => {
                const handled = handleBackAction();
                // Si no hay nada que cerrar y podemos ir atrás en el historial real, lo hacemos
                if (!handled && data.canGoBack) {
                    window.history.back();
                }
            });
        }

        return () => {
            window.removeEventListener('popstate', onPopState);
            if (nativeListener) {
                nativeListener.then((h: any) => h.remove());
            }
        };
    }, [activeModal, isMobileMenuOpen, viewMode]);

    const [showConfetti, setShowConfetti] = useState(false);

    const handleCompleteStop = useCallback((id: string, isFailed: boolean = false) => {
        setStops(prevStops => {
            const newStops = prevStops.map(s => {
                if (s.id === id) return {
                    ...s,
                    isCompleted: !isFailed,
                    isFailed: isFailed,
                    isCurrent: false,
                    completedAt: new Date()
                };
                return s;
            });

            // Check if all stops are done
            const allDone = newStops.every(s => s.isCompleted || s.isFailed);
            if (allDone && newStops.length > 0) {
                setTimeout(() => {
                    setActiveModal('route-summary');
                    setShowConfetti(true);
                }, 800);
            }

            // Auto-set next current stop
            const nextPendingIndex = newStops.findIndex(s => !s.isCompleted && !s.isFailed);
            if (nextPendingIndex !== -1) {
                newStops[nextPendingIndex].isCurrent = true;
            }

            return newStops;
        });
        setNavigationTargetId(prev => prev === id ? null : prev);
        setNotification(isFailed ? '⚠️ Parada marcada como FALLIDA' : '✅ Entrega REALIZADA con éxito');
    }, []);

    const handleRevertStop = useCallback((id: string) => {
        setStops(prevStops => {
            const newStops = prevStops.map(s => {
                if (s.id === id) return {
                    ...s,
                    isCompleted: false,
                    isFailed: false,
                    isCurrent: false,
                    completedAt: undefined
                };
                return s;
            });

            // Recalcular cuál debería ser la actual si no hay ninguna
            const currentExists = newStops.some(s => s.isCurrent);
            if (!currentExists) {
                const firstPending = newStops.find(s => !s.isCompleted && !s.isFailed);
                if (firstPending) firstPending.isCurrent = true;
            }

            return newStops;
        });
        setNotification('🔄 Parada restaurada al itinerario');
    }, []);

    const handleSwapOrder = useCallback((stopId: string, newOrder: number) => {
        setStops(prevStops => {
            const movingStop = prevStops.find(s => s.id === stopId);
            if (!movingStop) return prevStops;

            const oldOrder = movingStop.order;
            if (oldOrder === newOrder) return prevStops;

            // Remove the stop and insert it at the new position
            const filteredStops = prevStops.filter(s => s.id !== stopId);
            const stopsBefore = filteredStops.filter(s => s.order < newOrder);
            const stopsAfter = filteredStops.filter(s => s.order >= newOrder);

            // If we are moving forward, the logic is slightly different
            // Actually, a simpler way is to sort by order, find index, move in array, then re-index
            const sorted = [...prevStops].sort((a, b) => a.order - b.order);
            const indexToMove = sorted.findIndex(s => s.id === stopId);
            const targetIndex = newOrder - 1;

            const [removed] = sorted.splice(indexToMove, 1);
            sorted.splice(targetIndex, 0, removed);

            return sorted.map((s, i) => ({ ...s, order: i + 1 }));
        });
        setNotification(`🚚 Ruta reordenada: movido a posición ${newOrder}`);
    }, []);

    const handleMarkerDragEnd = useCallback((stopId: string, newCoords: { lat: number; lng: number }) => {
        setStops(prev => prev.map(s => {
            if (s.id === stopId) {
                return { ...s, ...newCoords };
            }
            return s;
        }));
        setNotification('📍 Ubicación de parada actualizada');
    }, []);

    const handleDuplicateStop = useCallback((stop: any) => {
        const duplicatedStop = {
            ...stop,
            id: Math.random().toString(36).substr(2, 9),
            order: stops.length + 1,
            isCompleted: false,
            isFailed: false,
            isCurrent: false
        };
        setStops(prev => [...prev, duplicatedStop]);
        setNotification('Parada duplicada');
    }, [stops.length]);

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
            <div className="flex h-screen bg-darker items-center justify-center">
                <div className="text-center">
                    <img src="/LogoHormiruta.png" alt="Logo" className="w-16 h-16 animate-pulse mx-auto mb-4" />
                    <p className="text-info font-black text-xs uppercase tracking-widest animate-pulse">Verificando Protocolo...</p>
                </div>
            </div>
        );
    }

    const optimizeRoute = async (customStops?: any[]) => {
        const stopsToProcess = customStops || stops;
        const userPlan = (session?.user as any)?.plan || 'free';
        const completedStops = stopsToProcess.filter(s => s.isCompleted || s.isFailed);
        const pendingStops = stopsToProcess.filter(s => !s.isCompleted && !s.isFailed);

        if (!isPro && stopsToProcess.length > 10) {
            setNotification('🚨 Plan Gratuito limitado a 10 paradas. Actualiza a Pro.');
            router.push('/pricing');
            return;
        }

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
            setViewMode('map'); // Regresar al mapa automáticamente después de cualquier optimización
        }
    };
    const handleQuickNavigation = () => {
        if (stops.length === 0) {
            setNotification('Añade paradas primero para navegar');
            return;
        }

        // Prioridad: 1. Parada seleccionada en el mapa, 2. Parada actual, 3. Siguiente pendiente
        const targetStop = stops.find(s => s.id === activeStop?.id) ||
            stops.find(s => s.isCurrent) ||
            stops.find(s => !s.isCompleted && !s.isFailed);

        if (!targetStop) {
            setNotification('No hay paradas pendientes en tu ruta');
            return;
        }

        if (preferredMapApp === 'google') {
            openInGoogleMaps(targetStop.lat, targetStop.lng);
        } else if (preferredMapApp === 'waze') {
            openInWaze(targetStop.lat, targetStop.lng);
        } else {
            // Si no tiene preferencia, mostramos el modal de elección
            setActiveStop(targetStop);
            setActiveModal('navigation-choice');
        }
    };

    const isDuplicate = (address: string, lat: number, lng: number) => {
        return stops.some(s =>
            s.address.toLowerCase().trim() === address.toLowerCase().trim() ||
            (Math.abs(s.lat - lat) < 0.0001 && Math.abs(s.lng - lng) < 0.0001)
        );
    };

    const checkPlanLimit = (additionalCount: number = 1) => {
        const userPlan = (session?.user as any)?.plan || 'free';
        if (!isPro && (stops.length + additionalCount) > 10) {
            setNotification('⏳ Límite de 10 paradas alcanzado. ¡Pásate a PRO!');
            setTimeout(() => {
                router.push('/pricing');
            }, 500);
            return false;
        }
        return true;
    };

    const handleAddStop = (newStop: any) => {
        if (!checkPlanLimit()) return;

        if (isDuplicate(newStop.address, newStop.lat, newStop.lng)) {
            setNotification('Esta parada ya está en tu itinerario');
            return;
        }
        const updatedStops = [...stops, { ...newStop, order: stops.length + 1 }];
        setStops(updatedStops.sort((a, b) => a.order - b.order));
        setInitialStopData(undefined);
        setNotification('Parada añadida');
    };

    const handleAddAndOptimize = async (newStop: any) => {
        if (!checkPlanLimit()) return;

        if (isDuplicate(newStop.address, newStop.lat, newStop.lng)) {
            setNotification('Esta parada ya está en tu itinerario');
            return;
        }

        const updatedStops = [...stops, { ...newStop, order: stops.length + 1 }];
        setStops(updatedStops);
        setInitialStopData(undefined);
        setActiveModal(null);

        // Optimizar inmediatamente con la lista actualizada
        await optimizeRoute(updatedStops);
    };

    const handleBulkImport = (newStops: any[]) => {
        if (!checkPlanLimit(newStops.length)) return;

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
            distance: (stops.length * 2.5),
            time: "2h 45m",
            completedStops: completed
        });
        setShowConfetti(true);
        playNotification('sound3'); // Play a special sound for completion
        setActiveModal('route-summary');
        setTimeout(() => setShowConfetti(false), 5000);
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
        const stop = stops.find(s => s.id === stopId);
        if (stop) {
            setActiveStop(stop);
            setMapCenter({ lat: stop.lat, lng: stop.lng });
            setActiveModal('marker-actions');
        }
    };

    const handleMapClick = (coords?: { lat: number; lng: number }) => {
        // Nada ocurre al clickar el mapa para evitar confusiones con la creación de puntos
    };



    const handleReorder = (newStops: any[]) => {
        const updated = newStops.map((s, i) => ({ ...s, order: i + 1 }));
        setStops(updated);
    };

    const currentStop = stops.find(s => s.isCurrent);
    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    const vehicleOptions = [
        { type: 'truck' as VehicleType, icon: Truck, label: 'Trailer' },
        { type: 'van' as VehicleType, icon: Car, label: 'Van' },
        { type: 'car' as VehicleType, icon: Car, label: 'Auto' },
        { type: 'pickup' as VehicleType, icon: Car, label: 'Pickup' },
        { type: 'motorcycle' as VehicleType, icon: Car, label: 'Moto' },
        { type: 'ufo' as VehicleType, icon: Car, label: '🛸 OVNI' },
    ];

    return (
        <div className="flex h-screen bg-darker text-foreground overflow-hidden font-sans selection:bg-info/30">
            <PermissionGuard />
            <SOSButton
                driverName={session?.user?.name || undefined}
                currentPos={userCoords || undefined}
            />
            {/* Sidebar with enhanced dark style */}
            <aside className="hidden lg:flex w-80 flex-col bg-darker border-r border-white/5 z-50 shadow-[20px_0_100px_rgba(0,0,0,0.5)] overflow-hidden">
                {/* Fixed Header */}
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

                            <div className="pt-2 space-y-2 border-t border-white/5 mt-2 pt-4">
                                <button
                                    onClick={handleReverseRoute}
                                    disabled={stops.length < 2}
                                    className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/5 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-20 disabled:cursor-not-allowed group"
                                >
                                    <RefreshCw className="w-3 h-3 group-hover:rotate-180 transition-all duration-500" />
                                    Invertir Ruta
                                </button>
                                <p className="text-[8px] text-white/20 italic">Útil para cambiar el sentido de las entregas ante tráfico.</p>
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
                                        <div className="text-3xl mb-2 group-hover:scale-125 transition-transform duration-500">
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

                    {/* Premium Upsell Card */}
                    {!isPro && (
                        <div className="p-6 bg-gradient-to-br from-info/10 to-blue-600/5 rounded-[32px] border border-info/20 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Crown className="w-12 h-12 text-info" />
                            </div>
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
                            className="absolute top-10 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 bg-darker/95 border border-info/20 rounded-[28px] shadow-[0_50px_100px_rgba(0,0,0,0.8)] backdrop-blur-3xl flex items-center gap-4"
                        >
                            <div className="w-2 h-2 rounded-full bg-info animate-ping" />
                            <p className="text-white text-[11px] font-black uppercase tracking-[0.2em]">{notification}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Mobile Header - Cleaner */}
                <header className="lg:hidden bg-darker/80 backdrop-blur-2xl py-4 px-6 shadow-2xl z-40 flex justify-between items-center border-b border-white/5">
                    <Link href="/pricing" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <div className="relative">
                            <div className="absolute inset-0 bg-info/20 blur-xl rounded-full" />
                            <div className="relative w-8 h-8 bg-dark/40 border border-info/30 rounded-full flex items-center justify-center p-1.5 backdrop-blur-md">
                                <img src="/LogoHormiruta.png" alt="Logo" className="w-full h-full object-contain" />
                            </div>
                        </div>
                        <h1 className="text-lg font-black tracking-tighter text-white italic">HORMIRUTA</h1>
                    </Link>
                    <span className="text-[10px] bg-info/10 text-info border border-info/20 px-2 py-0.5 rounded-full font-black">V2.0</span>
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
                        <NavMap
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
                            onMarkerDragEnd={handleMarkerDragEnd}
                            theme={mapTheme}
                            center={mapCenter}
                            origin={originPoint}
                            returnToStart={returnToStart}
                            onUserVehicleClick={() => setIsVehicleSelectorOpen(true)}
                        />

                        {/* Map-based Vehicle Selector Carousel */}
                        <AnimatePresence>
                            {isVehicleSelectorOpen && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.8, y: 20 }}
                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] p-6 bg-darker/90 backdrop-blur-2xl border border-info/30 rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,0.8)] min-w-[300px]"
                                >
                                    <div className="flex flex-col items-center gap-6">
                                        <div className="text-center">
                                            <p className="text-[10px] font-black text-info uppercase tracking-[0.3em] mb-1">Unidad de Transporte</p>
                                            <h3 className="text-lg font-black text-white italic tracking-tighter uppercase">Cambiar Vehículo</h3>
                                        </div>

                                        <div className="flex gap-4 p-2 overflow-x-auto no-scrollbar max-w-[280px]">
                                            {vehicleOptions.map((opt) => (
                                                <button
                                                    key={opt.type}
                                                    onClick={() => {
                                                        setVehicleType(opt.type);
                                                        setIsVehicleSelectorOpen(false);
                                                        setNotification(`Vehículo actualizado: ${opt.label}`);
                                                        playNotification('sound1');
                                                    }}
                                                    className={cn(
                                                        "flex-shrink-0 w-16 h-20 flex flex-col items-center justify-center rounded-[20px] transition-all duration-300 border-2",
                                                        vehicleType === opt.type
                                                            ? "bg-info/20 text-info border-info scale-110 shadow-lg"
                                                            : "bg-white/5 text-white/30 border-transparent hover:bg-white/10"
                                                    )}
                                                >
                                                    <span className="text-3xl mb-1">{opt.type === 'truck' && '🚛'}
                                                        {opt.type === 'van' && '🚐'}
                                                        {opt.type === 'car' && '🚗'}
                                                        {opt.type === 'pickup' && '🛻'}
                                                        {opt.type === 'motorcycle' && '🏍️'}
                                                        {opt.type === 'ufo' && '🛸'}
                                                    </span>
                                                    <span className="text-[8px] font-black uppercase text-center">{opt.label.split(' ')[0]}</span>
                                                </button>
                                            ))}
                                        </div>

                                        <button
                                            onClick={() => setIsVehicleSelectorOpen(false)}
                                            className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white/40 text-[9px] font-black uppercase tracking-widest rounded-full transition-all"
                                        >
                                            Cancelar
                                        </button>
                                    </div>

                                    {/* Decorative light effect */}
                                    <div className="absolute inset-0 bg-info/5 rounded-[40px] pointer-events-none" />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Map Controls Overlay */}
                        <div className="absolute top-20 lg:top-8 left-4 lg:left-6 z-10 flex flex-col gap-3 transition-all">
                            <button
                                onClick={() => setShowTraffic(!showTraffic)}
                                className={cn(
                                    "flex items-center gap-2 px-3 lg:px-5 py-2 lg:py-2.5 rounded-xl lg:rounded-2xl border border-white/10 shadow-2xl backdrop-blur-2xl transition-all w-fit",
                                    showTraffic ? "bg-info/20 text-info border-info/40" : "bg-black/60 text-white/40 hover:bg-black/80"
                                )}
                            >
                                <div className={cn("w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full", showTraffic ? "bg-info animate-pulse" : "bg-white/20")} />
                                <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest">Tráfico</span>
                            </button>

                            <button
                                onClick={() => setReturnToStart(!returnToStart)}
                                className={cn(
                                    "flex items-center gap-2 px-3 lg:px-5 py-2 lg:py-2.5 rounded-xl lg:rounded-2xl border border-white/10 shadow-2xl backdrop-blur-2xl transition-all w-fit",
                                    returnToStart ? "bg-info/20 text-info border-info/40 shadow-[0_0_20px_rgba(49,204,236,0.2)]" : "bg-black/60 text-white/40 hover:bg-black/80"
                                )}
                            >
                                <RefreshCw className={cn("w-3 h-3 lg:w-4 lg:h-4", returnToStart && "animate-spin-slow")} />
                                <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest">Modo Circuito</span>
                            </button>

                            {navigationTargetId && (
                                <button
                                    onClick={() => {
                                        setNavigationTargetId(null);
                                        setNotification('Vista de ruta completa restaurada');
                                    }}
                                    className="flex items-center gap-2 px-3 lg:px-5 py-2 lg:py-2.5 rounded-xl lg:rounded-2xl border border-white/10 shadow-2xl backdrop-blur-2xl bg-black/80 text-info hover:bg-black hover:scale-105 transition-all w-fit group"
                                >
                                    <List className="w-3 h-3 group-hover:rotate-12 transition-transform" />
                                    <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest">Ver Ruta Completa</span>
                                </button>
                            )}
                        </div>

                        {/* Desktop Floating Add Button */}
                        <div className="hidden lg:flex absolute bottom-10 right-10 z-30">
                            <button
                                onClick={() => setActiveModal('add-stop')}
                                className="w-20 h-20 bg-info rounded-3xl shadow-[0_20px_50px_rgba(49,204,236,0.5)] flex items-center justify-center text-dark hover:scale-110 active:scale-90 transition-all border-4 border-[#0a0a0a] group relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                <Plus className="w-10 h-10 relative z-10 group-hover:rotate-90 transition-transform duration-500" />
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
                                className="absolute inset-0 lg:left-auto lg:w-[450px] z-20 bg-black/95 backdrop-blur-[100px] p-5 lg:p-8 overflow-y-auto border-l border-white/5 touch-none"
                            >
                                {/* Sidebar Drag Handle (Left vertical line) */}
                                <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-12 bg-white/10 rounded-full lg:hidden" />

                                <div className="flex justify-between items-start mb-12">
                                    <div className="mt-2">
                                        <div className="flex items-center gap-3 mb-1">
                                            <div className="w-1 h-4 bg-info rounded-full" />
                                            <p className="text-[10px] text-info font-black uppercase tracking-[0.4em]">Sesión de {session?.user?.name || 'Comandante'}</p>
                                        </div>
                                        <h2 className="text-4xl font-black text-white italic tracking-tighter">¡Hola, {session?.user?.name?.split(' ')[0] || 'Conductor'}!</h2>
                                        <div className="flex gap-2 mt-3">
                                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] bg-white/5 px-2 py-1 rounded-md inline-block">
                                                {stops.filter(s => !s.isCompleted).length} Paradas en cola
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
                                    onNavigate={(stop: any) => {
                                        setActiveStop(stop);
                                        setActiveModal('navigation-choice');
                                        setIsGpsActive(true);
                                        setMapCenter({ lat: stop.lat, lng: stop.lng } as any);
                                        setViewMode('map');
                                        setNotification(`Selecciona Navegador para ${stop.address || 'destino'}`);
                                    }}
                                    onEdit={(stop: any) => {
                                        setActiveStop(stop);
                                        setActiveModal('edit-stop');
                                    }}
                                    onComplete={handleCompleteStop}
                                    onDuplicate={handleDuplicateStop}
                                    onRemove={handleRemoveStop}
                                    onRevert={handleRevertStop}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Persistent Optimize / Reset Buttons */}
                    <div className="absolute bottom-32 left-0 right-0 z-40 flex items-center justify-center gap-4 px-6 pointer-events-none">
                        <div className="flex items-center gap-3 pointer-events-auto">
                            {/* BOTÓN OPTIMIZAR */}
                            <button
                                onClick={() => optimizeRoute()}
                                disabled={isOptimizing || stops.length < 2}
                                className={cn(
                                    "relative group flex flex-col items-center justify-center gap-2 p-3 min-w-[95px] h-24 bg-darker text-info font-black rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-info/20 transition-all duration-500 active:scale-95 disabled:opacity-50",
                                    isOptimizing && "ring-4 ring-info/20"
                                )}
                            >
                                <div className={cn(
                                    "w-10 h-10 rounded-full bg-info flex items-center justify-center shadow-[0_0_20px_rgba(49,204,236,0.2)] transition-transform duration-700",
                                    isOptimizing && "animate-spin"
                                )}>
                                    <img src="/LogoHormiruta.png" alt="Opt" className="w-6 h-6 object-contain" />
                                </div>
                                <span className="text-[9px] italic font-black uppercase tracking-widest leading-none">
                                    {isOptimizing ? 'Procesando' : 'Optimizar'}
                                </span>
                                <div className="absolute inset-0 rounded-[32px] border border-white/5 pointer-events-none group-hover:scale-105 transition-transform" />
                            </button>

                            {/* BOTÓN IR (NAVEGACIÓN) */}
                            <button
                                onClick={handleQuickNavigation}
                                className="relative group flex flex-col items-center justify-center gap-2 p-3 min-w-[95px] h-24 bg-info text-dark font-black rounded-[32px] shadow-[0_20px_60px_rgba(49,204,236,0.3)] border border-white/20 transition-all duration-500 active:scale-95"
                            >
                                <div className="w-10 h-10 rounded-full bg-darker flex items-center justify-center shadow-inner transition-transform duration-700 group-hover:scale-110">
                                    <Navigation className="w-5 h-5 text-info fill-info group-hover:animate-pulse" />
                                </div>
                                <span className="text-[9px] italic font-black uppercase tracking-widest leading-none">
                                    Ir Ahora
                                </span>
                                <div className="absolute inset-0 rounded-[32px] border border-white/10 pointer-events-none group-hover:scale-105 transition-transform" />
                            </button>
                        </div>

                        {stops.length > 0 && stops.every(s => s.isCompleted || s.isFailed) && (
                            <button
                                onClick={handleFinishRoute}
                                className="pointer-events-auto flex items-center gap-3 px-8 py-5 bg-green-500 text-dark font-black text-sm rounded-full shadow-[0_20px_40px_rgba(34,197,94,0.3)] transition-all animate-bounce hover:scale-105"
                            >
                                <CheckCircle className="w-5 h-5" />
                                FINALIZAR
                            </button>
                        )}
                    </div>

                    {/* Optimized Bottom Bar */}
                    <nav className="absolute bottom-6 left-6 right-6 h-20 bg-darker/90 backdrop-blur-3xl rounded-[32px] border border-white/10 flex items-center justify-between px-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-50 lg:hidden font-sans">

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
                            className="w-16 h-16 -mt-10 bg-info rounded-2xl shadow-[0_15px_40px_rgba(49,204,236,0.4)] flex items-center justify-center text-dark hover:scale-110 active:scale-90 transition-all border-4 border-darker"
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
                            className="absolute inset-0 z-[100] bg-darker/90 backdrop-blur-[80px] flex items-center justify-center p-8"
                        >
                            <motion.div
                                initial={{ scale: 0.95, y: 100, opacity: 0 }}
                                animate={{ scale: 1, y: 0, opacity: 1 }}
                                exit={{ scale: 0.95, y: 100, opacity: 0 }}
                                className="w-full max-w-sm bg-darker border border-white/5 rounded-[40px] shadow-[0_50px_200px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col max-h-[85vh]"
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
                                            <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">
                                                {activeModal === 'edit-stop' ? 'Ajustar Punto' :
                                                    activeModal === 'add-stop' ? 'Nueva Parada' :
                                                        activeModal === 'settings' ? 'Configuración' :
                                                            activeModal === 'profile' ? 'Mi Perfil' :
                                                                activeModal === 'save-route' ? 'Guardar Ruta' :
                                                                    activeModal === 'saved-routes' ? 'Mis Rutas' :
                                                                        activeModal === 'bulk-import' ? 'Carga Masiva' :
                                                                            activeModal === 'route-summary' ? 'Resumen' : 'Hormiruta'}
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
                                            onOptimize={handleAddAndOptimize}
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
                                        <div className="flex flex-col text-center">
                                            {/* Header con Video Integrado */}
                                            <div className="relative h-64 bg-white rounded-t-[40px] overflow-hidden -mt-8 -mx-8 mb-8 border-b border-white/10 shadow-inner">
                                                {showConfetti && (
                                                    <div className="absolute inset-0 pointer-events-none z-[60] overflow-hidden">
                                                        {[...Array(40)].map((_, i) => (
                                                            <motion.div
                                                                key={i}
                                                                initial={{ y: -50, x: Math.random() * 400 - 200, opacity: 0, rotate: 0 }}
                                                                animate={{
                                                                    y: 400,
                                                                    x: Math.random() * 400 - 200,
                                                                    opacity: [0, 1, 1, 0],
                                                                    rotate: 360 * (Math.random() > 0.5 ? 1 : -1)
                                                                }}
                                                                transition={{
                                                                    duration: 2 + Math.random() * 2,
                                                                    repeat: Infinity,
                                                                    ease: "linear",
                                                                    delay: Math.random() * 1.5
                                                                }}
                                                                className="absolute left-1/2 text-2xl"
                                                            >
                                                                {['🐜', '🚩', '✨', '🐜', '🎊'][i % 5]}
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                )}

                                                <video
                                                    autoPlay
                                                    loop
                                                    muted
                                                    playsInline
                                                    className="w-full h-full object-contain scale-110"
                                                    style={{
                                                        mixBlendMode: 'multiply',
                                                        filter: 'contrast(1.7) brightness(1.3)'
                                                    }}
                                                >
                                                    <source src="/hormigaBailandoanimado.mp4" type="video/mp4" />
                                                    Tu navegador no soporta el elemento de video.
                                                </video>
                                                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
                                            </div>

                                            <div className="px-4 pb-4 space-y-8">
                                                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                                                    <CheckCircle className="w-10 h-10 text-green-500" />
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: [0, 1.5, 1] }}
                                                        className="absolute inset-0 rounded-full border-2 border-green-500/30"
                                                    />
                                                </div>

                                                <div>
                                                    <h4 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">¡Misión Cumplida!</h4>
                                                    <p className="text-[10px] text-info font-black uppercase tracking-[0.4em] mt-2 italic">Ruta Ejecutada con Éxito</p>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                                        <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1 text-left">Resultados</p>
                                                        <div className="space-y-2 text-left">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-[9px] text-white/40 font-bold uppercase">Entregadas</span>
                                                                <span className="text-sm font-black text-green-500">{stops.filter(s => s.isCompleted).length}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-[9px] text-white/40 font-bold uppercase">Fallidas</span>
                                                                <span className="text-sm font-black text-red-500">{stops.filter(s => s.isFailed).length}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col justify-center">
                                                        <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1 text-left">Efectividad</p>
                                                        <p className="text-3xl font-black text-info text-left tracking-tighter">
                                                            {Math.round((stops.filter(s => s.isCompleted).length / (stops.length || 1)) * 100)}%
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-3 pt-4">
                                                <button
                                                    onClick={confirmFinish}
                                                    className="w-full py-5 bg-info text-dark rounded-3xl text-sm font-black uppercase tracking-widest shadow-[0_20px_40px_rgba(49,204,236,0.3)] hover:scale-[1.02] transition-all"
                                                >
                                                    Finalizar y Cerrar
                                                </button>
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => {
                                                            const newStops = stops.map(s => ({ ...s, id: Math.random().toString(36).substr(2, 9), isCompleted: false, isFailed: false, isCurrent: false }));
                                                            setStops(newStops);
                                                            setActiveModal(null);
                                                            setNotification('Paradas copiadas a nueva ruta');
                                                        }}
                                                        className="flex-1 py-4 bg-white/5 text-white/60 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-white/5 hover:bg-white/10 transition-all"
                                                    >
                                                        Copiar paradas
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setStops([]);
                                                            setActiveModal(null);
                                                            setNotification('Iniciando nueva ruta limpia');
                                                        }}
                                                        className="flex-1 py-4 bg-white/5 text-white/60 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-white/5 hover:bg-white/10 transition-all"
                                                    >
                                                        Nueva Ruta
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : activeModal === 'profile' ? (
                                        <div className="space-y-10 py-4">
                                            <div className="flex flex-col items-center text-center">
                                                <div className="relative mb-6">
                                                    <div className="absolute inset-0 bg-info/20 blur-2xl rounded-full" />
                                                    <div className="relative w-32 h-32 bg-black/40 border-4 border-info/30 rounded-full flex items-center justify-center p-2 backdrop-blur-xl shadow-2xl group">
                                                        {session?.user?.image ? (
                                                            <img src={session.user.image} alt="User" className="w-full h-full rounded-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full rounded-full bg-info/10 flex items-center justify-center">
                                                                <User className="w-16 h-16 text-info/40" />
                                                            </div>
                                                        )}
                                                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-info text-dark rounded-full flex items-center justify-center border-4 border-black shadow-lg">
                                                            <Shield className="w-5 h-5" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <h4 className="text-3xl font-black text-white italic tracking-tighter uppercase">{session?.user?.name || 'Comandante'}</h4>
                                                <p className="text-[10px] text-info font-black uppercase tracking-[0.4em] mt-2 italic shadow-sm">Operador de {vehicleOptions.find(opt => opt.type === vehicleType)?.label || 'Logística'}</p>
                                            </div>

                                            <div className="flex flex-col gap-6">
                                                <div className="bg-white/5 p-6 rounded-[32px] border border-white/5 space-y-6 relative overflow-hidden group">
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-info/5 blur-3xl rounded-full -mr-16 -mt-16 transition-all group-hover:bg-info/10" />

                                                    <div className="flex items-center gap-5 border-b border-white/5 pb-6">
                                                        <div className="w-12 h-12 bg-info/10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-info/5">
                                                            <Fingerprint className="w-6 h-6 text-info" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Identificador de Operador</p>
                                                            <p className="text-sm font-black text-white italic truncate tracking-tight">OPERADOR·HR·{(session?.user as any)?.id?.substring(0, 6).toUpperCase() || 'ALPHA-01'}</p>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="bg-black/40 px-4 py-3 rounded-2xl border border-white/5">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <Truck className="w-3.5 h-3.5 text-info/40" />
                                                                <span className="text-[9px] font-bold text-white/30 uppercase tracking-tighter">Vehículo</span>
                                                            </div>
                                                            <span className="text-[10px] font-black text-white uppercase italic truncate block">{vehicleOptions.find(opt => opt.type === vehicleType)?.label.split(' ')[0] || 'Base'}</span>
                                                        </div>
                                                        <div className="bg-black/40 px-4 py-3 rounded-2xl border border-white/5">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <Shield className="w-3.5 h-3.5 text-info/40" />
                                                                <span className="text-[9px] font-bold text-white/30 uppercase tracking-tighter">Estatus</span>
                                                            </div>
                                                            <span className="text-[10px] font-black text-green-500 uppercase italic">Verificado</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-white/5 p-6 rounded-[32px] border border-white/5 space-y-6">
                                                    <div className="flex items-center gap-5 border-b border-white/5 pb-6">
                                                        <div className="w-12 h-12 bg-info/10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-info/5">
                                                            <FileText className="w-6 h-6 text-info" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Cuenta de Enlace</p>
                                                            <p className="text-sm font-black text-white italic truncate tracking-tight">{session?.user?.email}</p>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={handleLogout}
                                                        className="w-full py-5 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-4 group/btn shadow-lg hover:shadow-red-500/20"
                                                    >
                                                        <LogOut className="w-4 h-4 transition-transform group-hover/btn:-translate-x-1" />
                                                        Cerrar Sesión Activa
                                                    </button>
                                                </div>

                                                <div
                                                    onClick={() => setActiveModal('saved-routes')}
                                                    className="bg-gradient-to-br from-info/20 via-info/5 to-transparent p-6 rounded-[40px] border border-info/10 flex items-center justify-between group cursor-pointer hover:border-info/30 transition-all"
                                                >
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-14 h-14 bg-black/60 rounded-2xl flex items-center justify-center border border-info/20 shadow-xl group-hover:scale-110 transition-transform">
                                                            <History className="w-7 h-7 text-info" />
                                                        </div>
                                                        <div>
                                                            <h5 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Historial de Rutas</h5>
                                                            <p className="text-sm font-black text-info italic tracking-tighter whitespace-nowrap uppercase">Ver mis rutas guardadas</p>
                                                        </div>
                                                    </div>
                                                    <div className="w-10 h-10 bg-info text-dark rounded-full flex items-center justify-center shadow-xl group-hover:translate-x-1 transition-all">
                                                        <ChevronRight className="w-6 h-6" />
                                                    </div>
                                                </div>

                                                <div className="pt-4 pb-8">
                                                    <div className="flex items-center gap-3 mb-6 px-1">
                                                        <div className="h-[1px] flex-1 bg-white/5" />
                                                        <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Protocolos de Seguridad</span>
                                                        <div className="h-[1px] flex-1 bg-white/5" />
                                                    </div>
                                                    <SOSConfig />
                                                </div>
                                            </div>
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

                                            </div>

                                            <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                                                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Navegador Predeterminado</p>
                                                <div className="flex bg-black/50 p-1 rounded-2xl border border-white/5">
                                                    <button
                                                        onClick={() => {
                                                            setPreferredMapApp('google');
                                                            setNotification('Google Maps seleccionado');
                                                        }}
                                                        className={cn(
                                                            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all",
                                                            preferredMapApp === 'google' ? "bg-[#4285F4] text-white shadow-lg" : "text-white/40 hover:text-white"
                                                        )}
                                                    >
                                                        <span className="text-[10px] font-bold uppercase">Google Maps</span>
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setPreferredMapApp('waze');
                                                            setNotification('Waze seleccionado');
                                                        }}
                                                        className={cn(
                                                            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all",
                                                            preferredMapApp === 'waze' ? "bg-[#33CCFF] text-white shadow-lg" : "text-white/40 hover:text-white"
                                                        )}
                                                    >
                                                        <span className="text-[10px] font-bold uppercase">Waze</span>
                                                    </button>
                                                </div>
                                            </div>

                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center justify-between p-5 bg-red-500/5 hover:bg-red-500/10 rounded-2xl border border-red-500/10 transition-all group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <LogOut className="w-5 h-5 text-red-500/40 group-hover:text-red-500 transition-colors" />
                                                    <span className="text-sm font-bold text-red-500/80 group-hover:text-red-500 transition-colors">Cerrar Sesión</span>
                                                </div>
                                                <div className="text-[10px] font-black text-red-500/20 group-hover:text-red-500/50 uppercase tracking-widest transition-colors">Salir</div>
                                            </button>

                                            <p className="text-[8px] text-white/20 italic text-center">
                                                © {new Date().getFullYear()} Jandosoft. Todos los derechos reservados.
                                            </p>


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

                {/* Modal de Selección de Navegador (NUEVO) */}
                <AnimatePresence>
                    {activeModal === 'navigation-choice' && activeStop && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setActiveModal(null)}
                                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                            />

                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="relative w-full max-w-[450px] bg-[#0A0F1A]/95 backdrop-blur-3xl border border-white/10 rounded-[40px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)] p-8 overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-info via-blue-500 to-info" />

                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">Iniciar Navegación</h3>
                                        <p className="text-[10px] text-info font-black uppercase tracking-widest mt-1 opacity-60">Selecciona tu aplicación preferida</p>
                                    </div>
                                    <button
                                        onClick={() => setActiveModal(null)}
                                        className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors"
                                    >
                                        <X className="w-5 h-5 text-white/40" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-5 bg-white/5 rounded-3xl border border-white/5 flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 bg-info/20 rounded-2xl flex items-center justify-center">
                                            <MapPin className="w-6 h-6 text-info" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Destino</p>
                                            <p className="text-sm font-bold text-white line-clamp-1 truncate">{activeStop.address || 'Ubicación seleccionada'}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <button
                                            onClick={() => {
                                                openInGoogleMaps(activeStop.lat, activeStop.lng);
                                                if (!preferredMapApp) setPreferredMapApp('google');
                                                setActiveModal(null);
                                            }}
                                            className="group relative flex items-center gap-5 p-6 bg-white/5 hover:bg-white/10 border border-white/5 rounded-[32px] transition-all hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            <div className="w-14 h-14 bg-[#4285F4]/20 rounded-2xl flex items-center justify-center group-hover:bg-[#4285F4]/30 transition-colors">
                                                <svg viewBox="0 0 24 24" className="w-8 h-8 fill-[#4285F4]">
                                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                                </svg>
                                            </div>
                                            <div className="text-left">
                                                <p className="text-lg font-black text-white italic tracking-tighter">GOOGLE MAPS</p>
                                                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Recomendado para tráfico</p>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-white/20 ml-auto group-hover:translate-x-1 transition-transform" />
                                        </button>

                                        <button
                                            onClick={() => {
                                                openInWaze(activeStop.lat, activeStop.lng);
                                                if (!preferredMapApp) setPreferredMapApp('waze');
                                                setActiveModal(null);
                                            }}
                                            className="group relative flex items-center gap-5 p-6 bg-white/5 hover:bg-white/10 border border-white/5 rounded-[32px] transition-all hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            <div className="w-14 h-14 bg-[#33CCFF]/20 rounded-2xl flex items-center justify-center group-hover:bg-[#33CCFF]/30 transition-colors">
                                                <svg viewBox="0 0 24 24" className="w-8 h-8 fill-[#33CCFF]">
                                                    <path d="M18.5 11c0-3-2.5-5.5-5.5-5.5S7.5 8 7.5 11h-1l-1 1.5 1 1.5h1c.1 2.9 2.5 5.2 5.4 5.2 2.1 0 3.9-1.2 4.8-2.9l1.6.4.6-1.9-1.6-.4c.1-.3.1-.6.1-.9zm-7 3.5c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5zm4 0c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5z" />
                                                </svg>
                                            </div>
                                            <div className="text-left">
                                                <p className="text-lg font-black text-white italic tracking-tighter">WAZE</p>
                                                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Reportes en tiempo real</p>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-white/20 ml-auto group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {activeModal === 'marker-actions' && activeStop && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setActiveModal(null)}
                                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                            />

                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="relative w-full max-w-[420px] bg-dark/95 backdrop-blur-3xl border border-white/10 rounded-[48px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] overflow-hidden"
                            >
                                {/* Premium Header Background */}
                                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-info/20 to-transparent pointer-events-none" />
                                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-info via-blue-500 to-info" />

                                <div className="relative p-8 pt-10">
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="flex gap-5 items-center">
                                            <div className="relative group cursor-pointer">
                                                <div className="w-20 h-20 bg-black/40 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center border border-info/30 group-hover:border-info transition-all shadow-xl group-active:scale-95 overflow-hidden">
                                                    <img src="/ant-logo.png" alt="Logo" className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-40 transition-opacity" />
                                                    <span className="relative z-10 text-3xl font-black text-info italic leading-none">{activeStop.order}</span>
                                                    <span className="relative z-10 text-[7px] font-black text-info/50 uppercase tracking-widest mt-1">NÚM</span>
                                                </div>
                                                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-info text-dark rounded-full flex items-center justify-center shadow-lg border-2 border-darker">
                                                    <RotateCw className="w-4 h-4 text-dark font-bold" />
                                                </div>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase truncate leading-tight">{activeStop.address}</h3>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <div className={cn(
                                                        "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border",
                                                        activeStop.isCompleted ? "bg-green-500/10 text-green-500 border-green-500/20" :
                                                            activeStop.isFailed ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                                                "bg-info/10 text-info border-info/20"
                                                    )}>
                                                        {activeStop.isCompleted ? 'Entrega Exitosa' : activeStop.isFailed ? 'Entrega Fallida' : 'En Ruta'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setActiveModal(null)}
                                            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors shrink-0"
                                        >
                                            <X className="w-5 h-5 text-white/40" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-8">
                                        <div className="p-4 bg-white/5 rounded-3xl border border-white/5">
                                            <div className="flex items-center gap-2 mb-1.5 opacity-30">
                                                <User className="w-3 h-3 text-info" />
                                                <span className="text-[8px] font-black uppercase tracking-widest">Cliente</span>
                                            </div>
                                            <p className="text-xs font-bold text-white truncate">{activeStop.customerName || 'No especificado'}</p>
                                        </div>
                                        <div className="p-4 bg-white/5 rounded-3xl border border-white/5">
                                            <div className="flex items-center gap-2 mb-1.5 opacity-30">
                                                <History className="w-3 h-3 text-info" />
                                                <span className="text-[8px] font-black uppercase tracking-widest">Horario</span>
                                            </div>
                                            <p className="text-xs font-bold text-white truncate">{activeStop.timeWindow || 'Cualquier hora'}</p>
                                        </div>
                                        <div className="p-4 bg-white/5 rounded-3xl border border-white/5">
                                            <div className="flex items-center gap-2 mb-1.5 opacity-30">
                                                <Truck className="w-3 h-3 text-info" />
                                                <span className="text-[8px] font-black uppercase tracking-widest">Placas</span>
                                            </div>
                                            <p className="text-xs font-bold text-white truncate">{activeStop.licensePlate || 'N/A'}</p>
                                        </div>
                                        <div className="p-4 bg-white/5 rounded-3xl border border-white/5">
                                            <div className="flex items-center gap-2 mb-1.5 opacity-30">
                                                <Package className="w-3 h-3 text-info" />
                                                <span className="text-[8px] font-black uppercase tracking-widest">Cuadros</span>
                                            </div>
                                            <p className="text-xs font-bold text-white truncate">{activeStop.boxes || '0'}</p>
                                        </div>
                                        {activeStop.notes && (
                                            <div className="col-span-2 p-4 bg-white/5 rounded-3xl border border-white/5">
                                                <div className="flex items-center gap-2 mb-1.5 opacity-30">
                                                    <FileText className="w-3 h-3 text-info" />
                                                    <span className="text-[8px] font-black uppercase tracking-widest">Instrucciones Especiales</span>
                                                </div>
                                                <p className="text-[10px] font-medium text-white/60 italic leading-relaxed">{activeStop.notes}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        {/* Action buttons with premium style */}
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => { handleQuickNavigation(); setActiveModal(null); }}
                                                className="flex-1 flex flex-col items-center justify-center gap-2 p-6 bg-info text-dark rounded-[36px] font-black uppercase tracking-widest shadow-2xl shadow-info/20 active:scale-95 transition-all group"
                                            >
                                                <div className="w-10 h-10 bg-black/10 rounded-2xl flex items-center justify-center group-hover:bg-black/20 transition-colors">
                                                    <Navigation className="w-5 h-5" />
                                                </div>
                                                <span className="text-[10px]">Iniciar Ruta</span>
                                            </button>

                                            <div className="flex-1 grid grid-cols-1 gap-3">
                                                <button
                                                    onClick={() => { handleCompleteStop(activeStop.id, false); setActiveModal(null); }}
                                                    disabled={activeStop.isCompleted || activeStop.isFailed}
                                                    className={cn(
                                                        "flex items-center gap-3 p-4 rounded-[28px] transition-all active:scale-95 border",
                                                        activeStop.isCompleted || activeStop.isFailed
                                                            ? "bg-white/5 text-white/10 border-white/5"
                                                            : "bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500 hover:text-white"
                                                    )}
                                                >
                                                    <CheckCircle className="w-5 h-5 transition-transform" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Éxito</span>
                                                </button>

                                                <button
                                                    onClick={() => { handleCompleteStop(activeStop.id, true); setActiveModal(null); }}
                                                    disabled={activeStop.isCompleted || activeStop.isFailed}
                                                    className={cn(
                                                        "flex items-center gap-3 p-4 rounded-[28px] transition-all active:scale-95 border",
                                                        activeStop.isCompleted || activeStop.isFailed
                                                            ? "bg-white/5 text-white/10 border-white/5"
                                                            : "bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white"
                                                    )}
                                                >
                                                    <XCircle className="w-5 h-5 transition-transform" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Fallo</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Swap positions submenu */}
                                        <div className="bg-white/5 border border-white/5 rounded-[40px] p-6 space-y-4">
                                            <div className="flex items-center justify-between px-2">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-white italic tracking-tight uppercase">Intercambiar Posición</span>
                                                    <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Cambiar Turno de Entrega</span>
                                                </div>
                                                <div className="w-10 h-10 bg-info/10 rounded-2xl flex items-center justify-center border border-info/20">
                                                    <RotateCw className="w-4 h-4 text-info animate-spin-slow" />
                                                </div>
                                            </div>
                                            <div
                                                ref={swapScrollRef}
                                                className="flex gap-7 overflow-x-auto pb-6 px-4 custom-scrollbar scroll-smooth"
                                            >
                                                {stops.map(s => {
                                                    const isSelected = s.id === activeStop.id;
                                                    // Colores dinámicos: Naranja (Actual), Verde (Completado), Rojo (Fallido), Azul (Pendiente)
                                                    const basePinColor = isSelected ? '#f97316' :
                                                        s.isCompleted ? '#22c55e' :
                                                            s.isFailed ? '#ef4444' : '#3b82f6';

                                                    return (
                                                        <button
                                                            key={s.id}
                                                            disabled={isSelected}
                                                            data-active-stop={isSelected ? "true" : "false"}
                                                            onClick={() => handleSwapOrder(activeStop.id, s.order)}
                                                            className={cn(
                                                                "flex flex-col items-center gap-3 shrink-0 transition-all duration-300 group/item relative",
                                                                isSelected ? "scale-125 z-20 mx-2" : "opacity-40 hover:opacity-100 hover:scale-110 z-10"
                                                            )}
                                                        >
                                                            <div className="relative">
                                                                <svg width="48" height="58" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg" className={cn(
                                                                    "drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-all duration-300",
                                                                    isSelected ? "scale-110" : "group-hover/item:fill-[#22c55e] group-active/item:scale-95"
                                                                )}>
                                                                    <path
                                                                        d="M 20 2 C 28 2 35 9 35 17 C 35 30 20 48 20 48 C 20 48 5 30 5 17 C 5 9 12 2 20 2 Z"
                                                                        fill={basePinColor}
                                                                        stroke="white"
                                                                        strokeWidth="2.5"
                                                                        className={cn("transition-colors duration-300", !isSelected && "group-hover/item:fill-[#22c55e]")}
                                                                    />
                                                                    <circle cx="20" cy="18" r="11" fill="white" />
                                                                    <text
                                                                        x="20" y={s.isCompleted || s.isFailed ? "22" : "25"}
                                                                        fontSize={s.isCompleted || s.isFailed ? "22" : "15"}
                                                                        fontWeight="1000"
                                                                        textAnchor="middle"
                                                                        fill={basePinColor}
                                                                        className={cn("select-none transition-all duration-300", !isSelected && "group-hover/item:fill-[#22c55e]")}
                                                                    >
                                                                        {s.isCompleted ? '✓' : s.isFailed ? '✕' : s.order}
                                                                    </text>
                                                                </svg>
                                                                {/* Indicador de número persistente cuando hay estado */}
                                                                {!isSelected && (s.isCompleted || s.isFailed) && (
                                                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-darker rounded-full border border-white/20 flex items-center justify-center shadow-lg">
                                                                        <span className="text-[8px] font-black text-white">{s.order}</span>
                                                                    </div>
                                                                )}
                                                                {isSelected && (
                                                                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#f97316] rounded-full border-2 border-darker shadow-[0_0_20px_rgba(249,115,22,0.6)] animate-pulse flex items-center justify-center">
                                                                        <div className="w-2 h-2 bg-dark rounded-full" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col items-center min-h-[30px] justify-center">
                                                                <span className={cn(
                                                                    "text-[10px] font-black uppercase tracking-tighter leading-none transition-colors duration-300",
                                                                    isSelected ? "text-[#f97316]" : "text-white/40 group-hover/item:text-[#22c55e]"
                                                                )}>
                                                                    {isSelected ? 'ORIGEN' : (
                                                                        <>
                                                                            <span className="group-hover/item:hidden">MOVER AL</span>
                                                                            <span className="hidden group-hover/item:inline-block animate-bounce-subtle">🚀 AQUÍ</span>
                                                                        </>
                                                                    )}
                                                                </span>
                                                                <span className={cn(
                                                                    "text-[12px] font-black italic mt-0.5 transition-colors duration-300",
                                                                    isSelected ? "text-[#f97316]" : "text-white/60 group-hover/item:text-[#22c55e]"
                                                                )}>#{s.order}</span>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between px-4 pt-2">
                                            {(activeStop.isCompleted || activeStop.isFailed) && (
                                                <button
                                                    onClick={() => { handleRevertStop(activeStop.id); setActiveModal(null); }}
                                                    className="flex items-center gap-2 p-3 text-[9px] font-black text-white/30 hover:text-info uppercase tracking-widest transition-colors active:scale-95"
                                                >
                                                    <RefreshCw className="w-3.5 h-3.5" />
                                                    Deshacer Estado
                                                </button>
                                            )}
                                            <button
                                                onClick={() => { handleRemoveStop(activeStop.id); setActiveModal(null); }}
                                                className="flex items-center gap-2 p-3 text-[9px] font-black text-white/30 hover:text-red-500 uppercase tracking-widest transition-colors active:scale-95 ml-auto"
                                            >
                                                <XCircle className="w-3.5 h-3.5" />
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Modal de Bienvenida - Preferencia de Mapa */}
                <AnimatePresence>
                    {activeModal === 'welcome-map-preference' && (
                        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-darker/90 backdrop-blur-xl"
                            />

                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="relative w-full max-w-[450px] bg-dark border border-info/20 rounded-[40px] shadow-[0_50px_100px_-20px_rgba(49,204,236,0.2)] p-10 overflow-hidden text-center"
                            >
                                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-info via-blue-500 to-info" />

                                <div className="w-20 h-20 bg-info/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
                                    <MapIcon className="w-10 h-10 text-info" />
                                </div>

                                <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-4">¡Bienvenido a Hormiruta!</h3>
                                <p className="text-sm text-white/60 mb-10 leading-relaxed font-medium">Para una experiencia óptima, selecciona tu aplicación de navegación predeterminada. Podrás cambiarla luego en ajustes.</p>

                                <div className="grid grid-cols-1 gap-4">
                                    <button
                                        onClick={() => {
                                            setPreferredMapApp('google');
                                            setActiveModal(null);
                                            setNotification('Google Maps configurado como predeterminado');
                                        }}
                                        className="group flex items-center gap-5 p-6 bg-white/5 hover:bg-[#4285F4]/10 border border-white/5 hover:border-[#4285F4]/30 rounded-[32px] transition-all"
                                    >
                                        <div className="w-12 h-12 bg-[#4285F4]/20 rounded-2xl flex items-center justify-center">
                                            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-[#4285F4]">
                                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                            </svg>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-lg font-black text-white italic tracking-tighter">GOOGLE MAPS</p>
                                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-none">Precisión y Tráfico</p>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => {
                                            setPreferredMapApp('waze');
                                            setActiveModal(null);
                                            setNotification('Waze configurado como predeterminado');
                                        }}
                                        className="group flex items-center gap-5 p-6 bg-white/5 hover:bg-[#33CCFF]/10 border border-white/5 hover:border-[#33CCFF]/30 rounded-[32px] transition-all"
                                    >
                                        <div className="w-12 h-12 bg-[#33CCFF]/20 rounded-2xl flex items-center justify-center">
                                            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-[#33CCFF]">
                                                <path d="M18.5 11c0-3-2.5-5.5-5.5-5.5S7.5 8 7.5 11h-1l-1 1.5 1 1.5h1c.1 2.9 2.5 5.2 5.4 5.2 2.1 0 3.9-1.2 4.8-2.9l1.6.4.6-1.9-1.6-.4c.1-.3.1-.6.1-.9zm-7 3.5c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5zm4 0c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5z" />
                                            </svg>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-lg font-black text-white italic tracking-tighter">WAZE</p>
                                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-none">Reportes en Tiempo Real</p>
                                        </div>
                                    </button>
                                </div>
                            </motion.div>
                        </div>
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
                            className="absolute inset-0 z-[110] bg-darker/95 backdrop-blur-3xl lg:hidden flex flex-col"
                        >
                            <div className="flex justify-between items-center p-8 border-b border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-info/20 blur-xl rounded-full" />
                                        <div className="relative w-10 h-10 bg-dark/40 border border-info/30 rounded-full flex items-center justify-center p-2 backdrop-blur-md">
                                            <img src="/LogoHormiruta.png" alt="Logo" className="w-full h-full object-contain" />
                                        </div>
                                    </div>
                                    <h2 className="text-xl font-black text-white italic tracking-tighter">CENTRO DE CONTROL</h2>
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
                                                    {opt.type === 'ufo' && '🛸'}
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
                                            { icon: User, label: 'Mis Datos / Perfil', onClick: () => { setActiveModal('profile'); setIsMobileMenuOpen(false); } },
                                            { icon: List, label: 'Ver Itinerario', onClick: () => { setViewMode(viewMode === 'map' ? 'list' : 'map'); setIsMobileMenuOpen(false); } },
                                            { icon: Crosshair, label: 'Centrar Mapa en Mí', onClick: () => { handleRecenter(); setIsMobileMenuOpen(false); } },
                                            { icon: History, label: 'Mis Rutas Guardadas', onClick: () => { setActiveModal('saved-routes'); setIsMobileMenuOpen(false); } },
                                            { icon: Upload, label: 'Importar Excel/CSV', onClick: () => { setActiveModal('bulk-import'); setIsMobileMenuOpen(false); } },
                                            { icon: Save, label: 'Guardar Itinerario Actual', onClick: () => { setActiveModal('save-route'); setIsMobileMenuOpen(false); }, disabled: stops.length === 0 },
                                            { icon: SettingsIcon, label: 'Configuración', onClick: () => { setActiveModal('settings'); setIsMobileMenuOpen(false); } },
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
                                    onClick={handleLogout}
                                    className="w-full p-5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-[32px] font-black uppercase text-[10px] tracking-widest mb-6"
                                >
                                    Cerrar Sesión
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            {/* End of Main Content Container */}
        </div>
    );
}
