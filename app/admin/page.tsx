'use client';

import { useState, useEffect } from 'react';
import {
    LayoutDashboard, Users, Map as MapIcon, Settings,
    Bell, Search, Filter, Download, MoreVertical, LogOut,
    TrendingUp, DollarSign, Route as RouteIcon, MapPin,
    CheckCircle, Clock, Calendar, Truck, History as HistoryIcon, Wrench, Shield,
    Activity, Cpu, Database, AlertTriangle, Zap, Server, Globe
} from 'lucide-react';
import { cn } from '../lib/utils';
import Map from '../components/NavMap';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState<any>(null);
    const [drivers, setDrivers] = useState<any[]>([]);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [routes, setRoutes] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
    const [showTraffic, setShowTraffic] = useState(true);

    // New Admin Form States
    const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '' });
    const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
    const [adminMsg, setAdminMsg] = useState('');

    // Profile Update States
    const [profileForm, setProfileForm] = useState({ name: '', email: '', password: '' });
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [profileMsg, setProfileMsg] = useState('');

    useEffect(() => {
        if (session?.user) {
            setProfileForm({
                name: session.user.name || '',
                email: session.user.email || '',
                password: ''
            });
        }
    }, [session]);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdatingProfile(true);
        setProfileMsg('');
        try {
            const res = await fetch('/api/admin/update-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    newName: profileForm.name,
                    newEmail: profileForm.email,
                    newPassword: profileForm.password
                })
            });
            const data = await res.json();
            if (res.ok) {
                setProfileMsg('Perfil actualizado con éxito');
                setProfileForm(prev => ({ ...prev, password: '' }));
                // Update session if needed (optional since next-auth usually requires refresh)
            } else {
                setProfileMsg(data.message || 'Error al actualizar perfil');
            }
        } catch (error) {
            setProfileMsg('Error de conexión');
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    // Protection
    useEffect(() => {
        if (status === 'unauthenticated') router.push('/auth/login');
        if (status === 'authenticated' && (session?.user as any)?.role !== 'admin') {
            router.push('/dashboard');
        }
    }, [status, session, router]);

    useEffect(() => {
        if (status === 'authenticated' && (session?.user as any)?.role === 'admin') {
            fetchData();
        }
    }, [status, session]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, driversRes, expensesRes, routesRes] = await Promise.all([
                fetch('/api/admin/stats'),
                fetch('/api/admin/users'),
                fetch('/api/admin/expenses'),
                fetch('/api/admin/routes')
            ]);

            const [statsData, driversData, expensesData, routesData] = await Promise.all([
                statsRes.json(),
                driversRes.json(),
                expensesRes.json(),
                routesRes.json()
            ]);

            setStats(statsData);
            setDrivers(driversData);
            setExpenses(expensesData);
            setRoutes(routesData);
        } catch (error) {
            console.error("Error fetching admin data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Global Search Logic (Google-like word by word)
    const searchQueryWords = searchQuery.toLowerCase().split(' ').filter(w => w.length > 0);

    const matchesSearch = (text: string) => {
        if (!text) return false;
        const lowerText = text.toLowerCase();
        return searchQueryWords.every(word => lowerText.includes(word));
    };

    const filteredDrivers = drivers.filter(d =>
        matchesSearch(d.name) || matchesSearch(d.email) || matchesSearch(d.role) || matchesSearch(d.plan)
    );

    const filteredRoutes = routes.filter(r =>
        matchesSearch(r.name) ||
        matchesSearch((r.userId as any)?.name) ||
        r.stops?.some((s: any) => matchesSearch(s.address))
    );

    const filteredExpenses = expenses.filter(e =>
        matchesSearch(e.type) ||
        matchesSearch(e.description) ||
        matchesSearch((e.driverId as any)?.name)
    );

    useEffect(() => {
        if (searchQuery.length > 0) {
            setActiveTab('search');
        } else if (activeTab === 'search') {
            setActiveTab('overview');
        }
    }, [searchQuery]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
    };

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreatingAdmin(true);
        setAdminMsg('');
        try {
            const res = await fetch('/api/admin/create-admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newAdmin)
            });
            const data = await res.json();
            if (res.ok) {
                setAdminMsg('Administrador creado con éxito');
                setNewAdmin({ name: '', email: '', password: '' });
            } else {
                setAdminMsg(data.message || 'Error al crear administrador');
            }
        } catch (error) {
            setAdminMsg('Error de conexión');
        } finally {
            setIsCreatingAdmin(false);
        }
    };

    if (status === 'loading' || loading) {
        return (
            <div className="h-screen bg-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <img src="/LogoHormiruta.png" alt="Loading" className="w-12 h-12 animate-pulse" />
                    <p className="text-white/30 text-xs font-black uppercase tracking-widest">Iniciando Centro de Control...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#060914] text-foreground font-sans overflow-hidden">
            {/* Admin Sidebar */}
            <aside className="w-20 lg:w-64 bg-[#060914] border-r border-white/5 flex flex-col items-center lg:items-stretch py-8 z-20">
                <div className="mb-12 px-6 flex items-center gap-4">
                    <img src="/LogoHormiruta.png" alt="Admin" className="w-10 h-10" />
                    <div className="hidden lg:block">
                        <h1 className="font-black text-white text-lg tracking-tighter italic">ADMIN</h1>
                        <p className="text-[8px] font-black text-info uppercase tracking-widest">Command Center</p>
                    </div>
                </div>

                <nav className="flex-1 space-y-2 px-4">
                    {[
                        { id: 'overview', icon: LayoutDashboard, label: 'Resumen' },
                        { id: 'fleet', icon: MapIcon, label: 'Mapa de Flota' },
                        { id: 'drivers', icon: Users, label: 'Choferes' },
                        { id: 'routes', icon: RouteIcon, label: 'Itinerarios' },
                        { id: 'history', icon: HistoryIcon, label: 'Historial' },
                        { id: 'maintenance', icon: Wrench, label: 'Mantenimiento' },
                        { id: 'expenses', icon: DollarSign, label: 'Gastos' },
                        { id: 'settings', icon: Settings, label: 'Configuración' },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={cn(
                                "w-full p-4 rounded-2xl flex items-center gap-4 transition-all group",
                                activeTab === item.id
                                    ? "bg-info text-dark shadow-lg shadow-info/10"
                                    : "text-white/30 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5", activeTab === item.id ? "text-dark" : "text-info/50 group-hover:text-info")} />
                            <span className="hidden lg:block text-xs font-black uppercase tracking-tight">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-6 border-t border-white/5 space-y-6">
                    <div className="flex items-center gap-4 px-2">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-info to-blue-600 flex items-center justify-center text-dark font-black">
                            {session?.user?.name?.charAt(0) || 'A'}
                        </div>
                        <div className="hidden lg:block">
                            <p className="text-xs font-black text-white truncate w-32">{session?.user?.name}</p>
                            <p className="text-[10px] text-white/30 truncate">Administrador</p>
                        </div>
                    </div>
                    <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="w-full flex items-center gap-4 p-4 text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="hidden lg:block text-xs font-black uppercase tracking-tight">Salir</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative overflow-hidden">
                {/* Topbar */}
                <header className="h-24 border-b border-white/5 flex items-center justify-between px-10 bg-[#060914]/80 backdrop-blur-2xl z-10 transition-all">
                    <div>
                        <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">
                            {activeTab === 'overview' && 'Panel de Control'}
                            {activeTab === 'fleet' && 'Monitoreo en Vivo'}
                            {activeTab === 'drivers' && 'Gestión de Choferes'}
                            {activeTab === 'routes' && 'Control de Rutas'}
                            {activeTab === 'history' && 'Auditoría Histórica'}
                            {activeTab === 'maintenance' && 'Bitácora de Taller'}
                            {activeTab === 'expenses' && 'Finanzas de Flota'}
                            {activeTab === 'settings' && 'Seguridad de Consola'}
                        </h2>
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mt-1">Hormiruta Fleet Management System</p>
                    </div>

                    <form onSubmit={handleSearch} className="hidden lg:flex items-center gap-4 bg-white/5 px-6 py-3 rounded-2xl border border-white/5 focus-within:border-info/40 focus-within:bg-white/10 transition-all w-96">
                        <Search className="w-4 h-4 text-white/20" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar chofer o correo..."
                            className="bg-transparent border-none outline-none text-xs font-bold text-white placeholder:text-white/20 w-full"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => { setSearchQuery(''); fetchData(); }}
                                className="text-[9px] font-black text-info uppercase tracking-widest hover:text-white transition-colors"
                            >
                                Limpiar
                            </button>
                        )}
                    </form>
                </header>

                <div className="flex-1 overflow-y-auto p-10">
                    {activeTab === 'search' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h3 className="text-sm font-black text-info uppercase tracking-[0.4em] mb-4 italic">Resultados de Búsqueda</h3>
                                <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">Coincidencias encontradas para: "{searchQuery}"</p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                {/* Drivers Match */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                                        <Users className="w-5 h-5 text-white/40" />
                                        <h4 className="text-xs font-black text-white uppercase tracking-widest">Choferes ({filteredDrivers.length})</h4>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        {filteredDrivers.map(d => (
                                            <div key={d._id} onClick={() => { setActiveTab('fleet'); setSelectedDriverId(d._id); }} className="p-5 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/10 transition-all cursor-pointer flex items-center justify-between group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-info to-blue-600 flex items-center justify-center text-dark font-black text-lg">{d.name.charAt(0)}</div>
                                                    <div>
                                                        <p className="text-sm font-black text-white uppercase italic">{d.name}</p>
                                                        <p className="text-[10px] text-white/30 font-bold">{d.email}</p>
                                                    </div>
                                                </div>
                                                <MoreVertical className="w-4 h-4 text-white/10 group-hover:text-info transition-colors" />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Routes Match */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                                        <RouteIcon className="w-5 h-5 text-white/40" />
                                        <h4 className="text-xs font-black text-white uppercase tracking-widest">Rutas ({filteredRoutes.length})</h4>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        {filteredRoutes.map(r => (
                                            <div key={r._id} onClick={() => setActiveTab('routes')} className="p-5 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/10 transition-all cursor-pointer flex items-center justify-between group">
                                                <div>
                                                    <p className="text-sm font-black text-white uppercase italic">{r.name}</p>
                                                    <p className="text-[10px] text-white/30 font-bold">Por: {(r.userId as any)?.name}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-black text-info italic">{r.stops.length} pts</p>
                                                    <p className="text-[9px] text-white/20 font-black uppercase">{new Date(r.date).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'overview' && (
                        <div className="space-y-10">
                            {/* Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                {[
                                    { label: 'Unidades', val: stats?.users || 0, sub: 'Registradas', color: 'text-info', icon: Truck },
                                    { label: 'Rutas', val: stats?.routes || 0, sub: 'Total histórico', color: 'text-purple-400', icon: RouteIcon },
                                    { label: 'Gastos', val: `$${stats?.totalSpent?.toLocaleString() || 0}`, sub: 'Acumulado', color: 'text-emerald-400', icon: DollarSign },
                                    { label: 'Alertas', val: '0', sub: 'Sin incidencias', color: 'text-red-400', icon: Bell },
                                ].map((stat, i) => (
                                    <div key={i} className="bg-white/5 border border-white/5 rounded-[32px] p-8 hover:bg-white/[0.07] transition-all group overflow-hidden relative">
                                        <stat.icon className="absolute -right-4 -bottom-4 w-24 h-24 text-white/[0.02] group-hover:scale-110 transition-transform" />
                                        <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">{stat.label}</p>
                                        <h3 className={cn("text-4xl font-black mt-3 italic tracking-tighter", stat.color)}>{stat.val}</h3>
                                        <p className="text-[10px] text-white/40 mt-2 font-bold">{stat.sub}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                {/* Fleet Map Preview */}
                                <div className="lg:col-span-2 bg-white/5 border border-white/5 rounded-[40px] p-2 overflow-hidden relative min-h-[500px] shadow-2xl">
                                    <div className="absolute top-8 left-8 z-10 bg-black/80 backdrop-blur-xl px-5 py-2.5 rounded-full border border-white/10 shadow-2xl">
                                        <span className="text-[10px] font-black text-white flex items-center gap-3 uppercase tracking-widest">
                                            <span className="w-2.5 h-2.5 bg-info rounded-full animate-pulse shadow-[0_0_10px_#31CCEC]"></span>
                                            Ubicación de Flota
                                        </span>
                                    </div>
                                    <Map
                                        stops={[]}
                                        userVehicle={{ type: 'truck', isActive: false }}
                                        showTraffic={true}
                                        fleetDrivers={filteredDrivers.map(d => ({
                                            id: d._id,
                                            name: d.name,
                                            email: d.email,
                                            lastLocation: d.lastLocation,
                                            vehicleType: d.vehicleType
                                        }))}
                                    />
                                </div>

                                {/* Recent Expenses List */}
                                <div className="bg-white/5 border border-white/5 rounded-[40px] p-8 flex flex-col shadow-2xl">
                                    <div className="flex justify-between items-center mb-8">
                                        <h3 className="font-black text-white uppercase italic tracking-widest text-sm">Gastos Recientes</h3>
                                        <button className="text-[10px] font-black text-info uppercase hover:underline">Ver todo</button>
                                    </div>
                                    <div className="flex-1 space-y-4 overflow-y-auto">
                                        {filteredExpenses.length > 0 ? filteredExpenses.slice(0, 6).map((exp) => (
                                            <div key={exp._id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-black/50 flex items-center justify-center text-xs font-black text-info border border-white/5">
                                                        {exp.type.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-white uppercase tracking-tight">{exp.type}</p>
                                                        <p className="text-[10px] text-white/30 font-bold">{(exp.driverId as any)?.name || 'Sin nombre'}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-white italic">${exp.amount}</p>
                                                    <p className="text-[8px] text-white/20 font-black uppercase mt-1">
                                                        {new Date(exp.date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="flex-1 flex flex-col items-center justify-center text-center p-10 opacity-20">
                                                <DollarSign className="w-12 h-12 mb-4" />
                                                <p className="text-xs font-bold uppercase tracking-widest">No hay gastos registrados</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'fleet' && (
                        <div className="h-full relative animate-in fade-in zoom-in-95 duration-700">
                            <div className="w-full h-full bg-white/5 border border-white/5 rounded-[40px] p-2 overflow-hidden relative shadow-2xl">
                                {/* Map Overlays */}
                                <div className="absolute top-8 left-8 z-10 space-y-4">
                                    <div className="bg-[#060914]/80 backdrop-blur-xl px-6 py-4 rounded-3xl border border-white/10 shadow-2xl">
                                        <span className="text-[10px] font-black text-info flex items-center gap-3 uppercase tracking-[0.2em]">
                                            <span className="w-2.5 h-2.5 bg-info rounded-full animate-pulse shadow-[0_0_15px_#31CCEC]"></span>
                                            Live Fleet Radar
                                        </span>
                                        <h3 className="text-lg font-black text-white italic tracking-tighter mt-2 uppercase">Centro de Monitoreo Global</h3>
                                        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-white/20 uppercase">Unidades</span>
                                                <span className="text-lg font-black text-white">{drivers.filter(d => d.lastLocation).length}</span>
                                            </div>
                                            <div className="w-px h-8 bg-white/5"></div>
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-white/20 uppercase">Estado</span>
                                                <span className="text-sm font-black text-emerald-400 uppercase tracking-widest text-[9px]">En Línea</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Traffic Control */}
                                    <button
                                        onClick={() => setShowTraffic(!showTraffic)}
                                        className={cn(
                                            "flex items-center gap-3 px-6 py-3 rounded-2xl border backdrop-blur-xl transition-all shadow-2xl",
                                            showTraffic ? "bg-info/10 border-info/40 text-info" : "bg-black/80 border-white/10 text-white/30"
                                        )}
                                    >
                                        <div className={cn("w-2 h-2 rounded-full", showTraffic ? "bg-info animate-pulse" : "bg-white/20")} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Capa de Tráfico</span>
                                    </button>
                                </div>

                                <Map
                                    stops={[]}
                                    userVehicle={{ type: 'truck', isActive: false }}
                                    showTraffic={showTraffic}
                                    fleetDrivers={filteredDrivers.map(d => ({
                                        id: d._id,
                                        name: d.name,
                                        email: d.email,
                                        lastLocation: d.lastLocation,
                                        vehicleType: d.vehicleType
                                    }))}
                                    onDriverClick={(id) => setSelectedDriverId(id)}
                                    selectedDriverId={selectedDriverId}
                                />
                            </div>

                            {/* Driver Detail Sidebar - As Absolute Overlay to not push map */}
                            {selectedDriverId && (
                                <div className="absolute top-8 right-8 bottom-8 w-96 bg-[#060914]/95 backdrop-blur-2xl border border-white/10 rounded-[40px] p-10 overflow-y-auto animate-in slide-in-from-right-8 duration-500 shadow-[0_0_100px_rgba(0,0,0,0.8)] z-20">
                                    {(() => {
                                        const driver = drivers.find(d => d._id === selectedDriverId);
                                        const driverRoutes = routes.filter(r => (r.userId as any)?._id === selectedDriverId);
                                        if (!driver) return null;
                                        return (
                                            <div className="space-y-10">
                                                <div className="flex justify-between items-start">
                                                    <div className="w-24 h-24 rounded-[32px] bg-gradient-to-tr from-info to-blue-600 flex items-center justify-center text-4xl font-black text-dark shadow-2xl">
                                                        {driver.name.charAt(0)}
                                                    </div>
                                                    <button
                                                        onClick={() => setSelectedDriverId(null)}
                                                        className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl text-white/20 hover:text-white transition-all border border-white/5"
                                                    >
                                                        <Search className="w-5 h-5 rotate-45" />
                                                    </button>
                                                </div>

                                                <div>
                                                    <h4 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">{driver.name}</h4>
                                                    <p className="text-[11px] font-black text-info uppercase tracking-[0.2em] mt-3">{driver.email}</p>
                                                    <div className="flex items-center gap-2 mt-4">
                                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
                                                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Activo ahora</span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="bg-white/5 p-5 rounded-[28px] border border-white/5">
                                                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-2">Suscripción</p>
                                                        <p className="text-sm font-black text-white uppercase italic tracking-tighter">{driver.plan || 'Free'}</p>
                                                    </div>
                                                    <div className="bg-white/5 p-5 rounded-[28px] border border-white/5">
                                                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-2">Unidad</p>
                                                        <p className="text-sm font-black text-white uppercase italic tracking-tighter">{driver.vehicleType || 'Truck'}</p>
                                                    </div>
                                                </div>

                                                <div className="pt-10 border-t border-white/5">
                                                    <h5 className="text-[11px] font-black text-white/40 uppercase tracking-[0.4em] mb-8 italic">Historial de Operaciones</h5>
                                                    <div className="space-y-5">
                                                        {driverRoutes.length > 0 ? driverRoutes.map(route => (
                                                            <div key={route._id} className="p-6 bg-white/5 rounded-[24px] border border-white/5 hover:bg-white/10 transition-all group relative overflow-hidden">
                                                                <div className="absolute top-0 right-0 p-2 opacity-5">
                                                                    <RouteIcon className="w-12 h-12" />
                                                                </div>
                                                                <div className="flex justify-between items-start mb-3 relative z-10">
                                                                    <p className="text-xs font-black text-white uppercase tracking-tight italic">{route.name}</p>
                                                                    <span className={cn(
                                                                        "text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest",
                                                                        route.status === 'completed' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                                                    )}>{route.status === 'completed' ? 'Finalizada' : 'En Ruta'}</span>
                                                                </div>
                                                                <div className="flex items-center gap-6 text-white/30 relative z-10">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <MapPin className="w-3.5 h-3.5" />
                                                                        <span className="text-[10px] font-black tracking-widest">{route.stops.length} PITS</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Calendar className="w-3.5 h-3.5" />
                                                                        <span className="text-[10px] font-black tracking-widest">{new Date(route.date).toLocaleDateString()}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )) : (
                                                            <div className="py-16 text-center bg-white/[0.02] rounded-[32px] border border-dashed border-white/10">
                                                                <RouteIcon className="w-10 h-10 mx-auto mb-4 opacity-10" />
                                                                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Sin actividad operativa</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'drivers' && (
                        <div className="bg-white/5 border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
                            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                                <h3 className="font-black text-white uppercase italic tracking-widest">Directorio de Choferes</h3>
                                <button className="px-6 py-3 bg-info text-dark font-black text-[10px] uppercase rounded-xl hover:scale-105 active:scale-95 transition-all">Exportar PDF</button>
                            </div>
                            <div className="p-0 overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-white/[0.01] border-b border-white/5">
                                            <th className="p-6 text-[10px] font-black text-white/20 uppercase tracking-widest">Chofer</th>
                                            <th className="p-6 text-[10px] font-black text-white/20 uppercase tracking-widest">Email</th>
                                            <th className="p-6 text-[10px] font-black text-white/20 uppercase tracking-widest">Plan</th>
                                            <th className="p-6 text-[10px] font-black text-white/20 uppercase tracking-widest">Status Sub</th>
                                            <th className="p-6 text-[10px] font-black text-white/20 uppercase tracking-widest text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredDrivers.map((driver) => (
                                            <tr key={driver._id} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="p-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center text-info font-black">
                                                            {driver.name?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-white">{driver.name}</p>
                                                            <p className="text-[10px] text-white/20 font-bold uppercase">{driver.role}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-6 text-sm text-white/60 font-medium">{driver.email}</td>
                                                <td className="p-6">
                                                    <span className={cn(
                                                        "text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-wider",
                                                        driver.plan === 'premium' ? "bg-amber-500/20 text-amber-400" :
                                                            driver.plan === 'fleet' ? "bg-info/20 text-info" : "bg-white/10 text-white/40"
                                                    )}>
                                                        {driver.plan || 'free'}
                                                    </span>
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn(
                                                            "w-2 h-2 rounded-full animate-pulse",
                                                            driver.subscriptionStatus === 'active' ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-white/20"
                                                        )} />
                                                        <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">
                                                            {driver.subscriptionStatus || 'none'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-6 text-right">
                                                    <button className="text-white/20 hover:text-white transition-colors">
                                                        <MoreVertical className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'routes' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredRoutes.length > 0 ? filteredRoutes.map((route) => (
                                <div key={route._id} className="bg-white/5 border border-white/5 rounded-[32px] p-6 hover:bg-white/10 transition-all group border-b-4 border-b-info/20">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="p-3 bg-info/10 rounded-2xl">
                                            <RouteIcon className="w-6 h-6 text-info" />
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] block mb-1">Ejecución</span>
                                            <span className="text-[10px] font-black text-white italic uppercase tracking-widest">{new Date(route.date).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <h4 className="text-lg font-black text-white italic tracking-tighter mb-4 uppercase">{route.name}</h4>
                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-3">
                                            <Users className="w-4 h-4 text-white/20" />
                                            <p className="text-xs font-bold text-white/60">{(route.userId as any)?.name || 'Sin asignar'}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <MapPin className="w-4 h-4 text-white/20" />
                                            <p className="text-xs font-bold text-white/60">{route.stops.length} Paradas totales</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <CheckCircle className="w-4 h-4 text-green-500/50" />
                                            <p className="text-xs font-bold text-green-500/80">{route.stops.filter((s: any) => s.isCompleted).length} Completadas</p>
                                        </div>
                                    </div>
                                    <button className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black text-white uppercase tracking-[0.2em] transition-all border border-white/5">
                                        Auditar Itinerario
                                    </button>
                                </div>
                            )) : (
                                <div className="col-span-full h-80 flex flex-col items-center justify-center opacity-20">
                                    <RouteIcon className="w-16 h-16 mb-4" />
                                    <p className="text-lg font-black uppercase tracking-widest">No se encontraron rutas</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="bg-white/5 border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
                            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                                <h3 className="font-black text-white uppercase italic tracking-widest">Historial de Rutas Completadas</h3>
                            </div>
                            <div className="p-0 overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-white/[0.01] border-b border-white/5">
                                            <th className="p-6 text-[10px] font-black text-white/20 uppercase tracking-widest">ID / Fecha</th>
                                            <th className="p-6 text-[10px] font-black text-white/20 uppercase tracking-widest">Chofer</th>
                                            <th className="p-6 text-[10px] font-black text-white/20 uppercase tracking-widest">Rendimiento</th>
                                            <th className="p-6 text-[10px] font-black text-white/20 uppercase tracking-widest">Puntos</th>
                                            <th className="p-6 text-[10px] font-black text-white/20 uppercase tracking-widest text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredRoutes.filter(r => r.status === 'completed').map((route) => (
                                            <tr key={route._id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="p-6">
                                                    <p className="text-sm font-black text-white tracking-tighter uppercase">{route.name}</p>
                                                    <p className="text-[10px] text-white/20 font-bold">{new Date(route.date).toLocaleDateString()}</p>
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center text-[10px] text-info font-black">
                                                            {route.userId?.name?.charAt(0)}
                                                        </div>
                                                        <span className="text-sm font-bold text-white/80">{route.userId?.name}</span>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-xs font-black text-emerald-400 italic">+{route.totalDistance} km</span>
                                                        <span className="text-[10px] text-white/20 font-bold uppercase">{route.totalTime}</span>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <span className="text-xs font-bold text-white/60">{route.stops?.length} paradas</span>
                                                </td>
                                                <td className="p-6 text-right">
                                                    <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-3 py-1 rounded-full font-black uppercase border border-emerald-500/20">Archivado</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'maintenance' && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white/5 border border-white/5 rounded-[32px] p-8">
                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Total en Mantenimiento</p>
                                    <h3 className="text-4xl font-black text-orange-400 italic tracking-tighter mt-2">
                                        ${expenses.filter(e => e.type === 'MAINTENANCE').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
                                    </h3>
                                </div>
                                <div className="bg-white/5 border border-white/5 rounded-[32px] p-8">
                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Último Servicio</p>
                                    <h4 className="text-lg font-black text-white mt-2 uppercase italic tracking-widest">
                                        {expenses.filter(e => e.type === 'MAINTENANCE')[0]
                                            ? new Date(expenses.filter(e => e.type === 'MAINTENANCE')[0].date).toLocaleDateString()
                                            : 'No registrado'}
                                    </h4>
                                </div>
                            </div>

                            <div className="bg-white/5 border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
                                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                                    <h3 className="font-black text-white uppercase italic tracking-widest text-sm">Bitácora de Reparaciones</h3>
                                </div>
                                <div className="p-0 overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-white/[0.01] border-b border-white/5">
                                                <th className="p-6 text-[10px] font-black text-white/20 uppercase tracking-widest">Fecha</th>
                                                <th className="p-6 text-[10px] font-black text-white/20 uppercase tracking-widest">Unidad / Chofer</th>
                                                <th className="p-6 text-[10px] font-black text-white/20 uppercase tracking-widest">Descripción del Servicio</th>
                                                <th className="p-6 text-[10px] font-black text-white/20 uppercase tracking-widest text-right">Inversión</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {expenses.filter(e => e.type === 'MAINTENANCE').map((exp) => (
                                                <tr key={exp._id} className="hover:bg-white/[0.02] transition-colors">
                                                    <td className="p-6">
                                                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                                                            {new Date(exp.date).toLocaleDateString()}
                                                        </span>
                                                    </td>
                                                    <td className="p-6 text-sm font-black text-white/80">{exp.driverId?.name}</td>
                                                    <td className="p-6 text-sm text-white/60">{exp.description || 'General Maintenance'}</td>
                                                    <td className="p-6 text-right font-black text-orange-400 italic text-lg">${exp.amount}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'expenses' && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-gradient-to-br from-info to-blue-600 rounded-[32px] p-8 text-dark shadow-xl shadow-info/10">
                                    <TrendingUp className="w-8 h-8 mb-4 opacity-50" />
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Gasto Total Acumulado</p>
                                    <h3 className="text-4xl font-black italic tracking-tighter mt-2">${stats?.totalSpent?.toLocaleString() || 0}</h3>
                                </div>
                                <div className="bg-white/5 border border-white/5 rounded-[32px] p-8">
                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Gasto en Combustible</p>
                                    <h3 className="text-3xl font-black text-white italic mt-2">
                                        {stats?.totalSpent > 0
                                            ? Math.round(((stats?.breakdown?.FUEL || 0) / stats.totalSpent) * 100)
                                            : 0}%
                                    </h3>
                                    <div className="w-full h-1.5 bg-white/5 rounded-full mt-4 overflow-hidden">
                                        <div
                                            className="h-full bg-info transition-all duration-1000"
                                            style={{ width: `${stats?.totalSpent > 0 ? ((stats?.breakdown?.FUEL || 0) / stats.totalSpent) * 100 : 0}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="bg-white/5 border border-white/5 rounded-[32px] p-8">
                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Ticket Promedio</p>
                                    <h3 className="text-3xl font-black text-white italic mt-2">${stats?.expenses > 0 ? (stats.totalSpent / stats.expenses).toFixed(2) : 0}</h3>
                                    <p className="text-[10px] text-white/40 mt-2 font-bold uppercase tracking-widest">Por cada registro</p>
                                </div>
                            </div>

                            <div className="bg-white/5 border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
                                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                                    <h3 className="font-black text-white uppercase italic tracking-widest">Libro Mayor de Gastos</h3>
                                    <button className="p-3 bg-white/5 rounded-xl text-white/50"><Filter className="w-5 h-5" /></button>
                                </div>
                                <div className="p-0 overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-white/[0.01] border-b border-white/5">
                                                <th className="p-6 text-[10px] font-black text-white/20 uppercase tracking-widest">Tipo</th>
                                                <th className="p-6 text-[10px] font-black text-white/20 uppercase tracking-widest">Chofer</th>
                                                <th className="p-6 text-[10px] font-black text-white/20 uppercase tracking-widest">Descripción</th>
                                                <th className="p-6 text-[10px] font-black text-white/20 uppercase tracking-widest">Fecha</th>
                                                <th className="p-6 text-[10px] font-black text-white/20 uppercase tracking-widest text-right">Monto</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {filteredExpenses.map((exp) => (
                                                <tr key={exp._id} className="hover:bg-white/[0.02] transition-colors">
                                                    <td className="p-6">
                                                        <span className="text-[10px] font-black text-info bg-info/10 px-3 py-1 rounded-lg uppercase border border-info/20">
                                                            {exp.type}
                                                        </span>
                                                    </td>
                                                    <td className="p-6 text-sm font-black text-white/80">{(exp.driverId as any)?.name}</td>
                                                    <td className="p-6 text-sm text-white/40 italic">{exp.description || 'Sin descripción'}</td>
                                                    <td className="p-6 text-[10px] font-black text-white/30 uppercase tracking-widest">
                                                        {new Date(exp.date).toLocaleDateString()}
                                                    </td>
                                                    <td className="p-6 text-right font-black text-white italic text-lg">${exp.amount}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Personal Profile Update Form */}
                            <form onSubmit={handleProfileUpdate} className="bg-white/5 border border-white/5 rounded-[40px] p-8 lg:p-12 space-y-8 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <Shield className="w-32 h-32 rotate-12 text-info" />
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-3xl font-black text-white italic tracking-tighter mb-2 uppercase">Mis Credenciales</h3>
                                    <p className="text-white/40 text-sm font-medium">Actualiza tu información personal de acceso al Centro de Control.</p>
                                </div>

                                <div className="grid grid-cols-1 gap-6 relative z-10">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-2">Mi Nombre</label>
                                        <input
                                            type="text"
                                            value={profileForm.name}
                                            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-white placeholder:text-white/10 focus:outline-none focus:border-info/50 transition-all font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-2">Mi Correo Electrónico</label>
                                        <input
                                            type="email"
                                            value={profileForm.email}
                                            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-white placeholder:text-white/10 focus:outline-none focus:border-info/50 transition-all font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-2">Nueva Contraseña (Opcional)</label>
                                        <input
                                            type="password"
                                            value={profileForm.password}
                                            onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                                            placeholder="••••••••"
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-white placeholder:text-white/10 focus:outline-none focus:border-info/50 transition-all font-bold"
                                        />
                                        <p className="text-[9px] text-white/20 font-black uppercase tracking-widest ml-2">Dejar vacío para mantener la actual</p>
                                    </div>
                                </div>

                                {profileMsg && (
                                    <div className={cn(
                                        "p-4 rounded-2xl text-xs font-black uppercase tracking-widest text-center",
                                        profileMsg.includes('éxito') ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                                    )}>
                                        {profileMsg}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isUpdatingProfile}
                                    className="w-full py-5 bg-info text-dark font-black rounded-2xl shadow-xl shadow-info/10 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {isUpdatingProfile ? 'PROCESANDO...' : 'ACTUALIZAR MIS CREDENCIALES'}
                                </button>
                            </form>

                            {/* Create New Admin Form */}
                            <div className="bg-gradient-to-br from-info/20 to-blue-600/10 border border-info/20 rounded-[40px] p-8 lg:p-12 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <Settings className="w-32 h-32 rotate-12" />
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-3xl font-black text-white italic tracking-tighter mb-2 uppercase">Gestión de Accesos</h3>
                                    <p className="text-white/40 text-sm font-medium">Crea nuevas cuentas de administrador con privilegios totales sobre el Command Center.</p>
                                </div>
                            </div>

                            <form onSubmit={handleCreateAdmin} className="bg-white/5 border border-white/5 rounded-[40px] p-8 lg:p-12 space-y-8 shadow-2xl">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-2">Nombre del Administrador</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={newAdmin.name}
                                                onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                                                placeholder="Ej. Sistema Central"
                                                className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-white placeholder:text-white/10 focus:outline-none focus:border-info/50 focus:ring-1 focus:ring-info/30 transition-all font-bold"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-2">Correo Electrónico</label>
                                        <input
                                            type="email"
                                            value={newAdmin.email}
                                            onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                                            placeholder="admin@hormiruta.com"
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-white placeholder:text-white/10 focus:outline-none focus:border-info/50 focus:ring-1 focus:ring-info/30 transition-all font-bold"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-2">Contraseña Maestra</label>
                                        <input
                                            type="password"
                                            value={newAdmin.password}
                                            onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                                            placeholder="••••••••"
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-white placeholder:text-white/10 focus:outline-none focus:border-info/50 focus:ring-1 focus:ring-info/30 transition-all font-bold"
                                            required
                                        />
                                    </div>
                                </div>

                                {adminMsg && (
                                    <div className={cn(
                                        "p-4 rounded-2xl text-xs font-black uppercase tracking-widest text-center animate-bounce",
                                        adminMsg.includes('éxito') ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                                    )}>
                                        {adminMsg}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isCreatingAdmin}
                                    className="w-full py-5 bg-white text-black hover:bg-info hover:text-dark font-black rounded-2xl shadow-[0_20px_40px_rgba(255,255,255,0.1)] transition-all flex items-center justify-center gap-3 group disabled:opacity-50"
                                >
                                    {isCreatingAdmin ? 'CREANDO...' : 'AUTORIZAR NUEVO ADMIN'}
                                    <Shield className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
