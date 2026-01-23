'use client';

import React, { useState, useEffect } from 'react';
import { Shield, MapPin, Camera, Mic, ChevronRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

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
        const results: any = { ...status };

        // Check Geolocation
        try {
            const geo = await navigator.permissions.query({ name: 'geolocation' as any });
            results.geolocation = geo.state;
            geo.onchange = () => setStatus(prev => ({ ...prev, geolocation: geo.state }));
        } catch (e) {
            results.geolocation = 'prompt';
        }

        // Check Camera
        try {
            const cam = await navigator.permissions.query({ name: 'camera' as any });
            results.camera = cam.state;
        } catch (e) {
            results.camera = 'prompt';
        }

        // Check Microphone
        try {
            const mic = await navigator.permissions.query({ name: 'microphone' as any });
            results.microphone = mic.state;
        } catch (e) {
            results.microphone = 'prompt';
        }

        setStatus(results);

        // Show overlay if any critical permission is not granted
        if (results.geolocation !== 'granted' || results.camera !== 'granted' || results.microphone !== 'granted') {
            setShowOverlay(true);
        } else {
            setShowOverlay(false);
        }
    };

    useEffect(() => {
        checkPermissions();
    }, []);

    const requestPermission = async (type: 'geolocation' | 'camera' | 'microphone') => {
        setNotification(`Solicitando ${type}...`);
        try {
            if (type === 'geolocation') {
                navigator.geolocation.getCurrentPosition(
                    () => { checkPermissions(); setNotification('✅ GPS Activo'); },
                    () => { checkPermissions(); setNotification('❌ Error GPS'); },
                    { enableHighAccuracy: true, timeout: 5000 }
                );
            } else if (type === 'camera') {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    stream.getTracks().forEach(t => t.stop());
                    checkPermissions();
                    setNotification('✅ Cámara OK');
                } catch (e) {
                    setNotification('❌ Error Cámara');
                    checkPermissions();
                }
            } else if (type === 'microphone') {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    stream.getTracks().forEach(t => t.stop());
                    checkPermissions();
                    setNotification('✅ Micrófono OK');
                } catch (e) {
                    setNotification('❌ Error Mic');
                    checkPermissions();
                }
            }
        } catch (err) {
            checkPermissions();
        }
    };

    const [notification, setNotification] = useState<string | null>(null);

    if (!showOverlay) return null;

    const items = [
        { id: 'geolocation', label: 'Localización GPS', desc: 'Para navegación en tiempo real.', icon: MapPin, state: status.geolocation },
        { id: 'camera', label: 'Cámara / Scanner', desc: 'Para escanear códigos QR.', icon: Camera, state: status.camera },
        { id: 'microphone', label: 'Micrófono / Voz', desc: 'Para dictar notas.', icon: Mic, state: status.microphone }
    ];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 touch-none">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
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
                            onClick={() => {
                                if (status.geolocation === 'granted') setShowOverlay(false);
                                else setNotification('🚨 GPS requerido');
                            }}
                            className="w-full py-5 bg-white/5 text-white/40 font-black uppercase text-[10px] tracking-[0.3em] rounded-2xl border border-white/5"
                        >
                            Entrar a la Terminal
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default PermissionGuard;
