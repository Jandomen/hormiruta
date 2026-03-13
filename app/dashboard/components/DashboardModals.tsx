'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, ChevronLeft, Route as RouteIcon, Calendar, CheckCircle, Navigation,
    XCircle, MapPin, User, Phone, History, Truck, Package, FileText, RotateCw, ChevronRight,
    Fingerprint, LogOut, Star, Shield, ShieldAlert, Sun, Moon, Map as MapIcon, RefreshCw,
    ShieldCheck, Scale, Crown
} from 'lucide-react';
import { ActiveModal, Stop, Expense, VehicleType, VEHICLE_OPTIONS, SOUND_OPTIONS } from '../types';
import StopInput from '../../components/StopInput';
import BulkImport from '../../components/BulkImport';
import SavedRoutes from '../../components/SavedRoutes';
import ExpenseForm from '../../components/ExpenseForm';
import SOSConfig from '../../components/SOSConfig';
import { PrivacyPolicy, TermsConditions } from '../../components/LegalContent';
import PricingModal from '../../components/PricingModal';
import SubscriptionManager from '../../components/SubscriptionManager';
import Timeline from '../../components/Timeline';
import { openInGoogleMaps, openInWaze } from '../../lib/navigation';
import { cn } from '../../lib/utils';

// Helper component for Modal Wrapper
const ModalWrapper = ({
    children, title, subtitle, onClose, onBack, hasBack, activeModal
}: {
    children: React.ReactNode, title: string, subtitle?: string, onClose: () => void,
    onBack?: () => void, hasBack?: boolean, activeModal: ActiveModal
}) => (
    <motion.div
        initial={{ scale: 0.95, y: 100, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 100, opacity: 0 }}
        className="w-full max-w-[340px] sm:max-w-sm bg-darker border border-white/5 rounded-[32px] sm:rounded-[40px] shadow-[0_50px_200px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col max-h-[85vh]"
    >
        <div className="p-5 sm:p-8 pb-3 sm:pb-4 pt-8 sm:pt-10 relative">
            <div className="absolute top-3 sm:top-4 left-1/2 -translate-x-1/2 w-10 sm:w-12 h-1 bg-white/10 rounded-full" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-info to-transparent opacity-20" />

            <div className="flex justify-between items-center mb-2 sm:mb-4">
                <div className="flex items-center gap-3 sm:gap-4">
                    {hasBack && (
                        <button onClick={onBack} className="p-3 sm:p-4 bg-white/5 rounded-xl sm:rounded-2xl text-info hover:bg-white/10 transition-all">
                            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                    )}
                    <div>
                        <h3 className="text-xl sm:text-2xl font-black text-white italic tracking-tighter uppercase leading-tight">{title}</h3>
                        <p className="text-[8px] sm:text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mt-0.5">{subtitle || 'Hormiruta Protocol'}</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 sm:p-3 bg-white/5 rounded-xl sm:rounded-[20px] text-white/20 hover:text-white transition-all">
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
            </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-8 pt-0 pb-10 sm:pb-12">
            {children}
        </div>
    </motion.div>
);

interface Props {
    activeModal: ActiveModal;
    setActiveModal: (modal: ActiveModal) => void;
    activeStop: Stop | null;
    setActiveStop: (stop: Stop | null) => void;
    modalStack: ActiveModal[];
    handleBackAction: () => boolean;
    session: any;
    stops: Stop[];
    setStops: React.Dispatch<React.SetStateAction<Stop[]>>;
    currentRouteId: string | null;
    setCurrentRouteId: (id: string | null) => void;
    routeName: string;
    setRouteName: (name: string) => void;
    routeDate: string;
    setRouteDate: (date: string) => void;
    routeSummary: any;
    handleFinishRoute: () => void;
    confirmFinish: () => Promise<void>;
    handleLogout: () => Promise<void>;
    handleLoadRoute: (route: any) => void;
    handleNewRoute: () => void;
    handleSaveRoute: () => Promise<void>;
    handleBulkImport: (newStops: any[]) => void;
    handleAddStop: (newStop: any) => void;
    handleAddAndOptimize: (newStop: any) => Promise<void>;
    handleUpdateStop: (updatedStop: any) => void;
    handleCompleteStop: (id: string, isFailed?: boolean) => any;
    handleRevertStop: (id: string) => void;
    handleRemoveStop: (id: string) => void;
    handleDuplicateStop: (stop: any) => void;
    handleSwapOrder: (stopId: string, newOrder: number) => void;
    handleReorder: (newStops: any[]) => void;
    handleQuickNavigation: () => void;
    setNotification: (msg: string | null) => void;
    preferredMapApp: 'google' | 'waze' | null;
    setPreferredMapApp: (app: 'google' | 'waze') => void;
    vehicleType: VehicleType;
    setVehicleType: (type: VehicleType) => void;
    mapTheme: 'light' | 'dark';
    setMapTheme: (theme: 'light' | 'dark') => void;
    alertSound: string;
    setAlertSound: (sound: string) => void;
    showConfetti: boolean;
    setShowConfetti: (val: boolean) => void;
    expenses: Expense[];
    setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
    updateSession: any;
    swapScrollRef: React.RefObject<HTMLDivElement>;
    setIsGpsActive: (val: boolean) => void;
    setMapCenter: (coords: any) => void;
    setViewMode: (mode: 'map' | 'list') => void;
    isOptimizing: boolean;
    handleOpenModal: (modal: ActiveModal, pushToStack?: boolean) => void;
}

