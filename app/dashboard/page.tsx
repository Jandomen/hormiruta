'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, CloudOff } from 'lucide-react';

// Components
import NavMap from '../components/NavMap';
import Timeline from '../components/Timeline';
import SOSButton from '../components/SOSButton';
import Sidebar from '../components/Sidebar';
import BottomSheet from '../components/BottomSheet';
import PermissionGuard from '../components/PermissionGuard';
import GeofenceAlertsManager from '../components/GeofenceAlertsManager';
import RevolverDashboard from '../components/RevolverDashboard';

// Refactored Components
import DashboardHeader from './components/DashboardHeader';
import DashboardControls from './components/DashboardControls';
import DashboardModals from './components/DashboardModals';
import NavigationMenu from './components/NavigationMenu';
import LoadingScreen from './components/LoadingScreen';

// Hooks
import { useDashboardSync } from './hooks/useDashboardSync';
import { useDashboardLocation } from './hooks/useDashboardLocation';
import { useDashboardRoute } from './hooks/useDashboardRoute';
import { useDashboardUI } from './hooks/useDashboardUI';

// Types & Utils
import { VehicleType, Stop } from './types';
import { cn } from '../lib/utils';

export default function Dashboard() {
    const { data: session, status, update } = useSession();
    const router = useRouter();

    // UI State Hook
    const {
        viewMode, setViewMode, isMobileMenuOpen, setIsMobileMenuOpen,
        activeModal, setActiveModal, modalStack, setModalStack,
        notification, setNotification, alertSound, setAlertSound,
        activeStop, setActiveStop, playNotification, handleOpenModal, handleBackAction
    } = useDashboardUI();

    // Basic Local States
    const [routeName, setRouteName] = useState('');
    const [routeDate, setRouteDate] = useState(new Date().toISOString().split('T')[0]);
    const [currentRouteId, setCurrentRouteId] = useState<string | null>(null);
    const [vehicleType, setVehicleType] = useState<VehicleType>('truck');
    const [preferredMapApp, setPreferredMapApp] = useState<'google' | 'waze' | null>(null);
    const [showTraffic, setShowTraffic] = useState(false);
    const [isGpsActive, setIsGpsActive] = useState(false);
    const [navigationTargetId, setNavigationTargetId] = useState<string | null>(null);
    const [mapTheme, setMapTheme] = useState<'light' | 'dark'>('dark');
    const [isVehicleSelectorOpen, setIsVehicleSelectorOpen] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [hasPlayedWelcome, setHasPlayedWelcome] = useState(false);
    
    const hasInitializedFromSession = useRef(false);
    const swapScrollRef = useRef<HTMLDivElement>(null);

    // Sync State Hook
    const { isOnline, statusBanner } = useDashboardSync(status, currentRouteId);

    // Plan logic
    const userPlan = (session?.user as any)?.plan || 'free';
    const subStatus = (session?.user as any)?.subscriptionStatus || 'none';
    const createdAt = (session?.user as any)?.createdAt;
    const isPro = subStatus === 'active' && userPlan !== 'free';

    const isTrialActive = useCallback(() => {
        if (subStatus === 'active') return true;
        if (subStatus === 'expired') return false;
        if (!createdAt) return true;
        const expiryDate = new Date(new Date(createdAt).getTime() + 7 * 24 * 60 * 60 * 1000);
        return new Date() < expiryDate;
    }, [subStatus, createdAt]);

    // Location Hook
    const {
        userCoords, setUserCoords, originPoint, setOriginPoint,
        mapCenter, setMapCenter, fleetDrivers, refreshOriginLocation
    } = useDashboardLocation(status, session, vehicleType, isGpsActive, setIsGpsActive, setNotification);

    // Route Hook
    const {
        stops, setStops, expenses, setExpenses, isOptimizing,
        returnToStart, setReturnToStart, handleAddStop, handleRemoveStop,
        handleUpdateStop, handleCompleteStop, handleRevertStop, handleSwapOrder,
        optimizeRoute, handleReverseRoute, routeSummary, setRouteSummary,
        handleSaveRoute, confirmFinish
    } = useDashboardRoute(
        isPro, isTrialActive, originPoint, isOnline, setNotification,
        setActiveModal, playNotification, setMapCenter, currentRouteId,
        setCurrentRouteId, routeName, setRouteName, routeDate, setRouteDate
    );

    // Session-based Settings Initialization
    useEffect(() => {
        if (typeof window === 'undefined' || hasInitializedFromSession.current) return;
        if (status === 'authenticated' && session?.user) {
            const sessionMapApp = (session.user as any).preferredMapApp;
            const sessionVehicleType = (session.user as any).vehicleType;
            if (sessionMapApp) { setPreferredMapApp(sessionMapApp); localStorage.setItem('hormiruta_preferredMapApp', sessionMapApp); }
            if (sessionVehicleType) { setVehicleType(sessionVehicleType as VehicleType); localStorage.setItem('hormiruta_vehicleType', sessionVehicleType); }
            if (!sessionMapApp && !localStorage.getItem('hormiruta_preferredMapApp')) { setActiveModal('welcome-map-preference'); }
            hasInitializedFromSession.current = true;
        } else if (status === 'unauthenticated') {
            const savedMapApp = localStorage.getItem('hormiruta_preferredMapApp');
            if (savedMapApp === 'google' || savedMapApp === 'waze') setPreferredMapApp(savedMapApp as 'google' | 'waze');
            hasInitializedFromSession.current = true;
        }
    }, [status, session, setActiveModal]);

    // Extra Effects
    useEffect(() => {
        if (status === 'authenticated' && !hasPlayedWelcome) {
            setHasPlayedWelcome(true);
        }
    }, [status, hasPlayedWelcome]);

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/auth/login');
    }, [status, router]);

    const handleLogout = async () => {
        if (Capacitor.isNativePlatform()) { try { await FirebaseAuthentication.signOut(); } catch (e) {} }
        localStorage.clear(); sessionStorage.clear();
        document.cookie.split(";").forEach((c) => { document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); });
        await signOut({ callbackUrl: '/auth/login', redirect: true });
    };

    const handleQuickNavigation = useCallback(() => {
        if (stops.length === 0) { setNotification('Añade paradas primero para navegar'); return; }
        const targetStop = stops.find(s => s.id === activeStop?.id) || stops.find(s => s.isCurrent) || stops.find(s => !s.isCompleted && !s.isFailed);
        if (!targetStop) { setNotification('No hay paradas pendientes en tu ruta'); return; }
        if (preferredMapApp === 'google') { window.open(`https://www.google.com/maps/dir/?api=1&destination=${targetStop.lat},${targetStop.lng}`, '_blank'); }
        else if (preferredMapApp === 'waze') { window.open(`https://waze.com/ul?ll=${targetStop.lat},${targetStop.lng}&navigate=yes`, '_blank'); }
        else { setActiveStop(targetStop); handleOpenModal('navigation-choice'); }
    }, [stops, activeStop, preferredMapApp, setNotification, setActiveStop, handleOpenModal]);

    const handleRecenter = useCallback(() => {
        if (userCoords) { setMapCenter({ ...userCoords } as any); setIsGpsActive(true); setNotification('Centrado en tu ubicación'); }
        else refreshOriginLocation(false);
    }, [userCoords, setMapCenter, setIsGpsActive, setNotification, refreshOriginLocation]);

    // Swipe detection for drawers
    useEffect(() => {
        let touchStartX = 0;
        let touchStartY = 0;
        const threshold = 100; // Swipe distance threshold
        const edgeThreshold = 40; // Edge start threshold

        const handleTouchStart = (e: TouchEvent) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        };

        const handleTouchEnd = (e: TouchEvent) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const diffX = touchEndX - touchStartX;
            const diffY = touchEndY - touchStartY;

            // Only horizontal swipes
            if (Math.abs(diffX) > Math.abs(diffY)) {
                // From left edge -> Open Mando
                if (touchStartX < edgeThreshold && diffX > threshold) {
                    setIsMobileMenuOpen(true);
                    playNotification('sound1');
                }
                // From right edge -> Open Fleet Management
                if (touchStartX > window.innerWidth - edgeThreshold && diffX < -threshold) {
                    setViewMode('list');
                    playNotification('sound1');
                }
            }
        };

        window.addEventListener('touchstart', handleTouchStart);
        window.addEventListener('touchend', handleTouchEnd);
        return () => {
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [setIsMobileMenuOpen, setViewMode, playNotification]);

    if (status === 'loading') return <LoadingScreen />;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} className="flex h-screen bg-darker text-foreground overflow-hidden font-sans">
            <PermissionGuard />
            <SOSButton driverName={session?.user?.name || undefined} currentPos={userCoords || undefined} className={cn("z-[70] transition-all", viewMode === 'list' ? "translate-y-[-100px] lg:translate-y-0" : "")} />
            
            <Sidebar session={session} isPro={isPro} stops={stops} originPoint={originPoint} vehicleType={vehicleType} viewMode={viewMode} activeModal={activeModal} returnToStart={returnToStart} setReturnToStart={setReturnToStart} handleReverseRoute={handleReverseRoute} refreshOriginLocation={refreshOriginLocation} setVehicleType={setVehicleType} setActiveModal={setActiveModal} setViewMode={setViewMode} playNotification={playNotification} router={router} className="hidden" />

            <div className="flex-1 flex flex-col relative">
                <AnimatePresence>
                    {statusBanner.visible && (
                        <motion.div 
                            key="status-banner" 
                            initial={{ y: -100, opacity: 0 }} 
                            animate={{ y: 0, opacity: 1 }} 
                            exit={{ y: -100, opacity: 0 }} 
                            className={cn(
                                "absolute top-16 left-0 right-0 z-[150] py-2 text-center font-black uppercase tracking-widest text-[8px] italic shadow-2xl border-y border-white/5", 
                                statusBanner.type === 'online' ? "bg-emerald-500 text-dark" : "bg-red-500 text-white"
                            )}
                        >
                            <div className="flex items-center justify-center gap-1.5">{statusBanner.type === 'online' ? <Cloud className="w-3.5 h-3.5" /> : <CloudOff className="w-3.5 h-3.5" />} {statusBanner.type === 'online' ? "Conexión Restaurada" : "Modo Offline Activo"}</div>
                        </motion.div>
                    )}
                    {notification && (
                        <motion.div 
                            key="notification-toast" 
                            initial={{ y: -50, opacity: 0 }} 
                            animate={{ y: 0, opacity: 1 }} 
                            exit={{ y: -50, opacity: 0 }} 
                            className="absolute top-24 left-1/2 -translate-x-1/2 z-[140] px-6 py-3 bg-darker/90 border border-info/40 rounded-full shadow-2xl backdrop-blur-3xl flex items-center gap-3 min-w-[200px] justify-center whitespace-nowrap"
                        >
                            <div className="w-1.5 h-1.5 rounded-full bg-info animate-ping" />
                            <p className="text-white text-[9px] font-black uppercase tracking-[0.2em] italic">{notification}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <DashboardHeader isOnline={isOnline} vehicleType={vehicleType} isVehicleSelectorOpen={isVehicleSelectorOpen} setIsVehicleSelectorOpen={setIsVehicleSelectorOpen} setVehicleType={setVehicleType} />

                <main className="flex-1 relative overflow-hidden bg-black">
                    <div className={cn("absolute inset-0 z-0 transition-all duration-1000", (viewMode === 'list' && typeof window !== 'undefined' && window.innerWidth > 1024) ? 'opacity-10 scale-105 blur-sm' : 'opacity-100 scale-100 blur-0')}>
                        <NavMap stops={stops} onMapClick={() => {}} onMarkerClick={(id: string) => { const s = stops.find(x => x.id === id); if (s) { setActiveStop(s); setMapCenter({ lat: s.lat, lng: s.lng } as any); setActiveModal('navigation-choice'); } }} onRemoveStop={handleRemoveStop} onGeofenceAlert={(s: any) => { setNotification(`¡En parada ${s.stopOrder}!`); const next = handleCompleteStop(s.stopId); if (next) setMapCenter(next); }} onUserLocationUpdate={setUserCoords} userVehicle={{ type: vehicleType, isActive: isGpsActive }} fleetDrivers={fleetDrivers} showTraffic={showTraffic} geofenceRadius={100} selectedStopId={activeStop?.id} onMarkerDragEnd={(id: string, coords: any) => setStops(prev => prev.map(s => s.id === id ? { ...s, ...coords } : s))} theme={mapTheme} center={mapCenter} origin={originPoint} returnToStart={returnToStart} />
                    </div>

                    <DashboardControls showTraffic={showTraffic} setShowTraffic={setShowTraffic} returnToStart={returnToStart} setReturnToStart={setReturnToStart} navigationTargetId={navigationTargetId} setNavigationTargetId={setNavigationTargetId} setNotification={setNotification} stops={stops} handleFinishRoute={() => setActiveModal('route-summary')} optimizeRoute={optimizeRoute} isOptimizing={isOptimizing} handleQuickNavigation={handleQuickNavigation} handleRecenter={handleRecenter} isGpsActive={isGpsActive} setIsMobileMenuOpen={setIsMobileMenuOpen} isMobileMenuOpen={isMobileMenuOpen} setActiveModal={setActiveModal} viewMode={viewMode} setViewMode={setViewMode} handleCompleteStop={handleCompleteStop} />



                    {/* Mobile & Web Itinerary Drawer */}
                    <BottomSheet 
                        isOpen={viewMode === 'list'} 
                        onClose={() => setViewMode('map')} 
                        title="Gestión de Flota" 
                        collapsedContent={stops.length > 0 && (
                            <div className="px-2">
                                <RevolverDashboard 
                                    stops={stops} 
                                    onOptimize={optimizeRoute} 
                                    onCompleteCurrent={() => { const s = stops.find((x: Stop) => x.isCurrent); if (s) { const next = handleCompleteStop(s.id); if (next) setMapCenter(next); } }} 
                                    onStartNavigation={() => { 
                                        const s = stops.find((x: Stop) => x.isCurrent) || stops.find((x: Stop) => !x.isCompleted && !x.isFailed);
                                        if (s) { setActiveStop(s); handleOpenModal('navigation-choice'); setIsGpsActive(true); setMapCenter(s); }
                                    }}
                                    isOptimizing={isOptimizing} 
                                />
                            </div>
                        )}
                    >
                        <Timeline 
                            stops={stops} 
                            onReorder={setStops} 
                            onNavigate={(s: Stop) => { 
                                setActiveStop(s); 
                                handleOpenModal('navigation-choice'); 
                                setIsGpsActive(true); 
                                setMapCenter(s); 
                            }} 
                            onEdit={(s: Stop) => { setActiveStop(s); handleOpenModal('edit-stop'); }} 
                            onComplete={(id: string) => { const next = handleCompleteStop(id); if (next) setMapCenter(next); }} 
                            onDuplicate={(s: Stop) => setStops([...stops, { ...s, id: Math.random().toString(36).substr(2, 9), order: stops.length + 1 }])} 
                            onRemove={handleRemoveStop} 
                            onRevert={handleRevertStop} 
                        />
                    </BottomSheet>


                </main>

                <NavigationMenu isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} vehicleType={vehicleType} setVehicleType={setVehicleType} handleOpenModal={handleOpenModal} setViewMode={setViewMode} viewMode={viewMode} handleRecenter={handleRecenter} stops={stops} returnToStart={returnToStart} setReturnToStart={setReturnToStart} handleLogout={handleLogout} />

                <DashboardModals handleOpenModal={handleOpenModal} isOptimizing={isOptimizing} activeModal={activeModal} setActiveModal={setActiveModal} activeStop={activeStop} setActiveStop={setActiveStop} modalStack={modalStack} handleBackAction={handleBackAction} session={session} stops={stops} setStops={setStops} currentRouteId={currentRouteId} setCurrentRouteId={setCurrentRouteId} routeName={routeName} setRouteName={setRouteName} routeDate={routeDate} setRouteDate={setRouteDate} routeSummary={routeSummary} handleFinishRoute={() => setActiveModal('route-summary')} confirmFinish={() => confirmFinish(setIsGpsActive, setShowConfetti)} handleLogout={handleLogout} handleLoadRoute={(r: any) => { setStops(r.stops); setCurrentRouteId(r._id); setRouteName(r.name); setRouteDate(r.date); setActiveModal(null); }} handleNewRoute={() => { setStops([]); setRouteName(''); setActiveModal(null); }} handleSaveRoute={() => handleSaveRoute(routeName, routeDate, vehicleType)} handleBulkImport={(ns: Stop[]) => setStops([...stops, ...ns.map((s, i) => ({ ...s, order: stops.length + i + 1 }))])} handleAddStop={handleAddStop} handleAddAndOptimize={async (s: Stop) => { handleAddStop(s); await optimizeRoute([...stops, s]); }} handleUpdateStop={handleUpdateStop} handleCompleteStop={handleCompleteStop} handleRevertStop={handleRevertStop} handleRemoveStop={handleRemoveStop} handleDuplicateStop={() => {}} handleSwapOrder={handleSwapOrder} handleReorder={setStops} handleQuickNavigation={handleQuickNavigation} setNotification={setNotification} preferredMapApp={preferredMapApp} setPreferredMapApp={setPreferredMapApp} vehicleType={vehicleType} setVehicleType={setVehicleType} mapTheme={mapTheme} setMapTheme={setMapTheme} alertSound={alertSound} setAlertSound={setAlertSound} showConfetti={showConfetti} setShowConfetti={setShowConfetti} expenses={expenses} setExpenses={setExpenses} updateSession={update} swapScrollRef={swapScrollRef as any} setIsGpsActive={setIsGpsActive} setMapCenter={setMapCenter} setViewMode={setViewMode} />

                {isGpsActive && <GeofenceAlertsManager onGeofenceAlert={(s: any) => { setNotification(`¡Llegaste a ${s.stopOrder}!`); const next = handleCompleteStop(s.stopId); if (next) setMapCenter(next); }} />}
            </div>
        </motion.div>
    );
}
