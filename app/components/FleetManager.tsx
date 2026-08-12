'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Users, Plus, Trash2, Loader2, AlertCircle, MapPin, CheckCircle2, Truck, ChevronDown, Activity, Route as RouteIcon, Wallet, Copy, RefreshCw, Check, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { VEHICLE_OPTIONS } from '../dashboard/types';

interface FleetMember {
    id: string;
    name: string;
    email: string;
    vehicleType?: string;
    lastLocation?: { lat: number; lng: number; updatedAt?: string } | null;
    alert?: 'outside' | 'no-signal' | null;
}

interface FleetGeofence {
    enabled: boolean;
    lat: number | null;
    lng: number | null;
    radiusKm: number;
    centerLabel?: string;
}

interface FleetSummary {
    totalMembers: number;
    activeCount: number;
    inRouteCount: number;
    inactiveCount: number;
    completedStopsToday: number;
    failedStopsToday: number;
    totalDistanceToday: number;
    expensesMonth: { count: number; total: number };
    outsideGeofence?: number;
}

interface MemberDetail {
    member: FleetMember;
    isActive: boolean;
    period: 'day' | 'week' | 'month';
    trajectory?: { lat: number; lng: number; t: number | null }[];
    stats: {
        routes: number;
        completedStops: number;
        failedStops: number;
        totalDistance: number;
        expenses: number;
        expenseTotal: number;
        successRate: number | null;
    };
}

type ReportPeriod = 'day' | 'week' | 'month';

const PERIOD_OPTIONS: { value: ReportPeriod; label: string }[] = [
    { value: 'day', label: 'Hoy' },
    { value: 'week', label: 'Semana' },
    { value: 'month', label: 'Mes' },
];

const SUMMARY_LABELS: { key: keyof FleetSummary; label: string }[] = [
    { key: 'totalMembers', label: 'Miembros' },
    { key: 'inRouteCount', label: 'En ruta' },
    { key: 'activeCount', label: 'Activos' },
    { key: 'inactiveCount', label: 'Inactivos' },
    { key: 'completedStopsToday', label: 'Paradas hoy' },
];
interface FleetManagerProps {
    onClose: () => void;
}