export default function DashboardModals(props: Props) {
    const {
        activeModal, setActiveModal, activeStop, setActiveStop, modalStack, handleBackAction,
        session, stops, setStops, currentRouteId, setCurrentRouteId, routeName, setRouteName,
        routeDate, setRouteDate, routeSummary, confirmFinish, handleLogout,
        handleLoadRoute, handleNewRoute, handleSaveRoute, handleBulkImport, handleAddStop,
        handleAddAndOptimize, handleUpdateStop, handleCompleteStop, handleRevertStop,
        handleRemoveStop, handleDuplicateStop, handleSwapOrder, handleReorder, handleQuickNavigation,
        setNotification, preferredMapApp, setPreferredMapApp, vehicleType, setVehicleType,
        mapTheme, setMapTheme, alertSound, setAlertSound, showConfetti, expenses, setExpenses,
        updateSession, swapScrollRef, setIsGpsActive, setMapCenter, setViewMode, isOptimizing,
        handleOpenModal
    } = props;

    if (!activeModal && activeModal !== 'pricing' && activeModal !== 'saved-routes') return null;

    if (activeModal === 'pricing') {
        return <PricingModal isOpen={true} onClose={() => setActiveModal(null)} />;
    }

    if (activeModal === 'saved-routes') {
        return <SavedRoutes onLoadRoute={handleLoadRoute} onClose={() => setActiveModal(null)} />;
    }

    const getModalTitle = (modal: ActiveModal) => {
        switch (modal) {
            case 'edit-stop': return 'Ajustar Punto';
            case 'add-stop': return 'Nueva Parada';
            case 'settings': return 'Configuración';
            case 'privacy': return 'Privacidad';
            case 'terms': return 'Términos';
            case 'profile': return 'Mi Perfil';
            case 'save-route': return 'Guardar Ruta';
            case 'bulk-import': return 'Carga Masiva';
            case 'route-summary': return 'Resumen';
            case 'expense': return 'Registrar Gasto';
            case 'new-route-confirm': return 'Advertencia';
            case 'sos-config': return 'Protocolo SOS';
            default: return 'Hormiruta';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-darker/90 backdrop-blur-[80px] flex items-center justify-center p-5"
        >
            <AnimatePresence>
                {isOptimizing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[300] bg-darker/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center space-y-6"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 bg-info/20 blur-2xl rounded-full animate-pulse" />
                            <div className="relative w-20 h-20 border-2 border-info/10 rounded-full flex items-center justify-center">
                                <RotateCw className="w-10 h-10 text-info animate-spin" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-white font-black text-lg italic uppercase tracking-tighter">Sincronizando</h4>
                            <p className="text-info font-black text-[9px] uppercase tracking-[0.3em]">IA de Tráfico en Tiempo Real</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {activeModal === 'navigation-choice' && activeStop ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-[295px] bg-[#0A0F1A]/95 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] p-3.5 overflow-hidden flex flex-col gap-2.5"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-info via-blue-500 to-info" />
                    
                    {/* Compact Header */}
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-base font-black text-white italic tracking-tighter uppercase leading-none">Hormiruta</h3>
                            <p className="text-[6px] text-info font-black uppercase tracking-[0.3em] mt-0.5 opacity-60">Protocolo de Operación</p>
                        </div>
                        <button onClick={() => setActiveModal(null)} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                            <X className="w-3.5 h-3.5 text-white/40" />
                        </button>
                    </div>

                    {/* Ultra-Compact Info Card */}
                    <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden flex flex-col scale-[0.98] origin-top">
                        <div className="p-3 border-b border-white/5 flex items-start gap-3">
                            <div className="w-9 h-9 bg-info/10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"><MapPin className="w-5 h-5 text-info" /></div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[8px] text-white/30 font-bold uppercase tracking-widest leading-none mb-1">Ubicación • {activeStop.zipCode || activeStop.id.slice(-4).toUpperCase()}</p>
                                <p className="text-xs font-black text-white leading-tight italic line-clamp-2">{activeStop.address || 'Ubicación seleccionada'}</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 divide-x divide-white/5 bg-black/20">
                            <div className="p-3 space-y-1">
                                <div className="flex items-center gap-1.5 opacity-40"><User className="w-3 h-3 text-info" /><span className="text-[8px] font-black uppercase text-white tracking-widest">Cliente</span></div>
                                <p className="text-[10px] font-black text-white italic truncate">{activeStop.customerName || 'N/A'}</p>
                            </div>
                            <div className="p-3 space-y-1">
                                <div className="flex items-center gap-1.5 opacity-40"><Calendar className="w-3 h-3 text-info" /><span className="text-[8px] font-black uppercase text-white tracking-widest">Horario</span></div>
                                <p className="text-[10px] font-black text-white italic truncate">{activeStop.timeWindow || '--:--'}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 divide-x divide-white/5 border-t border-white/5 bg-black/40">
                            <div className="p-3 space-y-1">
                                <div className="flex items-center gap-1.5 opacity-40"><Truck className="w-3 h-3 text-info" /><span className="text-[8px] font-black uppercase text-white tracking-widest">Placas</span></div>
                                <p className="text-[10px] font-black text-white italic truncate uppercase">{activeStop.licensePlate || 'N/A'}</p>
                            </div>
                            <div className="p-3 space-y-1">
                                <div className="flex items-center gap-1.5 opacity-40"><Package className="w-3 h-3 text-info" /><span className="text-[8px] font-black uppercase text-white tracking-widest">Boxes</span></div>
                                <p className="text-[10px] font-black text-white italic truncate">{activeStop.boxes || '0'} pz</p>
                            </div>
                        </div>
                    </div>

                    {/* Status Actions - High Density */}
                    <div className="grid grid-cols-3 gap-2 px-0.5">
                        <button 
                            onClick={() => { setStops(prev => prev.map(s => s.id === activeStop.id ? { ...s, isCurrent: true, isCompleted: false, isFailed: false } : { ...s, isCurrent: false })); setActiveModal(null); setNotification('Protocolo: Inicio de Ruta'); }}
                            className="flex flex-col items-center justify-center gap-1 py-2.5 bg-info/10 border border-info/20 rounded-xl text-info hover:bg-info/20 transition-all active:scale-95"
                        >
                            <RotateCw className="w-5 h-5 text-info" />
                            <span className="text-[8px] font-black uppercase tracking-widest">Iniciar</span>
                        </button>
                        <button 
                            onClick={() => { const next = handleCompleteStop(activeStop.id); if (next) setMapCenter(next); setActiveModal(null); }}
                            className="flex flex-col items-center justify-center gap-1 py-2.5 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 hover:bg-green-500/20 transition-all active:scale-95"
                        >
                            <CheckCircle className="w-5 h-5" />
                            <span className="text-[8px] font-black uppercase tracking-widest text-green-500">Éxito</span>
                        </button>
                        <button 
                            onClick={() => { const next = handleCompleteStop(activeStop.id, true); if (next) setMapCenter(next); setActiveModal(null); }}
                            className="flex flex-col items-center justify-center gap-1 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500/20 transition-all active:scale-95"
                        >
                            <XCircle className="w-5 h-5" />
                            <span className="text-[8px] font-black uppercase tracking-widest text-red-500">Falló</span>
                        </button>
                    </div>

                    {/* Navigation Buttons - Compact */}
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => { openInGoogleMaps(activeStop.lat, activeStop.lng); if (!preferredMapApp) setPreferredMapApp('google'); setActiveModal(null); }} className="flex items-center justify-center gap-3 p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all active:scale-95">
                            <div className="w-6 h-6 flex items-center justify-center bg-white/10 rounded-lg shrink-0"><svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#4285F4]"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg></div>
                            <span className="text-[10px] font-black text-white uppercase tracking-widest italic">Google Maps</span>
                        </button>
                        <button onClick={() => { openInWaze(activeStop.lat, activeStop.lng); if (!preferredMapApp) setPreferredMapApp('waze'); setActiveModal(null); }} className="flex items-center justify-center gap-3 p-3.5 bg-[#33CCFF]/10 hover:bg-[#33CCFF]/20 border border-[#33CCFF]/30 rounded-xl transition-all active:scale-95">
                            <div className="w-6 h-6 flex items-center justify-center bg-dark/20 rounded-lg shrink-0"><svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#33CCFF]"><path d="M18.5 11c0-3-2.5-5.5-5.5-5.5S7.5 8 7.5 11h-1l-1 1.5 1 1.5h1c.1 2.9 2.5 5.2 5.4 5.2 2.1 0 3.9-1.2 4.8-2.9l1.6.4.6-1.9-1.6-.4c.1-.3.1-.6.1-.9zm-7 3.5c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5zm4 0c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5z" /></svg></div>
                            <span className="text-[10px] font-black text-[#33CCFF] uppercase tracking-widest italic leading-none">Waze Navi</span>
                        </button>
                    </div>

                    {/* Compact Utility Footer */}
                    <div className="flex gap-2 pt-1 border-t border-white/5">
                        <button 
                            onClick={() => { setActiveModal('edit-stop'); }}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-white/5 border border-white/5 rounded-lg text-white/40 hover:text-white transition-all text-[6px] font-black uppercase tracking-[0.2em]"
                        >
                            <RefreshCw className="w-2 h-2" /> Ajustar
                        </button>
                        <button 
                            onClick={() => { handleRemoveStop(activeStop.id); setActiveModal(null); }}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-red-500/5 border border-red-500/10 rounded-lg text-red-500/50 hover:text-red-500 transition-all text-[6px] font-black uppercase tracking-[0.2em]"
                        >
                            <XCircle className="w-2 h-2" /> Eliminar
                        </button>
                    </div>
                </motion.div>
            ) : (
                <ModalWrapper
                    title={getModalTitle(activeModal as ActiveModal)}
                    onClose={() => { setActiveModal(null); setActiveStop(null); }}
                    onBack={() => handleBackAction()}
                    hasBack={true}
                    activeModal={activeModal as ActiveModal}
                >
                    {activeModal === 'add-stop' || activeModal === 'edit-stop' ? (
                        <StopInput
                            isEditing={activeModal === 'edit-stop'}
                            initialData={activeModal === 'edit-stop' ? activeStop : undefined}
                            onAddStop={handleAddStop}
                            onUpdateStop={handleUpdateStop}
                            onOptimize={handleAddAndOptimize}
                            onCancel={() => { setActiveModal(null); setActiveStop(null); }}
                        />
                    ) : activeModal === 'bulk-import' ? (
                        <BulkImport onImport={handleBulkImport} onClose={() => setActiveModal(null)} />
                    ) : activeModal === 'new-route-confirm' ? (
                        <div className="space-y-6 sm:space-y-8 text-center py-2 sm:py-4">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto"><RefreshCw className="w-8 h-8 sm:w-10 sm:h-10 text-red-500" /></div>
                            <div className="space-y-1.5 sm:space-y-2">
                                <p className="text-white font-black text-base sm:text-lg italic uppercase tracking-tighter">¿Empezar de cero?</p>
                                <p className="text-white/30 text-[9px] sm:text-xs font-bold uppercase tracking-widest">Esto borrará todas las paradas actuales</p>
                            </div>
                            <div className="flex gap-3 sm:gap-4">
                                <button onClick={() => setActiveModal(null)} className="flex-1 py-3.5 sm:py-4 bg-white/5 rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Cancelar</button>
                                <button onClick={handleNewRoute} className="flex-1 py-3.5 sm:py-4 bg-red-500 text-white rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Sí, Borrar</button>
                            </div>
                        </div>
                    ) : activeModal === 'save-route' ? (
                        <div className="space-y-6 sm:space-y-8 py-2 sm:py-4">
                            <div className="space-y-4 sm:space-y-6">
                                <div className="space-y-1.5 sm:space-y-2">
                                    <label className="text-[8px] sm:text-[10px] font-black text-white/30 uppercase pl-1 tracking-widest">Nombre de Ruta</label>
                                    <div className="flex items-center gap-3 p-3.5 sm:p-4 bg-white/5 border border-white/5 rounded-2xl">
                                        <RouteIcon className="w-4 h-4 sm:w-5 sm:h-5 text-info/50" />
                                        <input value={routeName} onChange={(e) => setRouteName(e.target.value)} placeholder="Ej. Lunes Norte" className="bg-transparent outline-none text-white text-xs sm:text-sm w-full font-bold" />
                                    </div>
                                </div>
                                <div className="space-y-1.5 sm:space-y-2">
                                    <label className="text-[8px] sm:text-[10px] font-black text-white/30 uppercase pl-1 tracking-widest">Fecha</label>
                                    <div className="flex items-center gap-3 p-3.5 sm:p-4 bg-white/5 border border-white/5 rounded-2xl">
                                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-info/50" />
                                        <input type="date" value={routeDate} onChange={(e) => setRouteDate(e.target.value)} className="bg-transparent outline-none text-white text-xs sm:text-sm w-full font-bold [color-scheme:dark]" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 sm:gap-4">
                                <button onClick={() => setActiveModal(null)} className="flex-1 py-3.5 sm:py-4 bg-white/5 rounded-2xl text-[9px] sm:text-[10px] uppercase font-black tracking-widest">Cerrar</button>
                                <button onClick={handleSaveRoute} disabled={!routeName} className="flex-1 py-3.5 sm:py-4 bg-info text-dark rounded-2xl text-[9px] sm:text-[10px] uppercase font-black tracking-widest">Guardar</button>
                            </div>
                        </div>
                    ) : activeModal === 'route-summary' ? (
                        <div className="flex flex-col text-center">
                            <div className="relative h-48 sm:h-64 bg-black rounded-t-[32px] sm:rounded-t-[40px] overflow-hidden -mt-5 sm:-mt-8 -mx-5 sm:-mx-8 mb-4 sm:mb-8 border-b border-white/10 shadow-inner shrink-0">
                                {showConfetti && (
                                    <div className="absolute inset-0 pointer-events-none z-[60] overflow-hidden">
                                        {[...Array(20)].map((_, i) => (
                                            <motion.div key={i} initial={{ y: -50, x: Math.random() * 300 - 150, opacity: 0 }} animate={{ y: 300, opacity: [0, 1, 1, 0], rotate: 360 }} transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, ease: "linear" }} className="absolute left-1/2 text-xl sm:text-2xl">{['✨', '🎊', '🎉', '🎈', '🎇'][i % 5]}</motion.div>
                                        ))}
                                    </div>
                                )}
                                <img src="/hormigaBailando.png" alt="Celebración" className="w-full h-full object-contain scale-110" />
                            </div>
                            <div className="px-2 sm:px-4 pb-2 sm:pb-4 space-y-4 sm:space-y-8">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto relative shrink-0"><CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-500" /></div>
                                <div className="space-y-1"><h4 className="text-xl sm:text-3xl font-black text-white italic tracking-tighter uppercase leading-none">¡Misión Cumplida!</h4><p className="text-[8px] sm:text-[10px] text-info font-black uppercase tracking-[0.4em] mt-1 italic opacity-60">Operación Exitosa</p></div>
                                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                    <div className="bg-white/5 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/5 text-left"><p className="text-[8px] sm:text-[10px] text-white/20 uppercase font-bold mb-1 tracking-widest">Resumen</p>
                                        <div className="flex justify-between items-center"><span className="text-[8px] sm:text-[9px] text-white/40 font-bold uppercase">Logros</span><span className="text-xs sm:text-sm font-black text-green-500">{stops.filter(s => s.isCompleted).length}</span></div>
                                        <div className="flex justify-between items-center"><span className="text-[8px] sm:text-[9px] text-white/40 font-bold uppercase">Fallos</span><span className="text-xs sm:text-sm font-black text-red-500">{stops.filter(s => s.isFailed).length}</span></div>
                                    </div>
                                    <div className="bg-white/5 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/5 flex flex-col justify-center text-left"><p className="text-[8px] sm:text-[10px] text-white/20 uppercase font-bold mb-1 tracking-widest">Efecto</p><p className="text-2xl sm:text-3xl font-black text-info tracking-tighter leading-none">{Math.round((stops.filter(s => s.isCompleted).length / (stops.length || 1)) * 100)}%</p></div>
                                </div>
                            </div>
                            <div className="space-y-2 sm:space-y-3 pt-4 sm:pt-6">
                                <button onClick={confirmFinish} className="w-full py-4 sm:py-5 bg-info text-dark rounded-2xl sm:rounded-3xl text-xs sm:text-sm font-black uppercase tracking-widest shadow-lg shadow-info/10">Finalizar Ciclo</button>
                                <div className="flex gap-2 sm:gap-3">
                                    <button onClick={() => { setStops(stops.map(s => ({ ...s, id: Math.random().toString(36).substr(2, 9), isCompleted: false, isFailed: false, isCurrent: false }))); setActiveModal(null); }} className="flex-1 py-3.5 sm:py-4 bg-white/5 text-white/40 rounded-xl sm:rounded-2xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest">Reiniciar</button>
                                    <button onClick={() => { setStops([]); setActiveModal(null); }} className="flex-1 py-3.5 sm:py-4 bg-white/5 text-white/40 rounded-xl sm:rounded-2xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest">Nueva</button>
                                </div>
                            </div>
                        </div>
                    ) : activeModal === 'profile' ? (
                        <div className="space-y-6 sm:space-y-10 py-2 sm:py-4">
                            <div className="flex flex-col items-center text-center">
                                <div className="relative mb-4 sm:mb-6">
                                    <div className="absolute inset-0 bg-info/20 blur-2xl rounded-full" />
                                    <div className="relative w-24 h-24 sm:w-32 sm:h-32 bg-black/40 border-4 border-info/30 rounded-full flex items-center justify-center p-1.5 sm:p-2 backdrop-blur-xl shrink-0">
                                        {session?.user?.image ? <img src={session.user.image} alt="User" className="w-full h-full rounded-full object-cover" /> : <div className="w-full h-full rounded-full bg-info/10 flex items-center justify-center"><User className="w-12 h-12 sm:w-16 sm:h-16 text-info/40" /></div>}
                                        <div className="absolute -bottom-1 -right-1 w-8 h-8 sm:w-10 sm:h-10 bg-info text-dark rounded-full flex items-center justify-center border-4 border-black shadow-lg"><Shield className="w-4 h-4 sm:w-5 sm:h-5" /></div>
                                    </div>
                                </div>
                                <h4 className="text-xl sm:text-3xl font-black text-white italic tracking-tighter uppercase leading-none">{session?.user?.name || 'Comandante'}</h4>
                                <p className="text-[8px] sm:text-[10px] text-info font-black uppercase tracking-[0.4em] mt-1.5 italic opacity-60">Operador Certificado</p>
                            </div>
                            <div className="flex flex-col gap-4 sm:gap-6">
                                <div className="bg-white/5 p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] border border-white/5 space-y-4 sm:space-y-6 relative overflow-hidden group">
                                    <div className="flex items-center gap-4 sm:gap-5 border-b border-white/5 pb-4 sm:pb-6">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-info/10 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0"><Fingerprint className="w-5 h-5 sm:w-6 sm:h-6 text-info" /></div>
                                        <div className="min-w-0"><p className="text-[8px] sm:text-[10px] font-black text-white/20 uppercase mb-0.5 tracking-widest">Operador</p><p className="text-xs sm:text-sm font-black text-white italic truncate tracking-tight">HR-{session?.user?.id?.substring(0, 4).toUpperCase() || 'AX-01'}</p></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                        <div className="bg-black/40 px-3 py-2 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl border border-white/5"><div className="flex items-center gap-1 px-2 py-0.5 bg-info/10 rounded-full border border-info/20 mb-1.5 w-fit"><Star className="w-2 h-2 text-info fill-info" /><span className="text-[7px] font-black text-info uppercase">{(session?.user as any)?.plan || 'Free'}</span></div><span className="text-[8px] sm:text-[10px] font-black text-white/40 uppercase italic">Cuenta</span></div>
                                        <div className="bg-black/40 px-3 py-2 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl border border-white/5"><div className="flex items-center gap-1.5 mb-1 opacity-20"><Shield className="w-3 h-3 text-info" /><span className="text-[7px] font-bold text-white uppercase">Status</span></div><span className="text-[8px] sm:text-[10px] font-black text-green-500 uppercase italic">Activo</span></div>
                                    </div>
                                </div>
                                <div className="bg-white/5 p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] border border-white/5 space-y-4 sm:space-y-6">
                                     <div className="flex items-center gap-4 sm:gap-5 border-b border-white/5 pb-4 sm:pb-6"><div className="w-10 h-10 sm:w-12 sm:h-12 bg-info/10 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0"><FileText className="w-5 h-5 sm:w-6 sm:h-6 text-info" /></div><div className="min-w-0"><p className="text-[8px] sm:text-[10px] font-black text-white/20 uppercase mb-0.5 tracking-widest">Email Principal</p><p className="text-xs sm:text-sm font-black text-white italic truncate max-w-[150px]">{session?.user?.email}</p></div></div>
                                     <button onClick={handleLogout} className="w-full py-4 sm:py-5 bg-red-500/10 text-red-500 rounded-xl sm:rounded-2xl border border-red-500/20 text-[9px] sm:text-[11px] font-black uppercase tracking-[0.2em] transition-all">Desconectar</button>
                                </div>
                                <div onClick={() => setActiveModal('saved-routes')} className="bg-gradient-to-br from-info/15 via-info/5 to-transparent p-4 sm:p-6 rounded-[28px] sm:rounded-[40px] border border-info/10 flex items-center justify-between group cursor-pointer active:scale-[0.98] transition-all">
                                    <div className="flex items-center gap-4 sm:gap-5"><div className="w-11 h-11 sm:w-14 sm:h-14 bg-black/60 rounded-xl sm:rounded-2xl flex items-center justify-center border border-info/20 shrink-0"><History className="w-5 h-5 sm:w-7 sm:h-7 text-info" /></div><div><h5 className="text-[8px] sm:text-[10px] font-black text-white/30 uppercase tracking-widest">Bitácora</h5><p className="text-xs sm:text-sm font-black text-info italic uppercase">Mis Rutas</p></div></div>
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-info text-dark rounded-full flex items-center justify-center shrink-0"><ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" /></div>
                                </div>
                                <div className="pt-2 sm:pt-4 pb-6 sm:pb-8"><SOSConfig /></div>
                            </div>
                        </div>
                    ) : activeModal === 'sos-config' ? (
                        <div className="py-4">
                            <SOSConfig />
                        </div>
                    ) : activeModal === 'privacy' ? (
                        <PrivacyPolicy />
                    ) : activeModal === 'terms' ? (
                        <TermsConditions />
                    ) : activeModal === 'settings' ? (
                        <div className="space-y-6 sm:space-y-10 py-2 sm:py-4">
                            <div className="space-y-3 sm:space-y-4">
                                <div className="flex items-center gap-2 px-1">
                                    <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
                                    <span className="text-[8px] sm:text-[10px] font-black text-red-500/50 uppercase tracking-widest">Protocolo SOS</span>
                                </div>
                                <SOSConfig />
                            </div>
                            <div className="p-4 sm:p-6 bg-white/5 rounded-2xl sm:rounded-3xl border border-white/5 space-y-3 sm:space-y-4">
                                <p className="text-[8px] sm:text-[10px] font-black text-white/30 uppercase tracking-widest pl-1">Mi Suscripción</p>
                                <SubscriptionManager />
                            </div>
                            <div className="p-4 sm:p-6 bg-white/5 rounded-2xl sm:rounded-3xl border border-white/5 space-y-3 sm:space-y-4">
                                <p className="text-[8px] sm:text-[10px] font-black text-white/30 uppercase tracking-widest pl-1">Estilo Visual</p>
                                <div className="flex bg-black/50 p-1 rounded-xl sm:rounded-2xl border border-white/5">
                                    <button onClick={() => setMapTheme('light')} className={cn("flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all text-[10px] sm:text-xs font-bold", mapTheme === 'light' ? "bg-white text-black shadow-lg" : "text-white/40")}>
                                        <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" />Luz
                                    </button>
                                    <button onClick={() => setMapTheme('dark')} className={cn("flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all text-[10px] sm:text-xs font-bold", mapTheme === 'dark' ? "bg-info text-dark shadow-lg" : "text-white/40")}>
                                        <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />Noche
                                    </button>
                                </div>
                            </div>
                            <div className="p-4 sm:p-6 bg-white/5 rounded-2xl sm:rounded-3xl border border-white/5 space-y-3 sm:space-y-4">
                                <p className="text-[8px] sm:text-[10px] font-black text-white/30 uppercase tracking-widest pl-1">Alertas Sonoras</p>
                                <div className="grid grid-cols-1 gap-1.5 sm:gap-2">
                                    {SOUND_OPTIONS.map((sound) => (
                                        <button key={sound.id} onClick={() => { setAlertSound(sound.id); const audio = new Audio(sound.url); audio.volume = 0.4; audio.play(); setNotification(`Sonido ${sound.label} seleccionado`); }} className={cn("flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all", alertSound === sound.id ? "bg-info/10 border-info/40 text-info" : "bg-white/5 border-transparent text-white/40")}>
                                            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-tight">{sound.label}</span>
                                            <div className={cn("w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full", alertSound === sound.id ? "bg-info" : "bg-white/20")} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="p-4 sm:p-6 bg-white/5 rounded-2xl sm:rounded-3xl border border-white/5 space-y-3 sm:space-y-4">
                                <p className="text-[8px] sm:text-[10px] font-black text-white/30 uppercase tracking-widest pl-1">Navegación base</p>
                                <div className="flex bg-black/50 p-1 rounded-xl sm:rounded-2xl border border-white/5">
                                    <button onClick={() => { setPreferredMapApp('google'); setNotification('Google Maps seleccionado'); }} className={cn("flex-1 py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all text-[10px] sm:text-xs font-bold", preferredMapApp === 'google' ? "bg-[#4285F4] text-white" : "text-white/40")}>Google</button>
                                    <button onClick={() => { setPreferredMapApp('waze'); setNotification('Waze seleccionado'); }} className={cn("flex-1 py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all text-[10px] sm:text-xs font-bold", preferredMapApp === 'waze' ? "bg-[#33CCFF] text-white" : "text-white/40")}>Waze</button>
                                </div>
                            </div>
                            <div className="p-4 sm:p-6 bg-white/5 rounded-2xl sm:rounded-3xl border border-white/5 space-y-3 sm:space-y-4">
                                <p className="text-[8px] sm:text-[10px] font-black text-white/30 uppercase tracking-widest pl-1">Información Legal</p>
                                <div className="grid grid-cols-1 gap-2">
                                    <button 
                                        onClick={() => handleOpenModal('privacy', true)}
                                        className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5 hover:bg-white/5 transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <ShieldCheck className="w-4 h-4 text-info" />
                                            <span className="text-[10px] font-black text-white uppercase tracking-widest italic leading-none">Aviso de Privacidad</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-info transition-colors" />
                                    </button>
                                    <button 
                                        onClick={() => handleOpenModal('terms', true)}
                                        className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5 hover:bg-white/5 transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Scale className="w-4 h-4 text-info" />
                                            <span className="text-[10px] font-black text-white uppercase tracking-widest italic leading-none">Términos y Condiciones</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-info transition-colors" />
                                    </button>
                                </div>
                            </div>
                            <button onClick={handleLogout} className="w-full flex items-center justify-between p-4 sm:p-5 bg-red-500/5 hover:bg-red-500/10 rounded-2xl border border-red-500/10 transition-all text-red-500 font-bold uppercase text-[9px] sm:text-[11px] tracking-widest">
                                <div className="flex items-center gap-3">
                                    <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                                    <span>Desconectar Cuenta</span>
                                </div>
                            </button>
                        </div>
                    ) : activeModal === 'expense' ? (
                        <ExpenseForm
                            onAddExpense={async (exp) => {
                                try {
                                    const res = await fetch('/api/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...exp, routeId: currentRouteId }) });
                                    if (res.ok) {
                                        const savedExpense = await res.json();
                                        setExpenses([...expenses, savedExpense]);
                                        setNotification('Gasto registrado oficialmente');
                                        return true;
                                    }
                                    return false;
                                } catch (err) { return false; }
                            }}
                            onClose={() => setActiveModal(null)}
                        />
                    ) : null}
                </ModalWrapper>
            )}
        </motion.div>
    );
}
