'use client';

import React, { useState, useEffect } from 'react';
import { Shield, MapPin, Camera, Mic, ChevronRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
        try {
            if (type === 'geolocation') {
                navigator.geolocation.getCurrentPosition(
                    () => checkPermissions(),
                    () => checkPermissions()
                );
            } else if (type === 'camera') {
                await navigator.mediaDevices.getUserMedia({ video: true });
                checkPermissions();
            } else if (type === 'microphone') {
                await navigator.mediaDevices.getUserMedia({ audio: true });
                checkPermissions();
            }
        } catch (err) {
            console.error(`Permission request for ${type} failed:`, err);
            checkPermissions();
        }
    };

    if (!showOverlay) return null;

    const items = [
        {
            id: 'geolocation',
            label: 'Localización GPS',
            desc: 'Necesario para navegación y tracking en tiempo real.',
            icon: MapPin,
            state: status.geolocation,
            critical: true
        },
        {
            id: 'camera',
            label: 'Cámara / Scanner',
            desc: 'Para escanear códigos QR y confirmar entregas.',
            icon: Camera,
            state: status.camera,
            critical: false
        },
        {
            id: 'microphone',
            label: 'Micrófono / Voz',
            desc: 'Para dictar notas y responder alertas de voz.',
            icon: Mic,
            state: status.microphone,
            critical: false
        }
    ];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-[50px] flex items-center justify-center p-6 lg:p-12 overflow-y-auto"
            >
                <div className="w-full max-w-lg bg-black/40 border border-white/5 rounded-[48px] p-8 lg:p-10 shadow-[0_100px_200px_rgba(0,0,0,0.8)] relative overflow-hidden">
                    {/* Background Glow */}
                    <div className="absolute -top-20 -left-20 w-64 h-64 bg-info/10 blur-[100px] rounded-full" />
                    <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-info/5 blur-[100px] rounded-full" />

                    <div className="relative z-10 space-y-10">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 bg-info/10 rounded-2xl flex items-center justify-center shadow-inner">
                                <Shield className="w-8 h-8 text-info animate-pulse" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Protocolos de Acceso</h2>
                                <p className="text-[10px] text-info font-black uppercase tracking-[0.3em] mt-1">Configuración de Hardware Android</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className={`p-6 rounded-[32px] border transition-all ${item.state === 'granted'
                                            ? 'bg-green-500/5 border-green-500/10 opacity-60'
                                            : 'bg-white/5 border-white/5 hover:bg-white/10'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.state === 'granted' ? 'bg-green-500/10' : 'bg-black/40'
                                                }`}>
                                                <item.icon className={`w-6 h-6 ${item.state === 'granted' ? 'text-green-500' : 'text-info/40'
                                                    }`} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-sm font-black text-white uppercase tracking-tight italic">{item.label}</h3>
                                                    {item.state === 'granted' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                                </div>
                                                <p className="text-[10px] text-white/30 font-bold leading-tight mt-0.5">{item.desc}</p>
                                            </div>
                                        </div>

                                        {item.state !== 'granted' ? (
                                            <button
                                                onClick={() => requestPermission(item.id as any)}
                                                className="px-5 py-2.5 bg-info text-dark text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-info/10"
                                            >
                                                Permitir
                                            </button>
                                        ) : (
                                            <span className="text-[10px] text-green-500/50 font-black uppercase tracking-widest italic pr-2">Listo</span>
                                        )}
                                    </div>

                                    {item.state === 'denied' && (
                                        <div className="mt-4 flex items-center gap-2 text-[9px] text-red-400 font-bold bg-red-500/10 p-3 rounded-xl border border-red-500/10">
                                            <AlertTriangle className="w-3 h-3" />
                                            Acceso bloqueado en el sistema. Por favor, habilítalo en la configuración de Android.
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={() => setShowOverlay(false)}
                                disabled={status.geolocation !== 'granted'}
                                className="w-full py-5 bg-white/5 text-white/40 font-black uppercase text-xs tracking-[0.3em] rounded-3xl border border-white/5 hover:bg-white/10 hover:text-white transition-all disabled:opacity-10"
                            >
                                {status.geolocation === 'granted' ? 'Entrar a la Terminal' : 'GPS Requerido para Continuar'}
                            </button>
                            <p className="text-center text-[8px] text-white/10 uppercase tracking-widest mt-6 italic">
                                Hormiruta protege tus datos. Solo accedemos al hardware durante la operación.
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default PermissionGuard;