export default function FleetManager({ onClose }: FleetManagerProps) {
    const [fleetName, setFleetName] = useState('');
    const [fleetId, setFleetId] = useState<string | null>(null);
    const [inviteCode, setInviteCode] = useState<string | null>(null);
    const [inviteExpires, setInviteExpires] = useState<string | null>(null);
    const [joinCode, setJoinCode] = useState('');
    const [joiningFleet, setJoiningFleet] = useState(false);
    const [geofence, setGeofence] = useState<FleetGeofence | null>(null);
    const [members, setMembers] = useState<FleetMember[]>([]);
    const [summary, setSummary] = useState<FleetSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [savingName, setSavingName] = useState(false);
    const [email, setEmail] = useState('');
    const [adding, setAdding] = useState(false);
    const [removingId, setRemovingId] = useState<string | null>(null);
    const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('day');
    const [memberDetails, setMemberDetails] = useState<Record<string, MemberDetail>>({});
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const loadFleet = useCallback(async () => {
        try {
            const res = await fetch('/api/fleet');
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.error || 'No se pudo cargar la flotilla');
                return;
            }
            const data = await res.json();
            setFleetName(data.fleet?.name || '');
            setFleetId(data.fleet?.id || null);
            setMembers(data.members || []);
            setSummary(data.summary || null);
            setGeofence(data.fleet?.geofence || null);
            setInviteCode(data.fleet?.inviteCode || null);
            setInviteExpires(data.fleet?.inviteCodeExpires || null);
        } catch {
            setError('Error de conexión al cargar la flotilla');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadFleet();
    }, [loadFleet]);

    useEffect(() => {
        const timer = setInterval(() => {
            loadFleet();
            if (expandedId) refreshDetail(expandedId, reportPeriod);
        }, 15000);
        return () => clearInterval(timer);
    }, [loadFleet, expandedId, reportPeriod]);

    const showMessage = (msg: string, isError = true) => {
        if (isError) {
            setError(msg);
            setSuccess(null);
        } else {
            setSuccess(msg);
            setError(null);
        }
        setTimeout(() => { setError(null); setSuccess(null); }, 4000);
    };

    const saveName = async () => {
        if (!fleetName.trim()) return;
        setSavingName(true);
        try {
            const res = await fetch('/api/fleet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: fleetName }),
            });
            const data = await res.json();
            if (res.ok) {
                setFleetId(data.fleet?.id || null);
                showMessage('Nombre de flotilla guardado', false);
            } else {
                showMessage(data.error || 'Error al guardar el nombre');
            }
        } catch {
            showMessage('Error de conexión');
        } finally {
            setSavingName(false);
        }
    };

    const saveGeofence = async (next: FleetGeofence) => {
        try {
            const res = await fetch('/api/fleet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ geofence: next }),
            });
            const data = await res.json();
            if (res.ok) {
                setGeofence(data.fleet?.geofence || null);
                showMessage(next.enabled ? 'Zona de alerta guardada' : 'Zona de alerta desactivada', false);
                await loadFleet();
            } else {
                showMessage(data.error || 'Error al guardar la zona');
            }
        } catch {
            showMessage('Error de conexión');
        }
    };

    const useMyLocation = () => {
        if (!navigator.geolocation) {
            showMessage('Tu navegador no soporta geolocalización');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const next: FleetGeofence = geofence
                    ? { ...geofence, lat: pos.coords.latitude, lng: pos.coords.longitude, enabled: true }
                    : { enabled: true, lat: pos.coords.latitude, lng: pos.coords.longitude, radiusKm: 5 };
                setGeofence(next);
                saveGeofence(next);
            },
            () => showMessage('No se pudo obtener tu ubicación')
        );
    };

    const generateInvite = async () => {
        try {
            const res = await fetch('/api/fleet/invite', { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                setInviteCode(data.code);
                setInviteExpires(data.expiresAt);
                showMessage('Código de invitación generado', false);
            } else {
                showMessage(data.error || 'Error al generar el código');
            }
        } catch {
            showMessage('Error de conexión');
        }
    };

    const copyInvite = () => {
        if (!inviteCode) return;
        navigator.clipboard?.writeText(inviteCode).then(
            () => showMessage('Código copiado al portapapeles', false),
            () => showMessage('No se pudo copiar el código')
        );
    };

    const joinAnotherFleet = async () => {
        if (joinCode.trim().length < 8) return;
        setJoiningFleet(true);
        try {
            const res = await fetch('/api/fleet/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: joinCode.trim() }),
            });
            const data = await res.json();
            if (res.ok) {
                setJoinCode('');
                showMessage(data.message || 'Te uniste a la flotilla', false);
            } else {
                showMessage(data.error || 'Error al unirte a la flotilla');
            }
        } catch {
            showMessage('Error de conexión');
        } finally {
            setJoiningFleet(false);
        }
    };

    const addMember = async () => {
        const cleanQuery = email.trim();
        if (!cleanQuery) return;
        setAdding(true);
        try {
            const res = await fetch('/api/fleet/members', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: cleanQuery }),
            });
            const data = await res.json();
            if (res.ok) {
                setEmail('');
                await loadFleet();
                showMessage(`Se agregó a ${data.member?.name || cleanQuery}`, false);
            } else {
                showMessage(data.error || 'Error al agregar miembro');
            }
        } catch {
            showMessage('Error de conexión');
        } finally {
            setAdding(false);
        }
    };

    const removeMember = async (memberId: string) => {
        setRemovingId(memberId);
        try {
            const res = await fetch('/api/fleet/members', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberId }),
            });
            if (res.ok) {
                await loadFleet();
                showMessage('Miembro eliminado de la flotilla', false);
            } else {
                const data = await res.json().catch(() => ({}));
                showMessage(data.error || 'Error al eliminar miembro');
            }
        } catch {
            showMessage('Error de conexión');
        } finally {
            setRemovingId(null);
            setConfirmRemoveId(null);
        }
    };

    const updateVehicle = async (memberId: string, vehicleType: string) => {
        try {
            const res = await fetch(`/api/fleet/members/${memberId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vehicleType }),
            });
            if (res.ok) {
                Object.keys(memberDetails).forEach(key => {
                    if (key.startsWith(`${memberId}:`)) {
                        setMemberDetails(prev => ({
                            ...prev,
                            [key]: { ...prev[key], member: { ...prev[key].member, vehicleType } },
                        }));
                    }
                });
                setMembers(prev => prev.map(m => m.id === memberId ? { ...m, vehicleType } : m));
                showMessage('Vehículo actualizado', false);
            } else {
                const data = await res.json().catch(() => ({}));
                showMessage(data.error || 'Error al actualizar el vehículo');
            }
        } catch {
            showMessage('Error de conexión');
        }
    };

    const formatLastUpdate = (updatedAt?: string) => {
        if (!updatedAt) return null;
        const diff = Date.now() - new Date(updatedAt).getTime();
        if (diff < 60000) return 'hace un momento';
        if (diff < 3600000) return `hace ${Math.floor(diff / 60000)} min`;
        return `hace ${Math.floor(diff / 3600000)} h`;
    };

    const toggleDetail = async (memberId: string, period: ReportPeriod = 'day') => {
        if (expandedId === memberId) {
            setExpandedId(null);
            return;
        }
        setExpandedId(memberId);
        await loadDetail(memberId, period);
    };

    const loadDetail = async (memberId: string, period: ReportPeriod) => {
        const cacheKey = `${memberId}:${period}`;
        if (memberDetails[cacheKey]) return;

        setLoadingDetail(true);
        try {
            const res = await fetch(`/api/fleet/members/${memberId}?period=${period}`);
            if (res.ok) {
                const data = await res.json();
                setMemberDetails(prev => ({ ...prev, [cacheKey]: data }));
            }
        } catch {
            // silencioso: la ficha queda sin stats pero la fila no falla
        } finally {
            setLoadingDetail(false);
        }
    };

    const refreshDetail = async (memberId: string, period: ReportPeriod) => {
        const cacheKey = `${memberId}:${period}`;
        try {
            const res = await fetch(`/api/fleet/members/${memberId}?period=${period}`, { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                setMemberDetails(prev => ({ ...prev, [cacheKey]: data }));
            }
        } catch {
            // silencioso: mantenemos el detalle previo
        }
    };

    const formatMoney = (amount: number) =>
        `$${amount.toLocaleString('es-MX', { maximumFractionDigits: 2 })} MXN`;

    const trajectoryDistance = (points: { lat: number; lng: number }[]) => {
        let km = 0;
        for (let i = 1; i < points.length; i++) {
            const a = points[i - 1];
            const b = points[i];
            const dLat = (b.lat - a.lat) * (Math.PI / 180);
            const dLng = (b.lng - a.lng) * (Math.PI / 180);
            const s = Math.sin(dLat / 2) ** 2 +
                Math.cos(a.lat * (Math.PI / 180)) * Math.cos(b.lat * (Math.PI / 180)) * Math.sin(dLng / 2) ** 2;
            km += 6371 * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
        }
        return km;
    };

    const TrajectoryPolyline = ({ points }: { points: { lat: number; lng: number }[] }) => {
        if (points.length < 2) return null;

        const lats = points.map(p => p.lat);
        const lngs = points.map(p => p.lng);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        const spanLat = maxLat - minLat || 0.0001;
        const spanLng = maxLng - minLng || 0.0001;
        const pad = 0.15;
        const W = 260;
        const H = 140;

        const px = (lat: number) => ((maxLat + pad * spanLat - lat) / (spanLat * (1 + 2 * pad))) * H;
        const py = (lng: number) => ((lng - (minLng - pad * spanLng)) / (spanLng * (1 + 2 * pad))) * W;

        const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${py(p.lng).toFixed(1)},${px(p.lat).toFixed(1)}`).join(' ');
        const first = points[0];
        const last = points[points.length - 1];

        return (
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-28 rounded-xl bg-black/40 border border-white/5">
                <path
                    d={path}
                    fill="none"
                    stroke="rgba(56,189,248,0.7)"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />
                <circle cx={py(first.lng)} cy={px(first.lat)} r="4" fill="rgba(255,255,255,0.35)" />
                <circle cx={py(last.lng)} cy={px(last.lat)} r="5" fill="#38bdf8">
                    <animate attributeName="r" values="5;8;5" dur="1.6s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="1;0.4;1" dur="1.6s" repeatCount="indefinite" />
                </circle>
            </svg>
        );
    };

    const memberStatus = (m: FleetMember): { label: string; dot: string } => {
        const updatedAt = m.lastLocation?.updatedAt;
        if (!updatedAt) return { label: 'Sin señal', dot: 'bg-white/30' };
        const diff = Date.now() - new Date(updatedAt).getTime();
        if (diff < 10 * 60 * 1000) return { label: 'Activo', dot: 'bg-emerald-400' };
        return { label: 'Inactivo', dot: 'bg-white/30' };
    };

    const alertLabel = (m: FleetMember) => {
        if (m.alert === 'outside') return { text: 'FUERA DE ZONA', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
        if (m.alert === 'no-signal') return { text: 'SIN SEÑAL', cls: 'bg-red-500/15 text-red-400 border-red-500/30' };
        return null;
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[210] flex items-start justify-center overflow-y-auto p-4 bg-dark/60 backdrop-blur-sm"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="w-full max-w-xl my-auto bg-dark border border-white/10 rounded-[32px] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)]"
            >
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-black italic tracking-tighter text-white uppercase">Gestión de Flotilla</h2>
                        <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mt-1">Monitoreo GPS de tus unidades</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/70 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {loading ? (
                        <div className="flex flex-col items-center gap-3 py-8 text-center">
                            <Loader2 className="w-6 h-6 text-info animate-spin" />
                            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Cargando flotilla...</p>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs">
                                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                    {success}
                                </div>
                            )}

                            {summary && (
                                <div className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Resumen de la Flotilla</p>
                                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest">
                                            <Activity className="w-3 h-3 text-info" />
                                            <span className="text-white/70">{summary.inRouteCount} en ruta</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                        {SUMMARY_LABELS.map(({ key, label }) => (
                                            <div key={key} className="bg-black/40 rounded-xl border border-white/5 px-2 py-2 text-center">
                                                <p className="text-base font-black text-info italic leading-none">{String(summary[key] ?? 0)}</p>
                                                <p className="text-[9px] font-black text-white/50 uppercase tracking-widest mt-1">{label}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] font-bold text-white/60 uppercase tracking-widest border-t border-white/5 pt-2">
                                        <span className="flex items-center gap-1">
                                            <RouteIcon className="w-3 h-3 text-info/60" />
                                            {summary.totalDistanceToday.toFixed(1)} km hoy
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Wallet className="w-3 h-3 text-info/60" />
                                            {formatMoney(summary.expensesMonth.total)} en gastos este mes
                                        </span>
                                    </div>
                                    {(summary.outsideGeofence ?? 0) > 0 && (
                                        <div className="flex items-center gap-2 p-2 bg-amber-500/10 border border-amber-500/25 rounded-xl text-amber-400 text-[10px] font-black uppercase tracking-widest">
                                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                            {summary.outsideGeofence} unidad(es) fuera de la zona
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-white/60 uppercase tracking-widest pl-1">Nombre de la Flotilla</label>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <div className="flex-1 flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-2xl">
                                        <Users className="w-4 h-4 text-info/60 shrink-0" />
                                        <input
                                            value={fleetName}
                                            onChange={(e) => setFleetName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && saveName()}
                                            placeholder="Ej. Flotilla Norte"
                                            maxLength={60}
                                            className="bg-transparent outline-none text-white text-xs w-full font-bold placeholder:text-white/30"
                                        />
                                    </div>
                                    <button
                                        onClick={saveName}
                                        disabled={savingName || !fleetName.trim()}
                                        className="px-4 py-3 bg-info text-dark rounded-2xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] sm:w-auto w-full"
                                    >
                                        {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar'}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between pl-1">
                                    <label className="text-[10px] font-black text-white/60 uppercase tracking-widest">Zona de Alerta (Geofence)</label>
                                    <button
                                        onClick={() => {
                                            const next: FleetGeofence = geofence
                                                ? { ...geofence, enabled: !geofence.enabled }
                                                : { enabled: true, lat: null, lng: null, radiusKm: 5 };
                                            setGeofence(next);
                                        }}
                                        className={cn(
                                            "relative w-10 h-5 rounded-full transition-colors border",
                                            geofence?.enabled ? "bg-info/30 border-info/50" : "bg-white/5 border-white/15"
                                        )}
                                    >
                                        <span className={cn(
                                            "absolute top-0.5 w-4 h-4 rounded-full transition-all",
                                            geofence?.enabled ? "left-[22px] bg-info" : "left-0.5 bg-white/40"
                                        )} />
                                    </button>
                                </div>

                                {geofence?.enabled && (
                                    <div className="p-3 bg-black/40 rounded-2xl border border-white/10 space-y-2">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black text-white/40 uppercase tracking-widest pl-1">Centro Lat</label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    value={geofence.lat ?? ''}
                                                    onChange={(e) => setGeofence({ ...geofence, lat: e.target.value === '' ? null : Number(e.target.value) })}
                                                    placeholder="Ej. 20.6597"
                                                    className="w-full p-2 bg-white/5 border border-white/10 rounded-xl outline-none text-white text-xs font-bold placeholder:text-white/25"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black text-white/40 uppercase tracking-widest pl-1">Centro Lng</label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    value={geofence.lng ?? ''}
                                                    onChange={(e) => setGeofence({ ...geofence, lng: e.target.value === '' ? null : Number(e.target.value) })}
                                                    placeholder="Ej. -103.3496"
                                                    className="w-full p-2 bg-white/5 border border-white/10 rounded-xl outline-none text-white text-xs font-bold placeholder:text-white/25"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-white/40 uppercase tracking-widest pl-1">Radio (km)</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                min="0.1"
                                                value={geofence.radiusKm}
                                                onChange={(e) => setGeofence({ ...geofence, radiusKm: Number(e.target.value) })}
                                                className="w-full p-2 bg-white/5 border border-white/10 rounded-xl outline-none text-white text-xs font-bold"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-white/40 uppercase tracking-widest pl-1">Etiqueta (opcional)</label>
                                            <input
                                                type="text"
                                                maxLength={80}
                                                value={geofence.centerLabel || ''}
                                                onChange={(e) => setGeofence({ ...geofence, centerLabel: e.target.value })}
                                                placeholder="Ej. Base Monterrey"
                                                className="w-full p-2 bg-white/5 border border-white/10 rounded-xl outline-none text-white text-xs font-bold placeholder:text-white/25"
                                            />
                                        </div>
                                        <div className="flex gap-2 pt-1">
                                            <button
                                                onClick={useMyLocation}
                                                className="flex-1 py-2.5 text-[10px] rounded-xl border border-white/10 text-white/70 font-black uppercase tracking-widest hover:bg-white/5 transition-all"
                                            >
                                                <MapPin className="w-3 h-3 inline mr-1" /> Mi ubicación
                                            </button>
                                            <button
                                                onClick={() => saveGeofence(geofence)}
                                                disabled={geofence.lat == null || geofence.lng == null}
                                                className="flex-1 py-2.5 text-[10px] rounded-xl bg-info text-dark font-black uppercase tracking-widest transition-all disabled:opacity-40 hover:scale-[1.02]"
                                            >
                                                Guardar zona
                                            </button>
                                        </div>
                                        <p className="text-[9px] text-white/40 italic pl-1">
                                            Alerta si un miembro activo se ubica fuera del radio. Sin señal por más de 10 min también alerta.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-white/60 uppercase tracking-widest pl-1">Agregar Miembro</label>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <div className="flex-1 flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-2xl">
                                        <Plus className="w-4 h-4 text-info/60 shrink-0" />
                                        <input
                                            type="text"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && addMember()}
                                            placeholder="nombre o correo del chofer"
                                            className="bg-transparent outline-none text-white text-xs w-full font-bold placeholder:text-white/30"
                                        />
                                    </div>
                                    <button
                                        onClick={addMember}
                                        disabled={adding || !email.trim()}
                                        className="px-4 py-3 bg-info text-dark rounded-2xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] sm:w-auto w-full"
                                    >
                                        {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Agregar'}
                                    </button>
                                </div>
                                <p className="text-[10px] text-white/50 italic pl-1">El miembro debe tener una cuenta en Hormiruta.</p>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-white/60 uppercase tracking-widest pl-1">Código de Invitación</label>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <div className="flex-1 flex items-center justify-between gap-2 p-3 bg-white/5 border border-white/10 rounded-2xl min-w-0">
                                        {inviteCode ? (
                                            <>
                                                <span className="text-base sm:text-sm font-black tracking-[0.25em] text-info italic truncate">{inviteCode}</span>
                                                <button
                                                    onClick={copyInvite}
                                                    className="p-2 bg-info/15 border border-info/30 rounded-xl text-info hover:bg-info/25 transition-all shrink-0"
                                                    title="Copiar código"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                            </>
                                        ) : (
                                            <span className="text-xs font-bold text-white/30">Sin código aún</span>
                                        )}
                                    </div>
                                    <button
                                        onClick={generateInvite}
                                        className="px-4 py-3 bg-info text-dark rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] sm:w-auto w-full"
                                    >
                                        <RefreshCw className="w-4 h-4 inline mr-1" />
                                        Generar
                                    </button>
                                </div>
                                <p className="text-[9px] text-white/40 italic pl-1">
                                    Comparte el código con tus choferes; lo ingresan en su app para unirse (válido 7 días).
                                    {inviteExpires && ` Expira ${new Date(inviteExpires).toLocaleDateString('es-MX')}.`}
                                </p>
                            </div>

                            <div className="space-y-3 border-t border-white/5 pt-3">
                                <label className="text-[10px] font-black text-white/60 uppercase tracking-widest pl-1">Unirme a otra Flotilla</label>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <div className="flex-1 flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-2xl">
                                        <KeyRound className="w-4 h-4 text-info/60 shrink-0" />
                                        <input
                                            value={joinCode}
                                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                            onKeyDown={(e) => e.key === 'Enter' && joinAnotherFleet()}
                                            placeholder="XXXX XXXX"
                                            maxLength={8}
                                            className="bg-transparent outline-none text-white text-xs w-full font-bold tracking-[0.2em] uppercase placeholder:text-white/30"
                                        />
                                    </div>
                                    <button
                                        onClick={joinAnotherFleet}
                                        disabled={joiningFleet || joinCode.trim().length < 8}
                                        className="px-4 py-3 bg-white/10 border border-white/15 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-40 hover:bg-white/15 sm:w-auto w-full"
                                    >
                                        {joiningFleet ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Unirme'}
                                    </button>
                                </div>
                                <p className="text-[9px] text-white/40 italic pl-1">
                                    Puedes tener tu propia flotilla y a la vez ser chofer de otra: ingresa el código que te dio su coordinador.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between px-1">
                                    <label className="text-[10px] font-black text-white/60 uppercase tracking-widest">Miembros ({members.length})</label>
                                    {fleetId && members.length > 0 && (
                                        <span className="text-[10px] font-black text-info uppercase tracking-widest">{fleetId.slice(-6).toUpperCase()}</span>
                                    )}
                                </div>

                                {members.length === 0 ? (
                                    <div className="flex flex-col items-center gap-3 py-8 bg-white/[0.02] border border-dashed border-white/10 rounded-2xl text-center">
                                        <div className="p-3 bg-white/5 rounded-2xl">
                                            <Users className="w-6 h-6 text-white/30" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-white">Sin miembros todavía</p>
                                            <p className="text-[10px] text-white/50 mt-1 uppercase tracking-widest font-black">Agrega choferes por email para verlos en el mapa</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {members.map((m) => {
                                            const status = memberStatus(m);
                                            const detailKey = `${m.id}:${reportPeriod}`;
                                            const detail = memberDetails[detailKey];
                                            const isExpanded = expandedId === m.id;
                                            return (
                                                <div key={m.id} className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
                                                    <div
                                                        onClick={() => toggleDetail(m.id, reportPeriod)}
                                                        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-white/[0.05] transition-colors"
                                                    >
                                                        <div className="w-9 h-9 shrink-0 rounded-xl bg-info/10 flex items-center justify-center">
                                                            <Truck className="w-4 h-4 text-info" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-xs font-black text-white italic truncate">{m.name || 'Sin nombre'}</p>
                                                                <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", status.dot)} />
                                                            </div>
                                                            <p className="text-[10px] text-white/50 font-bold truncate">{m.email}</p>
                                                            {m.lastLocation?.updatedAt && (
                                                                <p className="text-[10px] font-black uppercase tracking-widest mt-0.5 flex items-center gap-1 text-white/40">
                                                                    <MapPin className="w-2.5 h-2.5" />
                                                                    {formatLastUpdate(m.lastLocation.updatedAt)}
                                                                </p>
                                                            )}
                                                            {alertLabel(m) && (
                                                                <span className={cn(
                                                                    "inline-flex items-center px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border mt-1",
                                                                    alertLabel(m)!.cls
                                                                )}>
                                                                    {alertLabel(m)!.text}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {confirmRemoveId === m.id ? (
                                                            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                                                <button
                                                                    onClick={() => removeMember(m.id)}
                                                                    disabled={removingId === m.id}
                                                                    className="p-1.5 bg-emerald-500/15 border border-emerald-500/30 rounded-lg text-emerald-400 hover:bg-emerald-500/25 transition-all"
                                                                    title="Confirmar"
                                                                >
                                                                    {removingId === m.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                                                </button>
                                                                <button
                                                                    onClick={() => setConfirmRemoveId(null)}
                                                                    className="p-1.5 bg-white/5 border border-white/10 rounded-lg text-white/60 hover:bg-white/10 transition-all"
                                                                    title="Cancelar"
                                                                >
                                                                    <X className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setConfirmRemoveId(m.id);
                                                                }}
                                                                className="p-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500/20 transition-all"
                                                                title="Quitar de la flotilla"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <ChevronDown className={cn("w-4 h-4 text-white/40 shrink-0 transition-transform", isExpanded && "rotate-180")} />
                                                    </div>

                                                    <AnimatePresence initial={false}>
                                                        {isExpanded && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                className="overflow-hidden"
                                                            >
                                                                <div className="p-3 pt-0 space-y-2 border-t border-white/5">
                                                                    {!detail && (
                                                                        <div className="flex items-center justify-center gap-2 py-3 text-white/50">
                                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                                            <span className="text-[10px] font-black uppercase tracking-widest">Cargando detalle...</span>
                                                                        </div>
                                                                    )}
                                                                    {detail && (
                                                                        <>
                                                                            <div className="flex p-1 bg-black/40 rounded-xl border border-white/5 mt-2">
                                                                                {PERIOD_OPTIONS.map((opt) => (
                                                                                    <button
                                                                                        key={opt.value}
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            setReportPeriod(opt.value);
                                                                                            loadDetail(m.id, opt.value);
                                                                                        }}
                                                                                        className={cn(
                                                                                            "flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                                                                            reportPeriod === opt.value ? "bg-info text-dark" : "text-white/50 hover:text-white"
                                                                                        )}
                                                                                    >
                                                                                        {opt.label}
                                                                                    </button>
                                                                                ))}
                                                                            </div>

                                                                            <div className="grid grid-cols-2 gap-2 pt-2">
                                                                                <div className="bg-black/40 rounded-xl border border-white/5 px-2.5 py-2">
                                                                                    <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">Estado</p>
                                                                                    <p className={cn("text-xs font-black uppercase tracking-widest mt-0.5", detail.isActive ? "text-emerald-400" : "text-white/40")}>
                                                                                        {detail.isActive ? 'Activo' : 'Inactivo'}
                                                                                    </p>
                                                                                </div>
                                                                                <div className="bg-black/40 rounded-xl border border-white/5 px-2.5 py-2">
                                                                                    <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">Vehículo</p>
                                                                                    <select
                                                                                        value={detail.member.vehicleType || 'truck'}
                                                                                        onChange={(e) => updateVehicle(detail.member.id, e.target.value)}
                                                                                        className="w-full bg-transparent outline-none text-xs font-black text-white uppercase tracking-widest mt-0.5 cursor-pointer [&>option]:bg-dark"
                                                                                    >
                                                                                        {VEHICLE_OPTIONS.map(opt => (
                                                                                            <option key={opt.type} value={opt.type}>{opt.label.toUpperCase()}</option>
                                                                                        ))}
                                                                                    </select>
                                                                                </div>
                                                                            </div>

                                                                <div className="bg-black/40 rounded-xl border border-white/5 px-2.5 py-2">
                                                                        <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">Última ubicación</p>
                                                                        {detail.member.lastLocation ? (
                                                                            <p className="text-[10px] font-bold text-white/80 mt-0.5">
                                                                                {detail.member.lastLocation.lat.toFixed(5)}, {detail.member.lastLocation.lng.toFixed(5)}
                                                                                {detail.member.lastLocation.updatedAt && (
                                                                                    <span className="text-white/40"> · {formatLastUpdate(detail.member.lastLocation.updatedAt)}</span>
                                                                                )}
                                                                            </p>
                                                                        ) : (
                                                                            <p className="text-[10px] font-bold text-white/40 mt-0.5">Sin señal aún</p>
                                                                        )}
                                                                    </div>

                                                                    {detail.trajectory && detail.trajectory.length >= 2 && (
                                                                        <div className="bg-black/40 rounded-xl border border-white/5 p-2.5">
                                                                            <div className="flex items-center justify-between mb-2">
                                                                                <p className="flex items-center gap-1.5 text-[9px] font-black text-white/50 uppercase tracking-widest">
                                                                                    <RouteIcon className="w-3 h-3 text-info/60" />
                                                                                    Recorrido reciente
                                                                                </p>
                                                                                <span className="text-[10px] font-black text-info italic">
                                                                                    {trajectoryDistance(detail.trajectory).toFixed(1)} km
                                                                                </span>
                                                                            </div>
                                                                            <TrajectoryPolyline points={detail.trajectory} />
                                                                        </div>
                                                                    )}


                                                                            <div className="grid grid-cols-4 gap-2">
                                                                                <div className="bg-black/40 rounded-xl border border-white/5 px-2 py-1.5 text-center">
                                                                                    <p className="text-sm font-black text-info italic leading-none">{detail.stats.routes}</p>
                                                                                    <p className="text-[8px] font-black text-white/50 uppercase tracking-widest mt-0.5">Rutas</p>
                                                                                </div>
                                                                                <div className="bg-black/40 rounded-xl border border-white/5 px-2 py-1.5 text-center">
                                                                                    <p className="text-sm font-black text-emerald-400 italic leading-none">{detail.stats.completedStops}</p>
                                                                                    <p className="text-[8px] font-black text-white/50 uppercase tracking-widest mt-0.5">Éxito</p>
                                                                                </div>
                                                                                <div className="bg-black/40 rounded-xl border border-white/5 px-2 py-1.5 text-center">
                                                                                    <p className="text-sm font-black text-red-400 italic leading-none">{detail.stats.failedStops}</p>
                                                                                    <p className="text-[8px] font-black text-white/50 uppercase tracking-widest mt-0.5">Falladas</p>
                                                                                </div>
                                                                                <div className="bg-black/40 rounded-xl border border-white/5 px-2 py-1.5 text-center">
                                                                                    <p className="text-sm font-black text-white italic leading-none">{detail.stats.totalDistance.toFixed(1)}</p>
                                                                                    <p className="text-[8px] font-black text-white/50 uppercase tracking-widest mt-0.5">Km</p>
                                                                                </div>
                                                                            </div>

                                                                            <div className="grid grid-cols-2 gap-2">
                                                                                <div className="flex items-center justify-between bg-black/40 rounded-xl border border-white/5 px-2.5 py-2">
                                                                                    <span className="flex items-center gap-1.5 text-[9px] font-black text-white/50 uppercase tracking-widest">
                                                                                        <Wallet className="w-3 h-3 text-info/60" />
                                                                                        Gastos ({detail.stats.expenses})
                                                                                    </span>
                                                                                    <span className="text-xs font-black text-info italic">{formatMoney(detail.stats.expenseTotal)}</span>
                                                                                </div>
                                                                                <div className="flex items-center justify-between bg-black/40 rounded-xl border border-white/5 px-2.5 py-2">
                                                                                    <span className="flex items-center gap-1.5 text-[9px] font-black text-white/50 uppercase tracking-widest">
                                                                                        <CheckCircle2 className="w-3 h-3 text-emerald-400/60" />
                                                                                        Tasa de éxito
                                                                                    </span>
                                                                                    <span className={cn("text-xs font-black italic", detail.stats.successRate === null ? "text-white/40" : detail.stats.successRate >= 80 ? "text-emerald-400" : detail.stats.successRate >= 50 ? "text-amber-400" : "text-red-400")}>
                                                                                        {detail.stats.successRate === null ? '—' : `${detail.stats.successRate}%`}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <div className="p-6 bg-white/[0.02] border-t border-white/5">
                    <button
                        onClick={onClose}
                        className="w-full py-3 text-xs rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all"
                    >
                        Cerrar
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
