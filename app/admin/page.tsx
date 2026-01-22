'use client';

import { useState } from 'react';
import {
    LayoutDashboard, Users, Map as MapIcon, Settings,
    Bell, Search, Filter, Download, MoreVertical
} from 'lucide-react';
import { cn } from '../lib/utils';
import Map from '../components/Map'; // Reusing Map for now, can be specialized later

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState('overview');

    // Mock Data for Admin
    const drivers = [
        { id: 1, name: 'Juan Pérez', status: 'active', location: 'CDMX', lastUpdate: 'Hace 5 min' },
        { id: 2, name: 'Carlos Ruiz', status: 'idle', location: 'Toluca', lastUpdate: 'Hace 12 min' },
        { id: 3, name: 'Ana López', status: 'offline', location: '--', lastUpdate: 'Hace 2 horas' },
    ];

    const expenses = [
        { id: 101, driver: 'Juan Pérez', type: 'Gasolina', amount: 850.00, date: '21/01/2026', status: 'approved' },
        { id: 102, driver: 'Carlos Ruiz', type: 'Peaje', amount: 120.00, date: '21/01/2026', status: 'pending' },
        { id: 103, driver: 'Juan Pérez', type: 'Mantenimiento', amount: 2500.00, date: '20/01/2026', status: 'review' },
    ];

    return (
        <div className="flex h-screen bg-[#0a0a0a] text-foreground font-sans overflow-hidden">
            {/* Admin Sidebar */}
            <aside className="w-20 lg:w-64 bg-[#111] border-r border-white/5 flex flex-col items-center lg:items-stretch py-6 z-20">
                <div className="mb-8 px-4 flex items-center justify-center lg:justify-start gap-3">
                    <img src="/LogoHormiruta.png" alt="Admin" className="w-8 h-8 opacity-80" />
                    <span className="hidden lg:block font-black text-white/50 tracking-widest text-xs uppercase">Command Center</span>
                </div>

                <nav className="flex-1 space-y-1 px-2">
                    {[
                        { id: 'overview', icon: LayoutDashboard, label: 'Vista General' },
                        { id: 'map', icon: MapIcon, label: 'Mapa de Flota' },
                        { id: 'drivers', icon: Users, label: 'Conductores' },
                        { id: 'settings', icon: Settings, label: 'Configuración' },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={cn(
                                "w-full p-3 rounded-xl flex items-center gap-3 transition-colors",
                                activeTab === item.id
                                    ? "bg-white/10 text-white"
                                    : "text-white/40 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="hidden lg:block text-sm font-bold">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-4">
                    <div className="w-10 h-10 lg:w-10 lg:h-10 rounded-full bg-gradient-to-tr from-info to-purple-500 mx-auto lg:mx-0"></div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative overflow-hidden">
                {/* Topbar */}
                <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#0a0a0a]/50 backdrop-blur-md z-10">
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight">
                        {activeTab === 'overview' && 'Panel de Control'}
                        {activeTab === 'map' && 'Monitoreo en Vivo'}
                        {activeTab === 'drivers' && 'Gestión de Personal'}
                    </h2>
                    <div className="flex items-center gap-4">
                        <div className="relative hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                            <input
                                type="text"
                                placeholder="Buscar chofer, ruta..."
                                className="bg-white/5 border border-white/10 rounded-full py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-info/30"
                            />
                        </div>
                        <button className="p-2 text-white/50 hover:text-white relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Overview Stats */}
                    {activeTab === 'overview' && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                {[
                                    { label: 'Unidades Activas', val: '12', sub: '+2 hoy', color: 'text-info' },
                                    { label: 'Gastos del Mes', val: '$45,200', sub: '-5% vs mes ant.', color: 'text-emerald-400' },
                                    { label: 'Km Recorridos', val: '12,504', sub: 'Total flota', color: 'text-white' },
                                    { label: 'Alertas', val: '3', sub: 'Requieren atención', color: 'text-red-400' },
                                ].map((stat, i) => (
                                    <div key={i} className="bg-[#111] border border-white/5 rounded-2xl p-6">
                                        <p className="text-xs font-bold text-white/30 uppercase">{stat.label}</p>
                                        <h3 className={cn("text-3xl font-black mt-2", stat.color)}>{stat.val}</h3>
                                        <p className="text-xs text-white/50 mt-1">{stat.sub}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
                                <div className="lg:col-span-2 bg-[#111] border border-white/5 rounded-2xl p-1 overflow-hidden relative">
                                    <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                                        <span className="text-xs font-bold text-white flex items-center gap-2">
                                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                            Mapa en Vivo
                                        </span>
                                    </div>
                                    <Map stops={[]} userVehicle={{ type: 'truck', isActive: false }} /> {/* Placeholder for Fleet Map */}
                                </div>

                                <div className="bg-[#111] border border-white/5 rounded-2xl p-6 flex flex-col">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="font-bold text-white">Gastos Recientes</h3>
                                    </div>
                                    <div className="flex-1 overflow-y-auto space-y-4">
                                        {expenses.map((exp) => (
                                            <div key={exp.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-[#222] flex items-center justify-center text-xs font-bold text-white/50">
                                                        {exp.driver.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-white">{exp.type}</p>
                                                        <p className="text-xs text-white/40">{exp.driver}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-white">${exp.amount}</p>
                                                    <span className={cn(
                                                        "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                                                        exp.status === 'approved' ? "bg-green-500/20 text-green-400" :
                                                            exp.status === 'review' ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"
                                                    )}>
                                                        {exp.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button className="mt-4 w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-white uppercase tracking-widest transition-colors">
                                        Ver Reporte Completo
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
