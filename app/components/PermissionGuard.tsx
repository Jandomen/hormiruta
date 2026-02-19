import React, { useState, useEffect } from 'react';
import { Shield, MapPin, Camera, Mic, ChevronRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { Camera as CapCamera } from '@capacitor/camera';
import { App } from '@capacitor/app';

interface PermissionStatus {
    geolocation: PermissionState | 'loading';
    camera: PermissionState | 'loading';
    microphone: PermissionState | 'loading';
}

const PermissionGuard = () => {
    const [status, setStatus] = useState<PermissionStatus>({
        geolocation: 'loading',
        camera: 'loading',
        microphone: 'loading',
    });
    const [showOverlay, setShowOverlay] = useState(false);

    const checkPermissions = async () => {
        if (!Capacitor.isNativePlatform()) {
            setStatus({
                geolocation: 'granted',
                camera: 'granted',
                microphone: 'granted'
            });
            setShowOverlay(false);
            return;
        }

        try {
            const geo = await Geolocation.checkPermissions();
            const cam = await CapCamera.checkPermissions();

            const isLocationGranted = geo.location === 'granted' || geo.coarseLocation === 'granted';

            let finalLocationState = isLocationGranted ? 'granted' : (geo.location === 'denied' && geo.coarseLocation === 'denied') ? 'denied' : 'prompt';

            const results: PermissionStatus = {
                geolocation: finalLocationState as any,
                camera: cam.camera === 'granted' ? 'granted' : cam.camera === 'denied' ? 'denied' : 'prompt',
                microphone: 'granted',
            };

            setStatus(results);

            if (results.geolocation === 'granted' && results.camera === 'granted') {
                setShowOverlay(false);
            } else {
                setShowOverlay(true);
            }
        } catch (e) {
            console.error("Native permission check failed", e);
            setShowOverlay(true);
            setNotification('⚠️ Error en verificación');
        }
    };

    useEffect(() => {
        checkPermissions();

        if (Capacitor.isNativePlatform()) {
            const listener = App.addListener('appStateChange', ({ isActive }) => {
                if (isActive) {
                    checkPermissions();
                }
            });

            return () => {
                listener.then(l => l.remove());
            };
        }
    }, []);

    const requestPermission = async (type: 'geolocation' | 'camera' | 'microphone') => {
        if (!Capacitor.isNativePlatform()) {
            setNotification('✅ Simulado en Web');
            return;
        }

        setNotification(`Solicitando ${type} nativo...`);
        try {
            if (type === 'geolocation') {
                const result = await Geolocation.requestPermissions();
                if (result.location === 'granted' || result.coarseLocation === 'granted') {
                    try {
                        setNotification('⏳ Verificando señal GPS...');
                        await Geolocation.getCurrentPosition({ timeout: 5000, enableHighAccuracy: false });
                        setNotification('✅ GPS Confirmado');
                        checkPermissions();
                    } catch (gpsError) {
                        console.error("GPS Service check failed", gpsError);
                        setNotification('⚠️ Permiso OK, pero GPS apagado. Actívalo.');
                    }
                } else {
                    setNotification('❌ GPS Denegado');
                }
            } else if (type === 'camera') {
                const result = await CapCamera.requestPermissions();
                if (result.camera === 'granted') {
                    checkPermissions();
                    setNotification('✅ Cámara OK');
                } else {
                    setNotification('❌ Cámara Denegada');
                }
            }
        } catch (err) {
            console.error("Native request failed", err);
            setNotification('❌ Fallo crítico de hardware');
        }
    };

    const [notification, setNotification] = useState<string | null>(null);

    const items = [
        { id: 'geolocation', label: 'Localización GPS', desc: 'Para navegación en tiempo real.', icon: MapPin, state: status.geolocation },
        { id: 'camera', label: 'Cámara / Scanner', desc: 'Para escanear códigos QR.', icon: Camera, state: status.camera },
        { id: 'microphone', label: 'Micrófono / Voz', desc: 'Para dictar notas.', icon: Mic, state: status.microphone }
    ];

    return (
        <AnimatePresence mode="wait">
            {showOverlay && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 touch-none"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="w-full max-w-lg bg-black/60 border border-white/10 rounded-[40px] p-8 relative overflow-hidden"
                    >
                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-info/10 rounded-2xl flex items-center justify-center">
                                    <Shield className="w-7 h-7 text-info" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Protocolos</h2>
                                    <p className="text-[10px] text-info/40 font-black uppercase tracking-[0.3em] mt-1">Configuración Android</p>
                                </div>
                            </div>

                            {notification && (
                                <div className="bg-info/10 border border-info/20 p-3 rounded-xl text-center text-[10px] font-black text-info uppercase tracking-widest animate-pulse">
                                    {notification}
                                </div>
                            )}

                            <div className="space-y-3">
                                {items.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => requestPermission(item.id as any)}
                                        className={cn(
                                            "w-full p-5 rounded-[28px] border transition-all flex items-center justify-between text-left active:scale-[0.98]",
                                            item.state === 'granted' ? 'bg-green-500/10 border-green-500/20' : 'bg-white/5 border-white/5'
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center",
                                                item.state === 'granted' ? 'bg-green-500/20' : 'bg-black/40'
                                            )}>
                                                <item.icon className={cn("w-5 h-5", item.state === 'granted' ? 'text-green-500' : 'text-info/40')} />
                                            </div>
                                            <div>
                                                <h3 className="text-xs font-black text-white uppercase italic">{item.label}</h3>
                                                <p className="text-[9px] text-white/30 font-bold leading-tight mt-0.5">{item.desc}</p>
                                            </div>
                                        </div>
                                        {item.state === 'granted' ? (
                                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                                        ) : (
                                            <div className="px-3 py-1.5 bg-info text-dark text-[9px] font-black uppercase rounded-lg">Activar</div>
                                        )}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={async () => {
                                    // Force a re-check when clicking the button
                                    setNotification('Verificando acceso...');
                                    try {
                                        const geo = await Geolocation.checkPermissions();
                                        const isLocationGranted = geo.location === 'granted' || geo.coarseLocation === 'granted';

                                        if (isLocationGranted) {
                                            setShowOverlay(false);
                                        } else {
                                            // If not granted, try to request it one last time
                                            const req = await Geolocation.requestPermissions();
                                            if (req.location === 'granted' || req.coarseLocation === 'granted') {
                                                setShowOverlay(false);
                                            } else {
                                                setNotification('🚨 GPS requerido para operar');
                                            }
                                        }
                                    } catch (e) {
                                        console.error("Force check failed", e);
                                        setNotification('⚠️ Error validando GPS');
                                    }
                                }}
                                className="w-full py-5 bg-white/5 text-white/40 font-black uppercase text-[10px] tracking-[0.3em] rounded-2xl border border-white/5 hover:bg-white/10 active:scale-95 transition-all"
                            >
                                Entrar a la Terminal
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PermissionGuard;
