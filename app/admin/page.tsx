'use client';

import { useState, useEffect } from 'react';
import {
    LayoutDashboard, Users, Map as MapIcon, Settings,
    Bell, Search, Filter, Download, MoreVertical, LogOut,
    TrendingUp, DollarSign, Route as RouteIcon, MapPin,
    Check, CheckCircle, Clock, Calendar, Truck, History as HistoryIcon, Wrench, Shield,
    Activity, Cpu, Database, AlertTriangle, Zap, Server, Globe, Trash2, CreditCard, Save, Loader2, ArrowLeft, Crown, Sun, Moon,
    Plus, Edit3, X
} from 'lucide-react';
import { cn } from '../lib/utils';
import dynamic from 'next/dynamic';
const Map = dynamic(() => import('../components/NavMap'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full rounded-3xl border border-white/5 bg-[#0b1121] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-info" />
        </div>
    ),
});
import { ModalContainer } from '../components/ModalContainer';
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
    const [mapAdminTheme, setMapAdminTheme] = useState<'light' | 'dark'>('dark');

    // User Detail State
    const [selectedUserDetail, setSelectedUserDetail] = useState<any>(null);
    const [userDetailTab, setUserDetailTab] = useState<'routes' | 'expenses' | 'actions'>('routes');
    const [isUpdatingUser, setIsUpdatingUser] = useState(false);
    const [updateMsg, setUpdateMsg] = useState('');
    const [resetPwdForm, setResetPwdForm] = useState({ password: '', confirm: '' });
    const [resetPwdMsg, setResetPwdMsg] = useState('');
    const [isResettingPwd, setIsResettingPwd] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [openMenuUserId, setOpenMenuUserId] = useState<string | null>(null);

    // Route Audit State
    const [selectedRouteAudit, setSelectedRouteAudit] = useState<any>(null);

    // Modal Dialogs State
    const [confirmDialog, setConfirmDialog] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
    const [alertDialog, setAlertDialog] = useState<{ title: string; message: string } | null>(null);

    // Pricing State
    const [sosAlerts, setSosAlerts] = useState<any[]>([]);
    const [loadingSos, setLoadingSos] = useState(false);
    const [pricingPlans, setPricingPlans] = useState<any[]>([]);
    const [savingPricing, setSavingPricing] = useState(false);
    const [pricingMsg, setPricingMsg] = useState('');
    const [usageData, setUsageData] = useState<any | null>(null);
    const [editingPlan, setEditingPlan] = useState<any | null>(null);
    const [showNewPlanForm, setShowNewPlanForm] = useState(false);
    const [newPlanForm, setNewPlanForm] = useState({
        name: '', price: 0, currency: 'MXN', trialDays: 0, durationDays: 0,
        description: '', features: '',
        highlight: false, active: true, grantsPro: false, grantsFleet: false,
        color: 'from-blue-400 to-indigo-500',
        cta: '', ctaLink: '', serviceTime: 5, maxMembers: 0,
    });

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

            const pricingRes = await fetch('/api/admin/pricing');
            const pricingData = await pricingRes.json();
            if (pricingRes.ok) {
                setPricingPlans(pricingData.plans || []);
            }
        } catch (error) {
            console.error("Error fetching admin data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Global Search Logic (Google-like word by word)
    const searchQueryWords = searchQuery.toLowerCase().split(' ').filter(w => w.length > 0);

    // Load Google Maps usage estimate when the tab is opened
    useEffect(() => {
        if (activeTab !== 'usage' || usageData) return;
        fetch('/api/usage')
            .then((r) => r.json())
            .then(setUsageData)
            .catch(() => setUsageData(null));
    }, [activeTab, usageData]);

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

    const fetchSosAlerts = async () => {
        setLoadingSos(true);
        try {
            const res = await fetch('/api/admin/sos');
            if (res.ok) setSosAlerts(await res.json());
        } catch (e) {
            console.error('Error fetching SOS alerts', e);
        } finally {
            setLoadingSos(false);
        }
    };

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

    const handleResetHistory = async (userId: string) => {
        setConfirmDialog({
            title: 'Restablecer Historial',
            message: '¿Restablecer todo el historial de este usuario? Se borrarán todas sus rutas y gastos, pero la cuenta se mantendrá intacta.',
            onConfirm: async () => {
                setConfirmDialog(null);
                try {
                    const res = await fetch(`/api/admin/users/${userId}/reset-history`, { method: 'POST' });
                    if (res.ok) {
                        if (selectedUserDetail?.user?._id === userId) fetchUserDetail(userId);
                        fetchData();
                    } else {
                        const data = await res.json();
                        setAlertDialog({ title: 'Error', message: data.error || 'Error al restablecer historial' });
                    }
                } catch {
                    setAlertDialog({ title: 'Error de conexión', message: 'No se pudo conectar con el servidor' });
                }
            }
        });
    };

    const handleAddPlan = async () => {
        setSavingPricing(true);
        setPricingMsg('');
        try {
            const res = await fetch('/api/admin/pricing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newPlanForm,
                    features: newPlanForm.features.split('\n').filter(f => f.trim()),
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setPricingPlans(data.plans || []);
                setPricingMsg('Plan agregado con éxito');
                setShowNewPlanForm(false);
                setNewPlanForm({
                    name: '', price: 0, currency: 'MXN', trialDays: 0, durationDays: 0,
                    description: '', features: '',
                    highlight: false, active: true, grantsPro: false, grantsFleet: false,
                    color: 'from-blue-400 to-indigo-500',
                    cta: '', ctaLink: '', serviceTime: 5, maxMembers: 0,
                });
            } else {
                setPricingMsg(data.error || 'Error al agregar plan');
            }
        } catch {
            setPricingMsg('Error de conexión');
        } finally {
            setSavingPricing(false);
        }
    };

    const handleUpdatePlan = async () => {
        if (!editingPlan) return;
        setSavingPricing(true);
        setPricingMsg('');
        try {
            const res = await fetch('/api/admin/pricing', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...editingPlan,
                    features: typeof editingPlan.features === 'string'
                        ? editingPlan.features.split('\n').filter((f: string) => f.trim())
                        : editingPlan.features,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setPricingPlans(data.plans || []);
                setPricingMsg('Plan actualizado con éxito');
                setEditingPlan(null);
            } else {
                setPricingMsg(data.error || 'Error al actualizar plan');
            }
        } catch {
            setPricingMsg('Error de conexión');
        } finally {
            setSavingPricing(false);
        }
    };

    const handleDeletePlan = async (id: string) => {
        setPricingMsg('');
        try {
            const res = await fetch('/api/admin/pricing', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            const data = await res.json();
            if (res.ok) {
                setPricingPlans(data.plans || []);
                setPricingMsg('Plan eliminado con éxito');
            } else {
                setPricingMsg(data.error || 'Error al eliminar plan');
            }
        } catch {
            setPricingMsg('Error de conexión');
        }
    };

    const startEditPlan = (plan: any) => {
        setEditingPlan({
            ...plan,
            features: Array.isArray(plan.features) ? plan.features.join('\n') : '',
        });
    };

    const handleDeleteUser = async (userId: string) => {
        setConfirmDialog({
            title: 'Eliminar Usuario',
            message: '¿Estás seguro de que deseas eliminar este usuario? Esta acción es irreversible y borrará TODO su historial, rutas, gastos y lo eliminará del mapa.',
            onConfirm: async () => {
                setConfirmDialog(null);
                try {
                    const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
                    if (res.ok) {
                        if (selectedDriverId === userId) setSelectedDriverId(null);
                        if (selectedUserDetail?.user?._id === userId) setSelectedUserDetail(null);
                        fetchData();
                    } else {
                        const data = await res.json();
                        setAlertDialog({ title: 'Error', message: data.error || 'Error al eliminar usuario' });
                    }
                } catch {
                    setAlertDialog({ title: 'Error de conexión', message: 'No se pudo conectar con el servidor' });
                }
            }
        });
    };

    // Close dropdown menu on outside click
    useEffect(() => {
        if (!openMenuUserId) return;
        const handler = () => setOpenMenuUserId(null);
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, [openMenuUserId]);

    const fetchUserDetail = async (userId: string) => {
        setLoadingDetail(true);
        setSelectedUserDetail(null);
        try {
            const res = await fetch(`/api/admin/users/${userId}/detail`);
            if (res.ok) {
                const data = await res.json();
                setSelectedUserDetail(data);
                setUserDetailTab('routes');
                setUpdateMsg('');
                setResetPwdMsg('');
            } else {
                const data = await res.json();
                setAlertDialog({ title: 'Error', message: data.error || 'Error al cargar detalle del usuario' });
            }
        } catch {
            setAlertDialog({ title: 'Error de conexión', message: 'No se pudo conectar con el servidor' });
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleUpdateUser = async (userId: string, updates: Record<string, any>) => {
        setIsUpdatingUser(true);
        setUpdateMsg('');
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            const data = await res.json();
            if (res.ok) {
                setUpdateMsg('Usuario actualizado con éxito');
                fetchUserDetail(userId);
                fetchData();
            } else {
                setUpdateMsg(data.error || 'Error al actualizar');
            }
        } catch (error) {
            console.error("Error updating user:", error);
            setUpdateMsg('Error de conexión');
        } finally {
            setIsUpdatingUser(false);
        }
    };

    const handleResetUserPassword = async (userId: string) => {
        if (resetPwdForm.password.length < 6) {
            setResetPwdMsg('La contraseña debe tener al menos 6 caracteres');
            return;
        }
        if (resetPwdForm.password !== resetPwdForm.confirm) {
            setResetPwdMsg('Las contraseñas no coinciden');
            return;
        }

        setIsResettingPwd(true);
        setResetPwdMsg('');
        try {
            const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: resetPwdForm.password }),
            });
            const data = await res.json();
            if (res.ok) {
                setResetPwdMsg('Contraseña actualizada con éxito');
                setResetPwdForm({ password: '', confirm: '' });
            } else {
                setResetPwdMsg(data.error || 'Error al actualizar contraseña');
            }
        } catch (error) {
            console.error("Error resetting password:", error);
            setResetPwdMsg('Error de conexión');
        } finally {
            setIsResettingPwd(false);
        }
    };

    if (status === 'loading' || loading) {
        return (
            <div className="h-screen bg-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <img src="/LogoHormiruta.png" alt="Loading" className="w-12 h-12 animate-pulse" />
                    <p className="text-white/60 text-xs font-black uppercase tracking-widest">Iniciando Centro de Control...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#060914] text-foreground font-sans overflow-hidden">
            {/* Admin Sidebar */}
            <aside className="w-14 max-[340px]:w-12 lg:w-64 bg-[#060914] border-r border-white/5 flex flex-col items-center lg:items-stretch py-6 lg:py-8 z-20">
                <div className="mb-8 lg:mb-12 px-4 lg:px-6 flex items-center gap-4">
                    <img src="/LogoHormiruta.png" alt="Admin" className="w-8 h-8 lg:w-10 lg:h-10" />
                    <div className="hidden lg:block">
                        <h1 className="font-black text-white text-lg tracking-tighter italic">ADMIN</h1>
                        <p className="text-[10px] font-black text-info uppercase tracking-widest">Command Center</p>
                    </div>
                </div>

                <nav className="flex-1 space-y-1 lg:space-y-2 px-2 lg:px-4">
                    {[
                        { id: 'overview', icon: LayoutDashboard, label: 'Resumen' },
                        { id: 'fleet', icon: MapIcon, label: 'Mapa de Flota' },
                        { id: 'drivers', icon: Users, label: 'Choferes' },
                        { id: 'routes', icon: RouteIcon, label: 'Itinerarios' },
                        { id: 'history', icon: HistoryIcon, label: 'Historial' },
                        { id: 'alerts', icon: Bell, label: 'Alertas SOS' },
                        { id: 'maintenance', icon: Wrench, label: 'Mantenimiento' },
                        { id: 'expenses', icon: DollarSign, label: 'Gastos' },
                        { id: 'pricing', icon: CreditCard, label: 'Planes' },
                        { id: 'usage', icon: Activity, label: 'Google Maps' },
                        { id: 'settings', icon: Settings, label: 'Configuración' },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={cn(
                                "w-full p-2 lg:p-4 rounded-xl lg:rounded-2xl flex items-center gap-3 lg:gap-4 transition-all group",
                                activeTab === item.id
                                    ? "bg-info text-dark shadow-lg shadow-info/10"
                                    : "text-white/60 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <item.icon className={cn("w-4 h-4 lg:w-5 lg:h-5", activeTab === item.id ? "text-dark" : "text-info/50 group-hover:text-info")} />
                            <span className="hidden lg:block text-xs font-black uppercase tracking-tight">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-3 lg:p-6 border-t border-white/5 space-y-3 lg:space-y-6">
                    <div className="flex items-center gap-3 lg:gap-4 px-1 lg:px-2">
                        <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl lg:rounded-2xl bg-gradient-to-tr from-info to-blue-600 flex items-center justify-center text-dark font-black text-xs lg:text-base">
                            {session?.user?.name?.charAt(0) || 'A'}
                        </div>
                        <div className="hidden lg:block">
                            <p className="text-xs font-black text-white truncate w-32">{session?.user?.name}</p>
                            <p className="text-[10px] text-white/60 truncate">Administrador</p>
                        </div>
                    </div>
                    <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="w-full flex items-center gap-3 lg:gap-4 p-2 lg:p-4 text-red-500 hover:bg-red-500/10 rounded-xl lg:rounded-2xl transition-all"
                    >
                        <LogOut className="w-4 h-4 lg:w-5 lg:h-5" />
                        <span className="hidden lg:block text-xs font-black uppercase tracking-tight">Salir</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative overflow-x-hidden overflow-y-auto">
                {/* Topbar */}
                <header className="h-20 lg:h-24 border-b border-white/5 flex items-center justify-between px-3 sm:px-10 bg-[#060914]/80 backdrop-blur-2xl z-10 transition-all">
                    <div>
                        <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-white italic tracking-tighter uppercase">
                            {activeTab === 'overview' && 'Panel de Control'}
                            {activeTab === 'fleet' && 'Monitoreo en Vivo'}
                            {activeTab === 'drivers' && 'Gestión de Choferes'}
                            {activeTab === 'routes' && 'Control de Rutas'}
                            {activeTab === 'history' && 'Auditoría Histórica'}
                            {activeTab === 'maintenance' && 'Bitácora de Taller'}
                            {activeTab === 'expenses' && 'Finanzas de Flota'}
                            {activeTab === 'pricing' && 'Planes y Precios'}
                            {activeTab === 'usage' && 'Uso de Google Maps'}
                            {activeTab === 'settings' && 'Seguridad de Consola'}
                        </h2>
                        <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.4em] mt-1">Hormiruta Fleet Management System</p>
                    </div>

                    <form onSubmit={handleSearch} className="hidden lg:flex items-center gap-4 bg-white/5 px-6 py-3 rounded-2xl border border-white/5 focus-within:border-info/40 focus-within:bg-white/10 transition-all w-96">
                        <Search className="w-4 h-4 text-white/50" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar chofer o correo..."
                            className="bg-transparent border-none outline-none text-xs font-bold text-white placeholder:text-white/50 w-full"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => { setSearchQuery(''); fetchData(); }}
                                className="text-[10px] font-black text-info uppercase tracking-widest hover:text-white transition-colors"
                            >
                                Limpiar
                            </button>
                        )}
                    </form>
                </header>

                <div className="flex-1 overflow-y-auto p-4 sm:p-10">
                    {activeTab === 'search' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h3 className="text-sm font-black text-info uppercase tracking-[0.4em] mb-4 italic">Resultados de Búsqueda</h3>
                                <p className="text-white/50 text-[10px] font-black uppercase tracking-widest">Coincidencias encontradas para: "{searchQuery}"</p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                {/* Drivers Match */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                                        <Users className="w-5 h-5 text-white/70" />
                                        <h4 className="text-xs font-black text-white uppercase tracking-widest">Choferes ({filteredDrivers.length})</h4>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        {filteredDrivers.map(d => (
                                            <div key={d._id} onClick={() => { setActiveTab('fleet'); setSelectedDriverId(d._id); }} className="p-5 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/10 transition-all cursor-pointer flex items-center justify-between group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-info to-blue-600 flex items-center justify-center text-dark font-black text-lg">{d.name.charAt(0)}</div>
                                                    <div>
                                                        <p className="text-sm font-black text-white uppercase italic">{d.name}</p>
                                                        <p className="text-[10px] text-white/60 font-bold">{d.email}</p>
                                                    </div>
                                                </div>
                                                <MoreVertical className="w-4 h-4 text-white/40 group-hover:text-info transition-colors" />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Routes Match */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                                        <RouteIcon className="w-5 h-5 text-white/70" />
                                        <h4 className="text-xs font-black text-white uppercase tracking-widest">Rutas ({filteredRoutes.length})</h4>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        {filteredRoutes.map(r => (
                                            <div key={r._id} onClick={() => setActiveTab('routes')} className="p-5 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/10 transition-all cursor-pointer flex items-center justify-between group">
                                                <div>
                                                    <p className="text-sm font-black text-white uppercase italic">{r.name}</p>
                                                    <p className="text-[10px] text-white/60 font-bold">Por: {(r.userId as any)?.name}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-black text-info italic">{r.stops.length} pts</p>
                                                    <p className="text-[10px] text-white/50 font-black uppercase">{new Date(r.date).toLocaleDateString()}</p>
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
                            {/* Subscription Metrics */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <div className="bg-white/5 border border-white/5 rounded-[24px] p-5 text-center">
                                    <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Usuarios</p>
                                    <h3 className="text-3xl font-black text-white italic mt-2">{stats?.users || 0}</h3>
                                </div>
                                <div className="bg-white/5 border border-white/5 rounded-[24px] p-5 text-center">
                                    <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Activos</p>
                                    <h3 className="text-3xl font-black text-blue-300 italic mt-2">{stats?.subscriptions?.active || 0}</h3>
                                </div>
                                <div className="bg-white/5 border border-white/5 rounded-[24px] p-5 text-center">
                                    <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Prueba</p>
                                    <h3 className="text-3xl font-black text-amber-400 italic mt-2">{stats?.subscriptions?.trialing || 0}</h3>
                                </div>
                                <div className="bg-white/5 border border-white/5 rounded-[24px] p-5 text-center">
                                    <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Canceladas</p>
                                    <h3 className="text-3xl font-black text-red-400 italic mt-2">{stats?.subscriptions?.cancelled || 0}</h3>
                                </div>
                                <div className="bg-white/5 border border-white/5 rounded-[24px] p-5 text-center">
                                    <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Gratis</p>
                                    <h3 className="text-3xl font-black text-white/70 italic mt-2">{stats?.subscriptions?.free || 0}</h3>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                {[
                                    { label: 'Unidades', val: stats?.users || 0, sub: 'Registradas', color: 'text-info', icon: Truck },
                                    { label: 'Rutas', val: stats?.routes || 0, sub: 'Total histórico', color: 'text-purple-400', icon: RouteIcon },
                                    { label: 'Gastos', val: `$${stats?.totalSpent?.toLocaleString() || 0}`, sub: 'Acumulado', color: 'text-blue-300', icon: DollarSign },
                                    { label: 'Alertas SOS', val: stats?.sosAlerts || 0, sub: 'Histórico', color: 'text-red-400', icon: Bell },
                                ].map((stat, i) => (
                                    <div key={i} className="bg-white/5 border border-white/5 rounded-[32px] p-8 hover:bg-white/[0.07] transition-all group overflow-hidden relative">
                                        <stat.icon className="absolute -right-4 -bottom-4 w-24 h-24 text-white/[0.02] group-hover:scale-110 transition-transform" />
                                        <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">{stat.label}</p>
                                        <h3 className={cn("text-4xl font-black mt-3 italic tracking-tighter", stat.color)}>{stat.val}</h3>
                                        <p className="text-[10px] text-white/70 mt-2 font-bold">{stat.sub}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                {/* Fleet Map Preview */}
                                <div className="lg:col-span-2 bg-white/5 border border-white/5 rounded-[40px] p-2 overflow-hidden relative min-h-[500px] shadow-2xl">
                                    <div className="absolute top-8 left-8 z-10 bg-black/80 backdrop-blur-xl px-5 py-2.5 rounded-full border border-white/10 shadow-2xl">
                                        <span className="text-[10px] font-black text-white flex items-center gap-3 uppercase tracking-widest">
                                            <span className="w-2.5 h-2.5 bg-info rounded-full animate-pulse shadow-[0_0_10px_#60a5fa]"></span>
                                            Ubicación de Flota
                                        </span>
                                    </div>
                                    <Map
                                        stops={[]}
                                        userVehicle={{ type: 'truck', isActive: false }}
                                        showTraffic={true}
                                        theme={mapAdminTheme}
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
                                                        <p className="text-[10px] text-white/60 font-bold">{(exp.driverId as any)?.name || 'Sin nombre'}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-white italic">${exp.amount}</p>
                                                    <p className="text-[10px] text-white/50 font-black uppercase mt-1">
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
                                            <span className="w-2.5 h-2.5 bg-info rounded-full animate-pulse shadow-[0_0_15px_#60a5fa]"></span>
                                            Live Fleet Radar
                                        </span>
                                        <h3 className="text-lg font-black text-white italic tracking-tighter mt-2 uppercase">Centro de Monitoreo Global</h3>
                                        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-white/50 uppercase">Unidades</span>
                                                <span className="text-lg font-black text-white">{drivers.filter(d => d.lastLocation).length}</span>
                                            </div>
                                            <div className="w-px h-8 bg-white/5"></div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-white/50 uppercase">Estado</span>
                                                <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest">En Línea</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Map Controls */}
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setMapAdminTheme(mapAdminTheme === 'dark' ? 'light' : 'dark')}
                                            className={cn(
                                                "flex items-center gap-3 px-6 py-3 rounded-2xl border backdrop-blur-xl transition-all shadow-2xl",
                                                mapAdminTheme === 'dark' ? "bg-info/10 border-info/40 text-info" : "bg-black/80 border-white/10 text-amber-400"
                                            )}
                                        >
                                            {mapAdminTheme === 'dark' ? (
                                                <><Moon className="w-4 h-4" /><span className="text-[10px] font-black uppercase tracking-widest">Nocturno</span></>
                                            ) : (
                                                <><Sun className="w-4 h-4" /><span className="text-[10px] font-black uppercase tracking-widest">Diurno</span></>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => setShowTraffic(!showTraffic)}
                                            className={cn(
                                                "flex items-center gap-3 px-6 py-3 rounded-2xl border backdrop-blur-xl transition-all shadow-2xl",
                                                showTraffic ? "bg-info/10 border-info/40 text-info" : "bg-black/80 border-white/10 text-white/60"
                                            )}
                                        >
                                            <div className={cn("w-2 h-2 rounded-full", showTraffic ? "bg-info animate-pulse" : "bg-white/20")} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Capa de Tráfico</span>
                                        </button>
                                    </div>
                                </div>

                                <Map
                                    stops={[]}
                                    userVehicle={{ type: 'truck', isActive: false }}
                                    showTraffic={showTraffic}
                                    theme={mapAdminTheme}
                                    fleetDrivers={filteredDrivers.map(d => ({
                                        id: d._id,
                                        name: d.name,
                                        email: d.email,
                                        lastLocation: d.lastLocation,
                                        vehicleType: d.vehicleType
                                    }))}
                                    onDriverClick={(id) => setSelectedDriverId(id)}
                                    selectedDriverId={selectedDriverId}
                                    onMapClick={() => setSelectedDriverId(null)}
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
                                                        className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl text-white/50 hover:text-white transition-all border border-white/5"
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                </div>

                                                <div>
                                                    <h4 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">{driver.name}</h4>
                                                    <p className="text-[11px] font-black text-info uppercase tracking-[0.2em] mt-3">{driver.email}</p>
                                                    <div className="flex items-center gap-2 mt-4">
                                                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse shadow-[0_0_10px_#3b82f6]" />
                                                        <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Activo ahora</span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="bg-white/5 p-5 rounded-[28px] border border-white/5">
                                                        <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">Suscripción</p>
                                                        <p className="text-sm font-black text-white uppercase italic tracking-tighter">{driver.plan || 'Free'}</p>
                                                    </div>
                                                    <div className="bg-white/5 p-5 rounded-[28px] border border-white/5">
                                                        <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">Unidad</p>
                                                        <p className="text-sm font-black text-white uppercase italic tracking-tighter">{driver.vehicleType || 'Truck'}</p>
                                                    </div>
                                                </div>

                                                <div className="pt-10 border-t border-white/5">
                                                    <h5 className="text-[11px] font-black text-white/70 uppercase tracking-[0.4em] mb-8 italic">Historial de Operaciones</h5>
                                                    <div className="space-y-5">
                                                        {driverRoutes.length > 0 ? driverRoutes.map(route => (
                                                            <div key={route._id} className="p-6 bg-white/5 rounded-[24px] border border-white/5 hover:bg-white/10 transition-all group relative overflow-hidden">
                                                                <div className="absolute top-0 right-0 p-2 opacity-5">
                                                                    <RouteIcon className="w-12 h-12" />
                                                                </div>
                                                                <div className="flex justify-between items-start mb-3 relative z-10">
                                                                    <p className="text-xs font-black text-white uppercase tracking-tight italic">{route.name}</p>
                                                                    <span className={cn(
                                                                        "text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest",
                                                                        route.status === 'completed' ? "bg-blue-500/10 text-blue-300 border border-blue-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                                                    )}>{route.status === 'completed' ? 'Finalizada' : 'En Ruta'}</span>
                                                                </div>
                                                                <div className="flex items-center gap-6 text-white/60 relative z-10">
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
                                                                <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">Sin actividad operativa</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="pt-10 border-t border-white/5 space-y-3">
                                                    <button
                                                        onClick={() => handleResetHistory(driver._id)}
                                                        className="w-full py-4 bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-amber-500/20 flex items-center justify-center gap-2 group"
                                                    >
                                                        <HistoryIcon className="w-4 h-4 group-hover:animate-spin" />
                                                        Restablecer Historial (rutas + gastos)
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(driver._id)}
                                                        className="w-full py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-red-500/20 flex items-center justify-center gap-2 group"
                                                    >
                                                        <Trash2 className="w-4 h-4 group-hover:animate-bounce" />
                                                        Eliminar Chofer permanentemente
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'drivers' && !selectedUserDetail && (
                        <div className="bg-white/5 border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
                            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                                <h3 className="font-black text-white uppercase italic tracking-widest">Directorio de Choferes</h3>
                                <button className="px-6 py-3 bg-info text-dark font-black text-[10px] uppercase rounded-xl hover:scale-105 active:scale-95 transition-all">Exportar PDF</button>
                            </div>
                            <div className="p-0 overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-white/[0.01] border-b border-white/5">
                                            <th className="p-6 text-[10px] font-black text-white/50 uppercase tracking-widest">Chofer</th>
                                            <th className="p-6 text-[10px] font-black text-white/50 uppercase tracking-widest">Email</th>
                                            <th className="p-6 text-[10px] font-black text-white/50 uppercase tracking-widest">Plan</th>
                                            <th className="p-6 text-[10px] font-black text-white/50 uppercase tracking-widest">Status Sub</th>
                                            <th className="p-6 text-[10px] font-black text-white/50 uppercase tracking-widest text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredDrivers.map((driver) => (
                                            <tr key={driver._id} className="hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => fetchUserDetail(driver._id)}>
                                                <td className="p-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-info/10 overflow-hidden flex items-center justify-center text-info font-black shrink-0">
                                                            {driver.image ? (
                                                                <img src={driver.image} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                driver.name?.charAt(0)
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-white">{driver.name}</p>
                                                            <p className="text-[10px] text-white/50 font-bold uppercase">{driver.role}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-6 text-sm text-white/60 font-medium">{driver.email}</td>
                                                <td className="p-6">
                                                    {(() => {
                                                        const pcfg = pricingPlans.find((p: any) => p.id === driver.plan);
                                                        const badgeCls = driver.plan === 'free' ? "bg-white/10 text-white/70" :
                                                            pcfg?.grantsFleet ? "bg-info/20 text-info" :
                                                            pcfg?.grantsPro ? "bg-amber-500/20 text-amber-400" : "bg-white/10 text-white/70";
                                                        return (
                                                            <span className={cn("text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-wider", badgeCls)}>
                                                                {pcfg?.name || driver.plan || 'free'}
                                                            </span>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn(
                                                            "w-2 h-2 rounded-full animate-pulse",
                                                            driver.subscriptionStatus === 'active' ? "bg-blue-400 shadow-[0_0_8px_#3b82f6]" : "bg-white/20"
                                                        )} />
                                                        <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">
                                                            {driver.subscriptionStatus || 'none'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-6 text-right">
                                                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            onClick={() => handleResetHistory(driver._id)}
                                                            className="p-2 text-white/50 hover:text-amber-500 hover:bg-amber-500/10 rounded-xl transition-all"
                                                            title="Restablecer Historial"
                                                        >
                                                            <HistoryIcon className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteUser(driver._id)}
                                                            className="p-2 text-white/50 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                                            title="Borrar Usuario y Datos"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                        <div className="relative">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setOpenMenuUserId(openMenuUserId === driver._id ? null : driver._id);
                                                                }}
                                                                className="p-2 text-white/50 hover:text-white transition-colors"
                                                            >
                                                                <MoreVertical className="w-5 h-5" />
                                                            </button>
                                                            {openMenuUserId === driver._id && (
                                                                <div className="absolute right-0 top-full mt-2 w-56 bg-[#060914]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 py-2 animate-in fade-in zoom-in-95 duration-200">
                                                                    <button
                                                                        onClick={() => { setOpenMenuUserId(null); fetchUserDetail(driver._id); }}
                                                                        className="w-full px-5 py-3 text-left text-xs font-black text-white hover:bg-white/5 flex items-center gap-3 transition-colors"
                                                                    >
                                                                        <Users className="w-4 h-4 text-info" />
                                                                        Ver Detalle Completo
                                                                    </button>
                                                                    <div className="px-5 pt-1 pb-1 text-[9px] font-black text-white/40 uppercase tracking-widest">Cambiar Plan</div>
                                                                    {[
                                                                        { id: 'free', name: 'free' },
                                                                        ...pricingPlans.filter((p: any) => p.id !== 'free').map((p: any) => ({ id: p.id, name: p.name })),
                                                                    ].map(planOpt => (
                                                                        <button
                                                                            key={planOpt.id}
                                                                            onClick={() => { setOpenMenuUserId(null); handleUpdateUser(driver._id, { plan: planOpt.id }); }}
                                                                            className={cn(
                                                                                "w-full px-5 py-2 text-left text-[11px] font-black hover:bg-white/5 flex items-center gap-3 transition-colors",
                                                                                (driver.plan || 'free') === planOpt.id ? "text-info" : "text-white/80"
                                                                            )}
                                                                        >
                                                                            <CreditCard className={cn("w-4 h-4", planOpt.id === 'free' ? "text-white/40" : "text-info")} />
                                                                            {planOpt.name.toUpperCase()}
                                                                            {(driver.plan || 'free') === planOpt.id && <span className="ml-auto text-[9px] text-white/40">actual</span>}
                                                                        </button>
                                                                    ))}
                                                                    <button
                                                                        onClick={() => { setOpenMenuUserId(null); handleUpdateUser(driver._id, { role: driver.role === 'admin' ? 'user' : 'admin' }); }}
                                                                        className="w-full px-5 py-3 text-left text-xs font-black text-white hover:bg-white/5 flex items-center gap-3 transition-colors"
                                                                    >
                                                                        <Shield className="w-4 h-4 text-purple-400" />
                                                                        Toggle Rol ({driver.role || 'user'} → {driver.role === 'admin' ? 'user' : 'admin'})
                                                                    </button>
                                                                    <hr className="border-white/5 my-1" />
                                                                    <button
                                                                        onClick={() => { setOpenMenuUserId(null); handleResetHistory(driver._id); }}
                                                                        className="w-full px-5 py-3 text-left text-xs font-black text-amber-400 hover:bg-white/5 flex items-center gap-3 transition-colors"
                                                                    >
                                                                        <HistoryIcon className="w-4 h-4" />
                                                                        Restablecer Historial
                                                                    </button>
                                                                    <button
                                                                        onClick={() => { setOpenMenuUserId(null); handleDeleteUser(driver._id); }}
                                                                        className="w-full px-5 py-3 text-left text-xs font-black text-red-400 hover:bg-white/5 flex items-center gap-3 transition-colors"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                        Eliminar Usuario
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'drivers' && loadingDetail && (
                        <div className="h-64 flex flex-col items-center justify-center opacity-40">
                            <Loader2 className="w-10 h-10 animate-spin text-info mb-4" />
                            <p className="text-xs font-black uppercase tracking-widest text-white/70">Cargando detalle del usuario...</p>
                        </div>
                    )}

                    {activeTab === 'drivers' && selectedUserDetail && !loadingDetail && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Header with back button */}
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-6">
                                    <button
                                        onClick={() => setSelectedUserDetail(null)}
                                        className="flex items-center gap-3 px-5 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white/60 hover:text-white transition-all border border-white/5 group"
                                    >
                                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Volver</span>
                                    </button>
                                    <div className="h-8 w-px bg-white/5" />
                                    <div className="w-14 h-14 rounded-[20px] overflow-hidden bg-gradient-to-tr from-info to-blue-600 flex items-center justify-center shrink-0">
                                        {selectedUserDetail.user.image ? (
                                            <img src={selectedUserDetail.user.image} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xl font-black text-dark">{selectedUserDetail.user.name?.charAt(0) || '?'}</span>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">
                                            {selectedUserDetail.user.name || 'Sin nombre'}
                                        </h3>
                                        <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em] mt-1">{selectedUserDetail.user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="bg-white/5 px-5 py-3 rounded-2xl border border-white/5 text-center">
                                        <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Rutas</p>
                                        <p className="text-lg font-black text-white">{selectedUserDetail.summary.totalRoutes}</p>
                                    </div>
                                    <div className="bg-white/5 px-5 py-3 rounded-2xl border border-white/5 text-center">
                                        <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Gastos</p>
                                        <p className="text-lg font-black text-white">{selectedUserDetail.summary.totalExpenses}</p>
                                    </div>
                                    <div className="bg-white/5 px-5 py-3 rounded-2xl border border-white/5 text-center">
                                        <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Total $</p>
                                        <p className="text-lg font-black text-info">${selectedUserDetail.summary.totalSpent.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-2 mb-8 border-b border-white/5 pb-4">
                                {(['routes', 'expenses', 'actions'] as const).map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setUserDetailTab(tab)}
                                        className={cn(
                                            "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                                            userDetailTab === tab
                                                ? "bg-info text-dark shadow-lg shadow-info/10"
                                                : "text-white/60 hover:text-white hover:bg-white/5"
                                        )}
                                    >
                                        {tab === 'routes' && 'Rutas'}
                                        {tab === 'expenses' && 'Gastos'}
                                        {tab === 'actions' && 'Acciones'}
                                    </button>
                                ))}
                            </div>

                            {/* Routes Tab */}
                            {userDetailTab === 'routes' && (
                                <div className="space-y-1">
                                    {selectedUserDetail.routes.length > 0 ? (
                                        <div className="space-y-4">
                                            {selectedUserDetail.routes.map((route: any) => (
                                                <div key={route._id} className="bg-white/5 border border-white/5 rounded-[24px] p-6 hover:bg-white/10 transition-all flex items-center justify-between group">
                                                    <div className="flex items-center gap-6">
                                                        <div className="w-12 h-12 rounded-2xl bg-info/10 flex items-center justify-center border border-info/20">
                                                            <RouteIcon className="w-5 h-5 text-info" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-white uppercase italic">{route.name}</p>
                                                            <div className="flex items-center gap-4 mt-2 text-[10px] text-white/60 font-bold">
                                                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{route.stops.length} paradas</span>
                                                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(route.date).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className={cn(
                                                            "text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest",
                                                            route.status === 'completed' ? "bg-blue-500/10 text-blue-300 border border-blue-500/20" :
                                                            route.status === 'active' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                                                            "bg-white/10 text-white/70 border border-white/10"
                                                        )}>
                                                            {route.status === 'completed' ? 'Completada' : route.status === 'active' ? 'Activa' : 'Borrador'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="h-48 flex flex-col items-center justify-center opacity-20">
                                            <RouteIcon className="w-12 h-12 mb-4" />
                                            <p className="text-xs font-black uppercase tracking-widest">Sin rutas registradas</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Expenses Tab */}
                            {userDetailTab === 'expenses' && (
                                <div className="space-y-1">
                                    {selectedUserDetail.expenses.length > 0 ? (
                                        <div className="space-y-4">
                                            {selectedUserDetail.expenses.map((exp: any) => (
                                                <div key={exp._id} className="bg-white/5 border border-white/5 rounded-[24px] p-6 hover:bg-white/10 transition-all flex items-center justify-between group">
                                                    <div className="flex items-center gap-6">
                                                        <div className={cn(
                                                            "w-12 h-12 rounded-2xl flex items-center justify-center border text-sm font-black",
                                                            exp.type === 'FUEL' ? "bg-orange-500/10 border-orange-500/20 text-orange-400" :
                                                            exp.type === 'TOLL' ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
                                                            exp.type === 'MAINTENANCE' ? "bg-purple-500/10 border-purple-500/20 text-purple-400" :
                                                            "bg-white/10 border-white/10 text-white/70"
                                                        )}>
                                                            {exp.type.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-white uppercase italic">{exp.type}</p>
                                                            <p className="text-[10px] text-white/60 font-bold mt-1">{exp.description || 'Sin descripción'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-lg font-black text-white italic">${exp.amount}</p>
                                                        <p className="text-[10px] text-white/50 font-black uppercase mt-1">{new Date(exp.date).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="h-48 flex flex-col items-center justify-center opacity-20">
                                            <DollarSign className="w-12 h-12 mb-4" />
                                            <p className="text-xs font-black uppercase tracking-widest">Sin gastos registrados</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Actions Tab */}
                            {userDetailTab === 'actions' && (
                                <div className="max-w-2xl space-y-8">
                                    {/* User Info Card */}
                                    <div className="bg-white/5 border border-white/5 rounded-[32px] p-8 space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-[20px] overflow-hidden bg-gradient-to-tr from-info to-blue-600 flex items-center justify-center text-2xl font-black text-dark shrink-0">
                                                {selectedUserDetail.user.image ? (
                                                    <img src={selectedUserDetail.user.image} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span>{selectedUserDetail.user.name?.charAt(0) || '?'}</span>
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-black text-white italic tracking-tighter uppercase">{selectedUserDetail.user.name || 'Sin nombre'}</h4>
                                                <p className="text-xs text-white/70">{selectedUserDetail.user.email}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/5">
                                            <div className="bg-black/40 rounded-xl border border-white/5 px-3 py-2.5">
                                                <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">Se unió</p>
                                                <p className="text-[11px] font-black text-white mt-0.5">
                                                    {selectedUserDetail.user.createdAt
                                                        ? new Date(selectedUserDetail.user.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
                                                        : '—'}
                                                </p>
                                            </div>
                                            <div className="bg-black/40 rounded-xl border border-white/5 px-3 py-2.5">
                                                <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">Proveedor</p>
                                                <p className="text-[11px] font-black text-white uppercase tracking-widest mt-0.5">
                                                    {(selectedUserDetail.user.provider || 'email') === 'google' ? 'Google' : 'Email'}
                                                </p>
                                            </div>
                                            <div className="bg-black/40 rounded-xl border border-white/5 px-3 py-2.5">
                                                <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">Cargas masivas</p>
                                                <p className="text-[11px] font-black text-white mt-0.5">
                                                    {selectedUserDetail.user.bulkImportsUsed ?? 0} usadas
                                                </p>
                                            </div>
                                            <div className="bg-black/40 rounded-xl border border-white/5 px-3 py-2.5">
                                                <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">Última ubicación</p>
                                                {selectedUserDetail.user.lastLocation?.updatedAt ? (
                                                    <>
                                                        <p className="text-[11px] font-black text-white mt-0.5 truncate">
                                                            {Number(selectedUserDetail.user.lastLocation.lat).toFixed(5)}, {Number(selectedUserDetail.user.lastLocation.lng).toFixed(5)}
                                                        </p>
                                                        <p className="text-[9px] text-white/40 font-bold">
                                                            {new Date(selectedUserDetail.user.lastLocation.updatedAt).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </>
                                                ) : (
                                                    <p className="text-[11px] font-black text-white/40 mt-0.5">Sin señal aún</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
                                            <div>
                                                <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Rol</p>
                                                <select
                                                    value={selectedUserDetail.user.role}
                                                    onChange={(e) => handleUpdateUser(selectedUserDetail.user._id, { role: e.target.value })}
                                                    disabled={isUpdatingUser}
                                                    className="w-full bg-black/40 border border-white/5 rounded-xl py-2 px-3 text-xs font-bold text-white focus:outline-none focus:border-info/50 transition-all"
                                                >
                                                    <option value="user">user</option>
                                                    <option value="admin">admin</option>
                                                </select>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Plan</p>
                                                <select
                                                    value={selectedUserDetail.user.plan}
                                                    onChange={(e) => handleUpdateUser(selectedUserDetail.user._id, { plan: e.target.value })}
                                                    disabled={isUpdatingUser}
                                                    className="w-full bg-black/40 border border-white/5 rounded-xl py-2 px-3 text-xs font-bold text-white focus:outline-none focus:border-info/50 transition-all"
                                                >
                                                    <option value="free">free</option>
                                                    {pricingPlans
                                                        .filter((p: any) => p.id !== 'free')
                                                        .map((p: any) => (
                                                            <option key={p.id} value={p.id}>{p.name}</option>
                                                        ))}
                                                </select>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Suscripción</p>
                                                <select
                                                    value={selectedUserDetail.user.subscriptionStatus}
                                                    onChange={(e) => handleUpdateUser(selectedUserDetail.user._id, { subscriptionStatus: e.target.value })}
                                                    disabled={isUpdatingUser}
                                                    className="w-full bg-black/40 border border-white/5 rounded-xl py-2 px-3 text-xs font-bold text-white focus:outline-none focus:border-info/50 transition-all"
                                                >
                                                    <option value="none">none</option>
                                                    <option value="active">active</option>
                                                    <option value="trialing">trialing</option>
                                                    <option value="expired">expired</option>
                                                    <option value="cancelled">cancelled</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4">
                                            <div>
                                                <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Tipo de Vehículo</p>
                                                <select
                                                    value={selectedUserDetail.user.vehicleType || 'truck'}
                                                    onChange={(e) => handleUpdateUser(selectedUserDetail.user._id, { vehicleType: e.target.value })}
                                                    disabled={isUpdatingUser}
                                                    className="w-full bg-black/40 border border-white/5 rounded-xl py-2 px-3 text-xs font-bold text-white focus:outline-none focus:border-info/50 transition-all"
                                                >
                                                    <option value="truck">truck</option>
                                                    <option value="car">car</option>
                                                    <option value="van">van</option>
                                                    <option value="pickup">pickup</option>
                                                    <option value="motorcycle">motorcycle</option>
                                                    <option value="ufo">ufo</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4">
                                            <div>
                                                <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Expiración de Suscripción</p>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="datetime-local"
                                                        value={selectedUserDetail.user.subscriptionExpiry
                                                            ? new Date(selectedUserDetail.user.subscriptionExpiry).toISOString().slice(0, 16)
                                                            : ''}
                                                        onChange={(e) => {
                                                            const v = e.target.value;
                                                            handleUpdateUser(selectedUserDetail.user._id, { subscriptionExpiry: v ? new Date(v).toISOString() : null });
                                                        }}
                                                        disabled={isUpdatingUser}
                                                        className="flex-1 bg-black/40 border border-white/5 rounded-xl py-2 px-3 text-xs font-bold text-white focus:outline-none focus:border-info/50 transition-all [color-scheme:dark]"
                                                    />
                                                    {selectedUserDetail.user.subscriptionExpiry && (
                                                        <button
                                                            onClick={() => handleUpdateUser(selectedUserDetail.user._id, { subscriptionExpiry: null })}
                                                            disabled={isUpdatingUser}
                                                            className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white/70 hover:bg-white/10 transition-all"
                                                        >
                                                            Limpiar
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-[9px] text-white/40 mt-1">
                                                    Útil si el usuario tenía un plan flex vencido: limpiar aquí evita que el sistema lo baje a free automáticamente.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t border-white/5">
                                            <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                                                <div className="flex items-center gap-3">
                                                    <Crown className={cn(
                                                        "w-5 h-5",
                                                        selectedUserDetail.user.adminGranted ? "text-amber-400" : "text-white/50"
                                                    )} />
                                                    <div>
                                                        <p className="text-xs font-black text-white uppercase italic">Acceso Gratuito</p>
                                                        <p className="text-[10px] text-white/60 font-bold">
                                                            {selectedUserDetail.user.adminGranted
                                                                ? 'Este usuario tiene TODAS las funciones activas sin costo'
                                                                : 'Activar para dar acceso completo sin cobro'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleUpdateUser(selectedUserDetail.user._id, { adminGranted: !selectedUserDetail.user.adminGranted })}
                                                    disabled={isUpdatingUser}
                                                    className={cn(
                                                        "relative w-14 h-8 rounded-full transition-all border",
                                                        selectedUserDetail.user.adminGranted
                                                            ? "bg-amber-500 border-amber-600 shadow-lg shadow-amber-500/20"
                                                            : "bg-white/5 border-white/10"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "absolute top-1 w-6 h-6 rounded-full bg-white transition-all shadow-md",
                                                        selectedUserDetail.user.adminGranted ? "left-7" : "left-1"
                                                    )} />
                                                </button>
                                            </div>
                                        </div>

                                        {updateMsg && (
                                            <div className={cn(
                                                "p-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center",
                                                updateMsg.includes('éxito') ? "bg-blue-500/10 text-blue-300 border border-blue-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                                            )}>
                                                {updateMsg}
                                            </div>
                                        )}
                                    </div>

                                    {/* Reset Password */}
                                    <div className="bg-white/5 border border-white/5 rounded-[32px] p-8 space-y-6">
                                        <div className="flex items-center gap-3">
                                            <Shield className="w-5 h-5 text-amber-400" />
                                            <h4 className="text-sm font-black text-white uppercase italic tracking-widest">Resetear Contraseña</h4>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] ml-2">Nueva Contraseña</label>
                                                <input
                                                    type="password"
                                                    value={resetPwdForm.password}
                                                    onChange={(e) => setResetPwdForm({ ...resetPwdForm, password: e.target.value })}
                                                    placeholder="••••••••"
                                                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 px-5 text-white placeholder:text-white/40 focus:outline-none focus:border-info/50 transition-all font-bold text-sm"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] ml-2">Confirmar</label>
                                                <input
                                                    type="password"
                                                    value={resetPwdForm.confirm}
                                                    onChange={(e) => setResetPwdForm({ ...resetPwdForm, confirm: e.target.value })}
                                                    placeholder="••••••••"
                                                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 px-5 text-white placeholder:text-white/40 focus:outline-none focus:border-info/50 transition-all font-bold text-sm"
                                                />
                                            </div>
                                        </div>

                                        {resetPwdMsg && (
                                            <div className={cn(
                                                "p-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center",
                                                resetPwdMsg.includes('éxito') ? "bg-blue-500/10 text-blue-300 border border-blue-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                                            )}>
                                                {resetPwdMsg}
                                            </div>
                                        )}

                                        <button
                                            onClick={() => handleResetUserPassword(selectedUserDetail.user._id)}
                                            disabled={isResettingPwd}
                                            className="w-full py-4 bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {isResettingPwd ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <><Shield className="w-4 h-4" /> CAMBIAR CONTRASEÑA</>
                                            )}
                                        </button>
                                    </div>

                                    {/* Danger Zone */}
                                    <div className="bg-red-500/5 border border-red-500/20 rounded-[32px] p-8 space-y-4">
                                        <h4 className="text-sm font-black text-red-400 uppercase italic tracking-widest">Zona de Peligro</h4>
                                        <p className="text-[10px] text-white/60 font-medium">Acciones irreversibles. Procede con precaución.</p>
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => handleResetHistory(selectedUserDetail.user._id)}
                                                className="flex-1 py-4 bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-amber-500/20 flex items-center justify-center gap-2"
                                            >
                                                <HistoryIcon className="w-4 h-4" />
                                                Restablecer Historial
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(selectedUserDetail.user._id)}
                                                className="flex-1 py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-red-500/20 flex items-center justify-center gap-2"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Eliminar Usuario
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'routes' && !selectedRouteAudit && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredRoutes.length > 0 ? filteredRoutes.map((route) => (
                                <div key={route._id} className="bg-white/5 border border-white/5 rounded-[32px] p-6 hover:bg-white/10 transition-all group border-b-4 border-b-info/20">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="p-3 bg-info/10 rounded-2xl">
                                            <RouteIcon className="w-6 h-6 text-info" />
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] block mb-1">Ejecución</span>
                                            <span className="text-[10px] font-black text-white italic uppercase tracking-widest">{new Date(route.date).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <h4 className="text-lg font-black text-white italic tracking-tighter mb-4 uppercase">{route.name}</h4>
                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-3">
                                            <Users className="w-4 h-4 text-white/50" />
                                            <p className="text-xs font-bold text-white/60">{(route.userId as any)?.name || 'Sin asignar'}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <MapPin className="w-4 h-4 text-white/50" />
                                            <p className="text-xs font-bold text-white/60">{route.stops.length} Paradas totales</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <CheckCircle className="w-4 h-4 text-blue-500/50" />
                                            <p className="text-xs font-bold text-blue-300/80">{route.stops.filter((s: any) => s.isCompleted).length} Completadas</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedRouteAudit(route)}
                                        className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black text-white uppercase tracking-[0.2em] transition-all border border-white/5"
                                    >
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

                    {activeTab === 'routes' && selectedRouteAudit && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Back button */}
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-6">
                                    <button
                                        onClick={() => setSelectedRouteAudit(null)}
                                        className="flex items-center gap-3 px-5 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white/60 hover:text-white transition-all border border-white/5 group"
                                    >
                                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Volver</span>
                                    </button>
                                    <div className="h-8 w-px bg-white/5" />
                                    <div>
                                        <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">
                                            Auditoría: {selectedRouteAudit.name}
                                        </h3>
                                        <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em] mt-1">
                                            {(selectedRouteAudit.userId as any)?.name || 'Sin asignar'} · {new Date(selectedRouteAudit.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <span className={cn(
                                    "text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest",
                                    selectedRouteAudit.status === 'completed' ? "bg-blue-500/10 text-blue-300 border border-blue-500/20" :
                                    selectedRouteAudit.status === 'active' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                                    "bg-white/10 text-white/70 border border-white/10"
                                )}>
                                    {selectedRouteAudit.status === 'completed' ? 'Completada' : selectedRouteAudit.status === 'active' ? 'Activa' : 'Borrador'}
                                </span>
                            </div>

                            {/* Metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                                <div className="bg-white/5 border border-white/5 rounded-[24px] p-6">
                                    <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">Distancia Total</p>
                                    <h4 className="text-2xl font-black text-white italic tracking-tighter">{selectedRouteAudit.totalDistance || 0} km</h4>
                                </div>
                                <div className="bg-white/5 border border-white/5 rounded-[24px] p-6">
                                    <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">Tiempo Total</p>
                                    <h4 className="text-2xl font-black text-white italic tracking-tighter">{selectedRouteAudit.totalTime || '—'}</h4>
                                </div>
                                <div className="bg-white/5 border border-white/5 rounded-[24px] p-6">
                                    <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">Paradas</p>
                                    <h4 className="text-2xl font-black text-white italic tracking-tighter">{selectedRouteAudit.stops?.length || 0}</h4>
                                </div>
                                <div className="bg-white/5 border border-white/5 rounded-[24px] p-6">
                                    <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">Completadas</p>
                                    <h4 className="text-2xl font-black text-blue-300 italic tracking-tighter">
                                        {selectedRouteAudit.stops?.filter((s: any) => s.isCompleted).length || 0}
                                        <span className="text-sm text-white/60">/{selectedRouteAudit.stops?.length || 0}</span>
                                    </h4>
                                </div>
                            </div>

                            {/* Stops List */}
                            <div className="bg-white/5 border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
                                <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                                    <h4 className="font-black text-white uppercase italic tracking-widest text-sm">Bitácora de Paradas</h4>
                                    <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">
                                        {selectedRouteAudit.stops?.filter((s: any) => s.isCompleted).length}/{selectedRouteAudit.stops?.length || 0} completadas
                                    </span>
                                </div>
                                <div className="p-0">
                                    {selectedRouteAudit.stops?.length > 0 ? (
                                        <div className="divide-y divide-white/5">
                                            {selectedRouteAudit.stops.map((stop: any, idx: number) => (
                                                <div key={stop.id || idx} className="p-6 hover:bg-white/[0.02] transition-colors flex items-start gap-6">
                                                    {/* Stop Number */}
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0 mt-1",
                                                        stop.isCompleted ? "bg-blue-500/10 text-blue-300 border border-blue-500/20" :
                                                        stop.isFailed ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                                                        "bg-white/5 text-white/70 border border-white/10"
                                                    )}>
                                                        {stop.isCompleted ? '✓' : stop.isFailed ? '✗' : idx + 1}
                                                    </div>

                                                    {/* Stop Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div>
                                                                <p className="text-sm font-black text-white uppercase tracking-tight">{stop.address}</p>
                                                                {stop.customerName && (
                                                                    <p className="text-xs text-white/70 mt-1 font-medium">
                                                                        {stop.customerName}
                                                                        {stop.locator && <span className="ml-3 text-info font-black text-[10px] uppercase tracking-widest">Loc: {stop.locator}</span>}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="text-right shrink-0">
                                                                <span className={cn(
                                                                    "text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest",
                                                                    stop.priority === 'HIGH' ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                                                                    stop.priority === 'FIRST' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                                                                    stop.priority === 'LAST' ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" :
                                                                    "bg-white/10 text-white/60 border border-white/10"
                                                                )}>
                                                                    {stop.priority || 'NORMAL'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-4 mt-3">
                                                            {stop.taskType && (
                                                                <span className={cn(
                                                                    "text-[10px] font-black uppercase tracking-widest",
                                                                    stop.taskType === 'DELIVERY' ? "text-blue-400" : "text-orange-400"
                                                                )}>
                                                                    {stop.taskType === 'DELIVERY' ? '📦 Entrega' : '📥 Recolección'}
                                                                </span>
                                                            )}
                                                            {stop.numPackages && stop.numPackages > 1 && (
                                                                <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">
                                                                    {stop.numPackages} paquetes
                                                                </span>
                                                            )}
                                                            {stop.timeWindow && (
                                                                <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">
                                                                    🕐 {stop.timeWindow}
                                                                </span>
                                                            )}
                                                            {stop.estimatedDuration && (
                                                                <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">
                                                                    ⏱ {stop.estimatedDuration} min
                                                                </span>
                                                            )}
                                                        </div>

                                                        {stop.notes && (
                                                            <p className="mt-2 text-[10px] italic text-white/60 bg-white/[0.02] px-4 py-2 rounded-xl border border-white/5">
                                                                Nota: {stop.notes}
                                                            </p>
                                                        )}

                                                        <div className="flex items-center gap-3 mt-3">
                                                            {stop.isCompleted && stop.completedAt && (
                                                                <span className="text-[10px] font-black text-blue-300/60 uppercase tracking-widest">
                                                                    Completada: {new Date(stop.completedAt).toLocaleString()}
                                                                </span>
                                                            )}
                                                            {stop.isFailed && stop.failedReason && (
                                                                <span className="text-[10px] font-black text-red-400/60 uppercase tracking-widest">
                                                                    Falló: {stop.failedReason}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="h-48 flex flex-col items-center justify-center opacity-20">
                                            <MapPin className="w-12 h-12 mb-4" />
                                            <p className="text-xs font-black uppercase tracking-widest">Sin paradas registradas</p>
                                        </div>
                                    )}
                                </div>
                            </div>
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
                                            <th className="p-6 text-[10px] font-black text-white/50 uppercase tracking-widest">ID / Fecha</th>
                                            <th className="p-6 text-[10px] font-black text-white/50 uppercase tracking-widest">Chofer</th>
                                            <th className="p-6 text-[10px] font-black text-white/50 uppercase tracking-widest">Rendimiento</th>
                                            <th className="p-6 text-[10px] font-black text-white/50 uppercase tracking-widest">Puntos</th>
                                            <th className="p-6 text-[10px] font-black text-white/50 uppercase tracking-widest text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredRoutes.filter(r => r.status === 'completed').map((route) => (
                                            <tr key={route._id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="p-6">
                                                    <p className="text-sm font-black text-white tracking-tighter uppercase">{route.name}</p>
                                                    <p className="text-[10px] text-white/50 font-bold">{new Date(route.date).toLocaleDateString()}</p>
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
                                                        <span className="text-xs font-black text-blue-300 italic">+{route.totalDistance} km</span>
                                                        <span className="text-[10px] text-white/50 font-bold uppercase">{route.totalTime}</span>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <span className="text-xs font-bold text-white/60">{route.stops?.length} paradas</span>
                                                </td>
                                                <td className="p-6 text-right">
                                                    <span className="bg-blue-500/10 text-blue-300 text-[10px] px-3 py-1 rounded-full font-black uppercase border border-blue-500/20">Archivado</span>
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
                                    <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Total en Mantenimiento</p>
                                    <h3 className="text-4xl font-black text-orange-400 italic tracking-tighter mt-2">
                                        ${expenses.filter(e => e.type === 'MAINTENANCE').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
                                    </h3>
                                </div>
                                <div className="bg-white/5 border border-white/5 rounded-[32px] p-8">
                                    <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Último Servicio</p>
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
                                                <th className="p-6 text-[10px] font-black text-white/50 uppercase tracking-widest">Fecha</th>
                                                <th className="p-6 text-[10px] font-black text-white/50 uppercase tracking-widest">Unidad / Chofer</th>
                                                <th className="p-6 text-[10px] font-black text-white/50 uppercase tracking-widest">Descripción del Servicio</th>
                                                <th className="p-6 text-[10px] font-black text-white/50 uppercase tracking-widest text-right">Inversión</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {expenses.filter(e => e.type === 'MAINTENANCE').map((exp) => (
                                                <tr key={exp._id} className="hover:bg-white/[0.02] transition-colors">
                                                    <td className="p-6">
                                                        <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">
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
                                    <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Gasto en Combustible</p>
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
                                    <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Ticket Promedio</p>
                                    <h3 className="text-3xl font-black text-white italic mt-2">${stats?.expenses > 0 ? (stats.totalSpent / stats.expenses).toFixed(2) : 0}</h3>
                                    <p className="text-[10px] text-white/70 mt-2 font-bold uppercase tracking-widest">Por cada registro</p>
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
                                                <th className="p-6 text-[10px] font-black text-white/50 uppercase tracking-widest">Tipo</th>
                                                <th className="p-6 text-[10px] font-black text-white/50 uppercase tracking-widest">Chofer</th>
                                                <th className="p-6 text-[10px] font-black text-white/50 uppercase tracking-widest">Descripción</th>
                                                <th className="p-6 text-[10px] font-black text-white/50 uppercase tracking-widest">Fecha</th>
                                                <th className="p-6 text-[10px] font-black text-white/50 uppercase tracking-widest text-right">Monto</th>
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
                                                    <td className="p-6 text-sm text-white/70 italic">{exp.description || 'Sin descripción'}</td>
                                                    <td className="p-6 text-[10px] font-black text-white/60 uppercase tracking-widest">
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

                    {activeTab === 'pricing' && (
                        <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                            {/* Header */}
                            <div className="bg-white/5 border border-white/5 rounded-[40px] p-8 lg:p-12 space-y-8 shadow-2xl">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-info/10 rounded-[20px] flex items-center justify-center border border-info/20">
                                            <CreditCard className="w-7 h-7 text-info" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">Planes y Precios</h3>
                                            <p className="text-white/60 text-xs font-medium">Gestiona los planes de suscripción desde aquí.</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowNewPlanForm(!showNewPlanForm)}
                                        className="shrink-0 flex items-center gap-2 py-4 px-6 bg-info text-dark font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-xl shadow-info/20 hover:scale-[1.02] active:scale-95 transition-all"
                                    >
                                        <Plus className="w-5 h-5" />
                                        {showNewPlanForm ? 'CANCELAR' : 'AGREGAR PLAN'}
                                    </button>
                                </div>

                                {/* New Plan Form */}
                                {showNewPlanForm && (
                                    <div className="bg-white/[0.03] border border-info/20 rounded-[28px] p-6 space-y-5">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-lg font-black text-white italic tracking-tight uppercase">Nuevo Plan</h4>
                                            <button onClick={() => setShowNewPlanForm(false)} className="text-white/60 hover:text-white">
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Nombre</label>
                                                <input
                                                    value={newPlanForm.name}
                                                    onChange={(e) => setNewPlanForm({ ...newPlanForm, name: e.target.value })}
                                                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 px-5 text-white focus:outline-none focus:border-info/50 transition-all font-bold text-sm"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Precio ($ MXN)</label>
                                                <input
                                                    type="number"
                                                    value={newPlanForm.price}
                                                    onChange={(e) => setNewPlanForm({ ...newPlanForm, price: Number(e.target.value) })}
                                                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 px-5 text-white focus:outline-none focus:border-info/50 transition-all font-bold text-sm"
                                                    min={0}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Días de Prueba</label>
                                                <input
                                                    type="number"
                                                    value={newPlanForm.trialDays}
                                                    onChange={(e) => setNewPlanForm({ ...newPlanForm, trialDays: Number(e.target.value) })}
                                                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 px-5 text-white focus:outline-none focus:border-info/50 transition-all font-bold text-sm"
                                                    min={0}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Duración (días)</label>
                                                <input
                                                    type="number"
                                                    value={newPlanForm.durationDays}
                                                    onChange={(e) => setNewPlanForm({ ...newPlanForm, durationDays: Number(e.target.value) })}
                                                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 px-5 text-white focus:outline-none focus:border-info/50 transition-all font-bold text-sm"
                                                    min={0}
                                                />
                                                <p className="text-[9px] text-white/40 leading-tight">0 = suscripción mensual. &gt;0 = pago único que expira a los N días.</p>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Tiempo x Parada (min)</label>
                                                <input
                                                    type="number"
                                                    value={newPlanForm.serviceTime}
                                                    onChange={(e) => setNewPlanForm({ ...newPlanForm, serviceTime: Number(e.target.value) })}
                                                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 px-5 text-white focus:outline-none focus:border-info/50 transition-all font-bold text-sm"
                                                    min={1}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Máx. Choferes</label>
                                                <input
                                                    type="number"
                                                    value={newPlanForm.maxMembers}
                                                    onChange={(e) => setNewPlanForm({ ...newPlanForm, maxMembers: Number(e.target.value) })}
                                                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 px-5 text-white focus:outline-none focus:border-info/50 transition-all font-bold text-sm"
                                                    min={0}
                                                />
                                                <p className="text-[9px] text-white/40 leading-tight">0 = ilimitado. Límite de choferes en la flotilla.</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Descripción</label>
                                            <input
                                                value={newPlanForm.description}
                                                onChange={(e) => setNewPlanForm({ ...newPlanForm, description: e.target.value })}
                                                className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 px-5 text-white focus:outline-none focus:border-info/50 transition-all font-bold text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Características (una por línea)</label>
                                            <textarea
                                                value={newPlanForm.features}
                                                onChange={(e) => setNewPlanForm({ ...newPlanForm, features: e.target.value })}
                                                rows={4}
                                                className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 px-5 text-white focus:outline-none focus:border-info/50 transition-all font-bold text-sm resize-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Color (gradiente)</label>
                                            <input
                                                value={newPlanForm.color}
                                                onChange={(e) => setNewPlanForm({ ...newPlanForm, color: e.target.value })}
                                                className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 px-5 text-white focus:outline-none focus:border-info/50 transition-all font-bold text-sm"
                                                placeholder="from-blue-400 to-indigo-500"
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">CTA (opcional)</label>
                                                <input
                                                    value={newPlanForm.cta}
                                                    onChange={(e) => setNewPlanForm({ ...newPlanForm, cta: e.target.value })}
                                                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 px-5 text-white focus:outline-none focus:border-info/50 transition-all font-bold text-sm"
                                                    placeholder="Ej: Contactar Ventas"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">CTA Link (opcional)</label>
                                                <input
                                                    value={newPlanForm.ctaLink}
                                                    onChange={(e) => setNewPlanForm({ ...newPlanForm, ctaLink: e.target.value })}
                                                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 px-5 text-white focus:outline-none focus:border-info/50 transition-all font-bold text-sm"
                                                    placeholder="mailto:ventas@ejemplo.com"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <div
                                                    onClick={() => setNewPlanForm({ ...newPlanForm, highlight: !newPlanForm.highlight })}
                                                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${newPlanForm.highlight ? 'bg-info border-info' : 'bg-white/5 border-white/10'}`}
                                                >
                                                    {newPlanForm.highlight && <Check className="w-3.5 h-3.5 text-dark font-black" strokeWidth={4} />}
                                                </div>
                                                <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Destacado</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <div
                                                    onClick={() => setNewPlanForm({ ...newPlanForm, active: !newPlanForm.active })}
                                                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${newPlanForm.active ? 'bg-info border-info' : 'bg-white/5 border-white/10'}`}
                                                >
                                                    {newPlanForm.active && <Check className="w-3.5 h-3.5 text-dark font-black" strokeWidth={4} />}
                                                </div>
                                                <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Activo</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <div
                                                    onClick={() => setNewPlanForm({ ...newPlanForm, grantsPro: !newPlanForm.grantsPro })}
                                                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${newPlanForm.grantsPro ? 'bg-amber-500 border-amber-500' : 'bg-white/5 border-white/10'}`}
                                                >
                                                    {newPlanForm.grantsPro && <Check className="w-3.5 h-3.5 text-dark font-black" strokeWidth={4} />}
                                                </div>
                                                <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Funciones Pro</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <div
                                                    onClick={() => setNewPlanForm({ ...newPlanForm, grantsFleet: !newPlanForm.grantsFleet })}
                                                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${newPlanForm.grantsFleet ? 'bg-info border-info' : 'bg-white/5 border-white/10'}`}
                                                >
                                                    {newPlanForm.grantsFleet && <Check className="w-3.5 h-3.5 text-dark font-black" strokeWidth={4} />}
                                                </div>
                                                <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Flotilla</span>
                                            </label>
                                        </div>
                                        <button
                                            onClick={handleAddPlan}
                                            disabled={savingPricing || !newPlanForm.name}
                                            className="w-full py-4 bg-gradient-to-r from-info to-blue-600 text-dark font-black rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 hover:scale-[1.02] active:scale-95 text-[10px] uppercase tracking-widest"
                                        >
                                            {savingPricing ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <><Plus className="w-4 h-4" /> CREAR PLAN</>
                                            )}
                                        </button>
                                    </div>
                                )}

                                {/* Plan List */}
                                <div className="space-y-4">
                                    {pricingPlans
                                        .filter((p: any) => p.id !== 'free')
                                        .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
                                        .map((plan: any) => (
                                            <div key={plan.id} className="bg-white/[0.03] border border-white/5 rounded-[28px] p-6 space-y-5">
                                                {editingPlan?.id === plan.id ? (
                                                    <>
                                                        <div className="flex items-center justify-between">
                                                            <h4 className="text-lg font-black text-white italic tracking-tight uppercase">Editando: {plan.name}</h4>
                                                            <button onClick={() => setEditingPlan(null)} className="text-white/60 hover:text-white">
                                                                <X className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Nombre</label>
                                                                <input
                                                                    value={editingPlan.name}
                                                                    onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                                                                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 px-5 text-white focus:outline-none focus:border-info/50 transition-all font-bold text-sm"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Precio ($ MXN)</label>
                                                                <input
                                                                    type="number"
                                                                    value={editingPlan.price}
                                                                    onChange={(e) => setEditingPlan({ ...editingPlan, price: Number(e.target.value) })}
                                                                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 px-5 text-white focus:outline-none focus:border-info/50 transition-all font-bold text-sm"
                                                                    min={0}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Días de Prueba</label>
                                                                <input
                                                                    type="number"
                                                                    value={editingPlan.trialDays}
                                                                    onChange={(e) => setEditingPlan({ ...editingPlan, trialDays: Number(e.target.value) })}
                                                                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 px-5 text-white focus:outline-none focus:border-info/50 transition-all font-bold text-sm"
                                                                    min={0}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Duración (días)</label>
                                                                <input
                                                                    type="number"
                                                                    value={editingPlan.durationDays ?? 0}
                                                                    onChange={(e) => setEditingPlan({ ...editingPlan, durationDays: Number(e.target.value) })}
                                                                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 px-5 text-white focus:outline-none focus:border-info/50 transition-all font-bold text-sm"
                                                                    min={0}
                                                                />
                                                                <p className="text-[9px] text-white/40 leading-tight">0 = suscripción mensual. &gt;0 = pago único que expira a los N días.</p>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Tiempo x Parada (min)</label>
                                                                <input
                                                                    type="number"
                                                                    value={editingPlan.serviceTime ?? 5}
                                                                    onChange={(e) => setEditingPlan({ ...editingPlan, serviceTime: Number(e.target.value) })}
                                                                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 px-5 text-white focus:outline-none focus:border-info/50 transition-all font-bold text-sm"
                                                                    min={1}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Máx. Choferes</label>
                                                                <input
                                                                    type="number"
                                                                    value={editingPlan.maxMembers ?? 0}
                                                                    onChange={(e) => setEditingPlan({ ...editingPlan, maxMembers: Number(e.target.value) })}
                                                                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 px-5 text-white focus:outline-none focus:border-info/50 transition-all font-bold text-sm"
                                                                    min={0}
                                                                />
                                                                <p className="text-[9px] text-white/40 leading-tight">0 = ilimitado.</p>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Descripción</label>
                                                            <input
                                                                value={editingPlan.description}
                                                                onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                                                                className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 px-5 text-white focus:outline-none focus:border-info/50 transition-all font-bold text-sm"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Características (una por línea)</label>
                                                            <textarea
                                                                value={editingPlan.features}
                                                                onChange={(e) => setEditingPlan({ ...editingPlan, features: e.target.value })}
                                                                rows={4}
                                                                className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 px-5 text-white focus:outline-none focus:border-info/50 transition-all font-bold text-sm resize-none"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Color</label>
                                                            <input
                                                                value={editingPlan.color}
                                                                onChange={(e) => setEditingPlan({ ...editingPlan, color: e.target.value })}
                                                                className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 px-5 text-white focus:outline-none focus:border-info/50 transition-all font-bold text-sm"
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">CTA</label>
                                                                <input
                                                                    value={editingPlan.cta}
                                                                    onChange={(e) => setEditingPlan({ ...editingPlan, cta: e.target.value })}
                                                                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 px-5 text-white focus:outline-none focus:border-info/50 transition-all font-bold text-sm"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">CTA Link</label>
                                                                <input
                                                                    value={editingPlan.ctaLink}
                                                                    onChange={(e) => setEditingPlan({ ...editingPlan, ctaLink: e.target.value })}
                                                                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 px-5 text-white focus:outline-none focus:border-info/50 transition-all font-bold text-sm"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-6">
                                                            <label className="flex items-center gap-3 cursor-pointer">
                                                                <div
                                                                    onClick={() => setEditingPlan({ ...editingPlan, highlight: !editingPlan.highlight })}
                                                                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${editingPlan.highlight ? 'bg-info border-info' : 'bg-white/5 border-white/10'}`}
                                                                >
                                                                    {editingPlan.highlight && <Check className="w-3.5 h-3.5 text-dark font-black" strokeWidth={4} />}
                                                                </div>
                                                                <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Destacado</span>
                                                            </label>
                                                            <label className="flex items-center gap-3 cursor-pointer">
                                                                <div
                                                                    onClick={() => setEditingPlan({ ...editingPlan, active: !editingPlan.active })}
                                                                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${editingPlan.active ? 'bg-info border-info' : 'bg-white/5 border-white/10'}`}
                                                                >
                                                                    {editingPlan.active && <Check className="w-3.5 h-3.5 text-dark font-black" strokeWidth={4} />}
                                                                </div>
                                                                <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Activo</span>
                                                            </label>
                                                            <label className="flex items-center gap-3 cursor-pointer">
                                                                <div
                                                                    onClick={() => setEditingPlan({ ...editingPlan, grantsPro: !editingPlan.grantsPro })}
                                                                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${editingPlan.grantsPro ? 'bg-amber-500 border-amber-500' : 'bg-white/5 border-white/10'}`}
                                                                >
                                                                    {editingPlan.grantsPro && <Check className="w-3.5 h-3.5 text-dark font-black" strokeWidth={4} />}
                                                                </div>
                                                                <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Funciones Pro</span>
                                                            </label>
                                                            <label className="flex items-center gap-3 cursor-pointer">
                                                                <div
                                                                    onClick={() => setEditingPlan({ ...editingPlan, grantsFleet: !editingPlan.grantsFleet })}
                                                                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${editingPlan.grantsFleet ? 'bg-info border-info' : 'bg-white/5 border-white/10'}`}
                                                                >
                                                                    {editingPlan.grantsFleet && <Check className="w-3.5 h-3.5 text-dark font-black" strokeWidth={4} />}
                                                                </div>
                                                                <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Flotilla</span>
                                                            </label>
                                                        </div>
                                                        <div className="flex gap-3">
                                                            <button
                                                                onClick={handleUpdatePlan}
                                                                disabled={savingPricing}
                                                                className="flex-1 py-4 bg-info text-dark font-black rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 hover:scale-[1.02] active:scale-95 text-[10px] uppercase tracking-widest"
                                                            >
                                                                {savingPricing ? (
                                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                                ) : (
                                                                    <><Save className="w-4 h-4" /> GUARDAR CAMBIOS</>
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeletePlan(plan.id)}
                                                                disabled={savingPricing}
                                                                className="py-4 px-6 bg-red-500/10 border border-red-500/20 text-red-400 font-black rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-red-500/20 text-[10px] uppercase tracking-widest"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${plan.color || 'from-blue-400 to-indigo-500'}`} />
                                                                <h4 className="text-lg font-black text-white italic tracking-tight uppercase">{plan.name}</h4>
                                                                {plan.highlight && (
                                                                    <span className="text-[10px] font-black text-info bg-info/10 px-2.5 py-1 rounded-full uppercase tracking-widest border border-info/20">Destacado</span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {!plan.active && (
                                                                    <span className="text-[10px] font-black text-white/50 bg-white/5 px-2.5 py-1 rounded-full uppercase tracking-widest">Inactivo</span>
                                                                )}
                                                                <button
                                                                    onClick={() => startEditPlan(plan)}
                                                                    className="p-2 text-white/60 hover:text-info transition-all"
                                                                    title="Editar plan"
                                                                >
                                                                    <Edit3 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-wrap gap-4 text-[11px] font-bold">
                                                            <span className="text-white/60">${plan.price} <span className="text-white/50">MXN / mes</span></span>
                                                            {plan.trialDays > 0 && (
                                                                <span className="text-white/70">{plan.trialDays} días de prueba</span>
                                                            )}
                                                        </div>
                                                        {plan.description && (
                                                            <p className="text-white/70 text-xs font-medium">{plan.description}</p>
                                                        )}
                                                        {plan.features && plan.features.length > 0 && (
                                                            <div className="flex flex-wrap gap-2">
                                                                {plan.features.map((f: string, i: number) => (
                                                                    <span key={i} className="text-[10px] font-bold text-white/60 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                                                                        {f}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {plan.cta && (
                                                            <div className="text-white/60 text-[10px] font-bold">
                                                                CTA: {plan.cta} {plan.ctaLink && <span className="text-info">{plan.ctaLink}</span>}
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    {pricingPlans.filter((p: any) => p.id !== 'free').length === 0 && (
                                        <div className="text-center py-12 text-white/50 text-sm font-medium">
                                            No hay planes configurados. Haz clic en "AGREGAR PLAN" para crear el primero.
                                        </div>
                                    )}
                                </div>

                                {pricingMsg && (
                                    <div className={cn(
                                        "p-4 rounded-2xl text-xs font-black uppercase tracking-widest text-center",
                                        pricingMsg.includes('éxito') ? "bg-blue-500/10 text-blue-300 border border-blue-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                                    )}>
                                        {pricingMsg}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'usage' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-8">
                                <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">Uso de Google Maps</h3>
                                <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Estimación vs crédito $200 USD/mes</span>
                            </div>

                            {(!usageData || !usageData.current) ? (
                                <div className="p-10 bg-white/5 rounded-3xl text-center">
                                    <Cpu className="w-10 h-10 text-info/50 mx-auto mb-4 animate-pulse" />
                                    <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Sin uso registrado este mes</p>
                                    <p className="text-white/40 text-[10px] mt-1">Los contadores se activan cuando los choferes abren el mapa y dibujan rutas.</p>
                                </div>
                            ) : (
                                <>
                                    {usageData.current.usagePercent >= 80 ? (
                                        <div className="flex items-start gap-3 p-5 bg-red-500/10 border border-red-500/30 rounded-3xl">
                                            <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
                                            <div>
                                                <p className="text-red-300 font-black text-sm uppercase tracking-wider">¡Cuidado con la factura!</p>
                                                <p className="text-red-300/80 text-xs mt-1">
                                                    El uso estimado cubre el {usageData.current.usagePercent.toFixed(0)}% del free tier. Al rebasar el crédito de $200 USD/mes, Google comenzará a cobrar en tu cuenta de facturación.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-start gap-3 p-5 bg-blue-500/10 border border-blue-500/20 rounded-3xl">
                                            <Shield className="w-6 h-6 text-blue-300 flex-shrink-0" />
                                            <div>
                                                <p className="text-blue-300 font-black text-sm uppercase tracking-wider">Dentro del free tier</p>
                                                <p className="text-blue-300/70 text-xs mt-1">
                                                    Uso estimado del {usageData.current.usagePercent.toFixed(1)}% del crédito gratuito de $200 USD/mes. Todo bien por ahora.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="p-5 bg-white/5 rounded-3xl">
                                            <div className="flex items-center gap-2 text-white/50 mb-3">
                                                <Globe className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Cargas de Mapa</span>
                                            </div>
                                            <p className="text-3xl font-black text-white italic">{usageData.current.mapLoads.toLocaleString()}</p>
                                        </div>
                                        <div className="p-5 bg-white/5 rounded-3xl">
                                            <div className="flex items-center gap-2 text-white/50 mb-3">
                                                <RouteIcon className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Rutas Dibujadas</span>
                                            </div>
                                            <p className="text-3xl font-black text-white italic">{usageData.current.directions.toLocaleString()}</p>
                                        </div>
                                        <div className="p-5 bg-white/5 rounded-3xl">
                                            <div className="flex items-center gap-2 text-white/50 mb-3">
                                                <DollarSign className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Costo Estimado</span>
                                            </div>
                                            <p className="text-3xl font-black text-white italic">${usageData.current.estCost.toFixed(2)}</p>
                                        </div>
                                        <div className="p-5 bg-white/5 rounded-3xl">
                                            <div className="flex items-center gap-2 text-white/50 mb-3">
                                                <TrendingUp className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Free Tier Usado</span>
                                            </div>
                                            <p className="text-3xl font-black text-white italic">{usageData.current.usagePercent.toFixed(1)}%</p>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-white/5 rounded-3xl">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Crédito gratuito de este mes</span>
                                            <span className="text-xs font-black text-white">
                                                ${usageData.current.estCost.toFixed(2)} / ${usageData.freeCredit} USD
                                            </span>
                                        </div>
                                        <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${usageData.current.usagePercent >= 80 ? 'bg-red-500' : 'bg-info'}`}
                                                style={{ width: `${Math.max(2, usageData.current.usagePercent)}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-white/5 rounded-3xl overflow-hidden">
                                        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                                            <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Historial (últimos 12 meses)</span>
                                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">USD</span>
                                        </div>
                                        <div className="divide-y divide-white/5">
                                            {[...usageData.monthly].reverse().map((m: any) => (
                                                <div key={m.month} className="px-6 py-3 flex items-center justify-between">
                                                    <span className="text-xs font-bold text-white/70">{m.month}</span>
                                                    <div className="flex items-center gap-6 text-[11px] font-black text-white/50">
                                                        <span>{m.mapLoads} mapas</span>
                                                        <span>{m.directions} rutas</span>
                                                        <span className="text-white">${m.estCost.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-white/5 rounded-3xl p-6 border border-white/5">
                                        <div className="flex items-center gap-3 mb-4">
                                            <Shield className="w-5 h-5 text-info" />
                                            <h4 className="text-xs font-black text-white uppercase tracking-widest">Respaldo confiable: alertas de presupuesto de Google Cloud</h4>
                                        </div>
                                        <p className="text-xs text-white/60 leading-relaxed mb-4">
                                            Este medidor es una estimación (las tarifas y el uso real los cobra Google). Para no llevarte una sorpresa con la factura, configura el <span className="text-white font-bold">Budget</span> oficial en Google Cloud Console: Google te avisa por email (y opcionalmente por webhook) al 50%, 90% y 100% del presupuesto.
                                        </p>
                                        <ol className="space-y-2 text-[11px] text-white/70 list-decimal list-inside">
                                            <li>En <span className="text-white font-bold">console.cloud.google.com</span> entra al proyecto de Maps.</li>
                                            <li>Menú → Billing → <span className="text-white font-bold">Budgets & alerts</span> → Crear presupuesto.</li>
                                            <li>Monto sugerido: <span className="text-white font-bold">$50 USD</span> (por encima del free tier se empieza a cobrar).</li>
                                            <li>Thresholds: 50%, 90%, 100% → activa notificaciones por email.</li>
                                            <li>Opcional: activa notificaciones Pub/Sub (push a un webhook) si quieres verlo dentro de la app en el futuro.</li>
                                        </ol>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'alerts' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">Historial de Alertas SOS</h3>
                                <button
                                    onClick={fetchSosAlerts}
                                    className="flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black text-info uppercase tracking-widest transition-all border border-white/5"
                                >
                                    <Bell className="w-4 h-4" />
                                    Recargar
                                </button>
                            </div>

                            {loadingSos ? (
                                <div className="h-48 flex items-center justify-center opacity-40">
                                    <Loader2 className="w-8 h-8 animate-spin text-info" />
                                </div>
                            ) : sosAlerts.length === 0 ? (
                                <div className="h-64 flex flex-col items-center justify-center opacity-20">
                                    <Bell className="w-16 h-16 mb-4" />
                                    <p className="text-lg font-black uppercase tracking-widest">Sin alertas registradas</p>
                                </div>
                            ) : (
                                <div className="bg-white/5 border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-white/[0.01] border-b border-white/5">
                                                    <th className="p-3 sm:p-5 text-[10px] sm:text-xs font-black text-white/50 uppercase tracking-widest">Fecha</th>
                                                    <th className="p-3 sm:p-5 text-[10px] sm:text-xs font-black text-white/50 uppercase tracking-widest">Conductor</th>
                                                    <th className="p-3 sm:p-5 text-[10px] sm:text-xs font-black text-white/50 uppercase tracking-widest hidden sm:table-cell">Email</th>
                                                    <th className="p-3 sm:p-5 text-[10px] sm:text-xs font-black text-white/50 uppercase tracking-widest hidden sm:table-cell">Contacto</th>
                                                    <th className="p-3 sm:p-5 text-[10px] sm:text-xs font-black text-white/50 uppercase tracking-widest">Estado</th>
                                                    <th className="p-3 sm:p-5 text-[10px] sm:text-xs font-black text-white/50 uppercase tracking-widest">Ubicación</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {sosAlerts.map((alert: any) => (
                                                    <tr key={alert._id} className="hover:bg-white/[0.02] transition-colors">
                                                        <td className="p-3 sm:p-5 text-[10px] sm:text-xs font-bold text-white/60 whitespace-nowrap">
                                                            {new Date(alert.createdAt).toLocaleString()}
                                                        </td>
                                                        <td className="p-3 sm:p-5">
                                                            <span className="text-xs sm:text-sm font-black text-white">{alert.driverName}</span>
                                                        </td>
                                                        <td className="p-3 sm:p-5 text-[10px] sm:text-xs text-white/70 font-medium hidden sm:table-cell">{alert.email}</td>
                                                        <td className="p-3 sm:p-5 hidden sm:table-cell">
                                                            <span className="text-[10px] sm:text-xs font-bold text-white/60">{alert.contact}</span>
                                                        </td>
                                                        <td className="p-3 sm:p-5">
                                                            <span className={cn(
                                                                "text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-full font-black uppercase tracking-wider",
                                                                alert.status === 'sent'
                                                                    ? "bg-red-500/20 text-red-400"
                                                                    : "bg-white/10 text-white/70"
                                                            )}>
                                                                {alert.status === 'sent' ? 'ENVIADA' : 'FALLIDA'}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 sm:p-5">
                                                            {alert.location ? (
                                                                <a
                                                                    href={alert.location}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-[10px] sm:text-xs text-info underline underline-offset-2 hover:text-white transition-colors font-bold"
                                                                >
                                                                    Ver mapa
                                                                </a>
                                                            ) : (
                                                                <span className="text-[10px] sm:text-xs text-white/50">—</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Personal Profile Update Form */}
                            <form onSubmit={handleProfileUpdate} className="bg-white/5 border border-white/5 rounded-[28px] sm:rounded-[40px] p-5 sm:p-8 lg:p-12 space-y-6 sm:space-y-8 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <Shield className="w-32 h-32 rotate-12 text-info" />
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-3xl font-black text-white italic tracking-tighter mb-2 uppercase">Mis Credenciales</h3>
                                    <p className="text-white/70 text-sm font-medium">Actualiza tu información personal de acceso al Centro de Control.</p>
                                </div>

                                <div className="grid grid-cols-1 gap-6 relative z-10">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] ml-2">Mi Nombre</label>
                                        <input
                                            type="text"
                                            value={profileForm.name}
                                            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-white placeholder:text-white/40 focus:outline-none focus:border-info/50 transition-all font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] ml-2">Mi Correo Electrónico</label>
                                        <input
                                            type="email"
                                            value={profileForm.email}
                                            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-white placeholder:text-white/40 focus:outline-none focus:border-info/50 transition-all font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] ml-2">Nueva Contraseña (Opcional)</label>
                                        <input
                                            type="password"
                                            value={profileForm.password}
                                            onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                                            placeholder="••••••••"
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-white placeholder:text-white/40 focus:outline-none focus:border-info/50 transition-all font-bold"
                                        />
                                        <p className="text-[10px] text-white/50 font-black uppercase tracking-widest ml-2">Dejar vacío para mantener la actual</p>
                                    </div>
                                </div>

                                {profileMsg && (
                                    <div className={cn(
                                        "p-4 rounded-2xl text-xs font-black uppercase tracking-widest text-center",
                                        profileMsg.includes('éxito') ? "bg-blue-500/10 text-blue-300 border border-blue-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
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
                                    <p className="text-white/70 text-sm font-medium">Crea nuevas cuentas de administrador con privilegios totales sobre el Command Center.</p>
                                </div>
                            </div>

                            <form onSubmit={handleCreateAdmin} className="bg-white/5 border border-white/5 rounded-[40px] p-8 lg:p-12 space-y-8 shadow-2xl">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] ml-2">Nombre del Administrador</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={newAdmin.name}
                                                onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                                                placeholder="Ej. Sistema Central"
                                                className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-white placeholder:text-white/40 focus:outline-none focus:border-info/50 focus:ring-1 focus:ring-info/30 transition-all font-bold"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] ml-2">Correo Electrónico</label>
                                        <input
                                            type="email"
                                            value={newAdmin.email}
                                            onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                                            placeholder="admin@hormiruta.com"
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-white placeholder:text-white/40 focus:outline-none focus:border-info/50 focus:ring-1 focus:ring-info/30 transition-all font-bold"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] ml-2">Contraseña Maestra</label>
                                        <input
                                            type="password"
                                            value={newAdmin.password}
                                            onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                                            placeholder="••••••••"
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-white placeholder:text-white/40 focus:outline-none focus:border-info/50 focus:ring-1 focus:ring-info/30 transition-all font-bold"
                                            required
                                        />
                                    </div>
                                </div>

                                {adminMsg && (
                                    <div className={cn(
                                        "p-4 rounded-2xl text-xs font-black uppercase tracking-widest text-center animate-bounce",
                                        adminMsg.includes('éxito') ? "bg-blue-500/10 text-blue-300 border border-blue-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
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

                <footer className="pb-8 pt-4 text-center">
                    <p className="text-white/40 text-[10px] sm:text-xs">&copy; {new Date().getFullYear()} Jandosoft. Todos los derechos reservados.</p>
                </footer>
            </main>

            {/* Custom Confirm Dialog */}
            <ModalContainer
                isOpen={!!confirmDialog}
                onClose={() => setConfirmDialog(null)}
                title={confirmDialog?.title || 'Confirmar'}
                maxWidth="max-w-lg"
            >
                <div className="space-y-8">
                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-[20px] bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0">
                            <AlertTriangle className="w-7 h-7 text-amber-400" />
                        </div>
                        <div>
                            <p className="text-white/80 text-sm font-medium leading-relaxed">{confirmDialog?.message}</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setConfirmDialog(null)}
                            className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black text-white/60 uppercase tracking-[0.2em] transition-all border border-white/5"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={() => confirmDialog?.onConfirm?.()}
                            className="flex-1 py-4 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg shadow-amber-500/20"
                        >
                            Confirmar
                        </button>
                    </div>
                </div>
            </ModalContainer>

            {/* Custom Alert Dialog */}
            <ModalContainer
                isOpen={!!alertDialog}
                onClose={() => setAlertDialog(null)}
                title={alertDialog?.title || 'Aviso'}
                maxWidth="max-w-lg"
            >
                <div className="space-y-8">
                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-[20px] bg-red-500/10 flex items-center justify-center border border-red-500/20 shrink-0">
                            <AlertTriangle className="w-7 h-7 text-red-400" />
                        </div>
                        <div>
                            <p className="text-white/80 text-sm font-medium leading-relaxed">{alertDialog?.message}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setAlertDialog(null)}
                        className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black text-white uppercase tracking-[0.2em] transition-all border border-white/5"
                    >
                        Cerrar
                    </button>
                </div>
            </ModalContainer>
        </div>
    );
}
