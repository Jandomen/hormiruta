import { Navigation, CheckCircle, Clock, MapPin, AlertCircle, FileText, ExternalLink, XCircle, Hash, Package, Truck, ClipboardList, Copy, History } from 'lucide-react';
import { motion, Reorder } from 'framer-motion';
import { cn } from '../lib/utils';

export interface Stop {
    id: string;
    address: string;
    customerName?: string;
    timeWindow?: string;
    notes?: string;
    priority: 'HIGH' | 'NORMAL' | 'FIRST' | 'LAST';
    estimatedArrival?: string;
    isCompleted: boolean;
    isFailed: boolean;
    isCurrent: boolean;
    order: number;
    lat: number;
    lng: number;

    // New fields
    locator?: string;
    numPackages?: number;
    taskType?: 'DELIVERY' | 'COLLECTION';
    estimatedDuration?: number;
}

interface StopCardProps {
    stop: Stop;
    onNavigate: (stop: Stop) => void;
    onComplete: (id: string, isFailed?: boolean) => void;
    onEdit?: (stop: Stop) => void;
    onDuplicate?: (stop: Stop) => void;
    onRemove?: (id: string) => void;
}

const StopCard = ({ stop, onNavigate, onComplete, onEdit, onDuplicate, onRemove }: StopCardProps) => {
    return (
        <Reorder.Item
            value={stop}
            id={stop.id}
            dragListener={!stop.isCompleted && !stop.isFailed}
        >
            <motion.div
                layout
                className={cn(
                    "bg-[#0a0a0a] border border-white/5 p-4 rounded-[32px] transition-all duration-300 relative group overflow-hidden shadow-2xl",
                    stop.isCurrent ? "ring-2 ring-info/50 shadow-[0_0_40px_rgba(49,204,236,0.1)]" : "",
                    (stop.isCompleted || stop.isFailed) && "opacity-40 grayscale pointer-events-none"
                )}
            >
                {/* Visual Drag Handle */}
                {!stop.isCompleted && !stop.isFailed && (
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-10 group-hover:opacity-100 transition-opacity flex flex-col gap-1 p-1">
                        {[1, 2, 3].map(i => <div key={i} className="w-1 h-1 bg-white/40 rounded-full" />)}
                    </div>
                )}

                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 space-y-4 pl-4">
                        <div className="flex items-center gap-4">
                            <span className={cn(
                                "w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black shrink-0 shadow-inner",
                                stop.isCurrent ? "bg-info text-dark" : "bg-white/5 text-white/40",
                                stop.isFailed ? "bg-red-500/20 text-red-500" : ""
                            )}>
                                {stop.order}
                            </span>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-white font-black text-sm truncate uppercase tracking-tight">{stop.address}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    {stop.taskType === 'COLLECTION' ? (
                                        <div className="flex items-center gap-1.5 text-[9px] text-purple-400 font-black uppercase tracking-widest bg-purple-500/10 px-2 py-0.5 rounded-md">
                                            <ClipboardList className="w-3 h-3" /> Recogida
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-[9px] text-info font-black uppercase tracking-widest bg-info/10 px-2 py-0.5 rounded-md">
                                            <Truck className="w-3 h-3" /> Entrega
                                        </div>
                                    )}
                                    {stop.customerName && (
                                        <p className="text-[10px] text-white/40 font-bold truncate">
                                            {stop.customerName}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {stop.locator && (
                                <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1.5 rounded-xl border border-white/5 text-[9px] text-white/60 font-black uppercase tracking-tighter">
                                    <Hash className="w-3 h-3 text-info" />
                                    {stop.locator}
                                </div>
                            )}
                            {stop.numPackages && stop.numPackages > 1 && (
                                <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1.5 rounded-xl border border-white/5 text-[9px] text-white/60 font-black uppercase">
                                    <Package className="w-3 h-3 text-info" />
                                    {stop.numPackages} Paquetes
                                </div>
                            )}
                            {stop.estimatedArrival && !stop.isCompleted && !stop.isFailed && (
                                <div className="flex items-center gap-1.5 bg-info/10 px-2.5 py-1.5 rounded-xl border border-info/20 text-[9px] text-info font-black uppercase shadow-[0_0_10px_rgba(49,204,236,0.1)]">
                                    ETA: {stop.estimatedArrival}
                                </div>
                            )}
                            {stop.timeWindow && (
                                <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1.5 rounded-xl border border-white/5 text-[9px] text-white/50 font-bold uppercase tracking-tight">
                                    <Clock className="w-3 h-3 text-info/50" />
                                    {stop.timeWindow}
                                </div>
                            )}
                            {(stop.priority === 'HIGH' || stop.priority === 'FIRST') && (
                                <div className="flex items-center gap-1.5 bg-red-500/10 text-red-500 px-2.5 py-1.5 rounded-xl border border-red-500/20 text-[9px] font-black uppercase animate-pulse">
                                    <AlertCircle className="w-3 h-3" />
                                    Prioridad Máxima
                                </div>
                            )}
                        </div>

                        {stop.notes && (
                            <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                                <p className="text-[10px] text-white/30 font-medium leading-relaxed italic">
                                    "{stop.notes}"
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        {!stop.isCompleted && !stop.isFailed && (
                            <>
                                <button
                                    onClick={() => onNavigate(stop)}
                                    className="w-12 h-12 flex items-center justify-center bg-info text-dark rounded-2xl shadow-[0_15px_30px_rgba(49,204,236,0.3)] hover:scale-105 active:scale-95 transition-all"
                                >
                                    <Navigation className="w-6 h-6" />
                                </button>

                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <button
                                        onClick={() => onEdit?.(stop)}
                                        className="w-12 h-12 lg:w-10 lg:h-10 flex items-center justify-center bg-white/5 text-white/40 rounded-xl hover:bg-white/10 transition-all active:scale-90 border border-white/5"
                                        title="Editar"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => onDuplicate?.(stop)}
                                        className="w-12 h-12 lg:w-10 lg:h-10 flex items-center justify-center bg-white/5 text-white/40 rounded-xl hover:bg-white/10 transition-all active:scale-90 border border-white/5"
                                        title="Duplicar"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => onComplete(stop.id, true)}
                                        className="flex-1 h-12 flex items-center justify-center bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all active:scale-90 border border-red-500/20"
                                    >
                                        <XCircle className="w-6 h-6" />
                                    </button>
                                    <button
                                        onClick={() => onComplete(stop.id, false)}
                                        className="flex-1 h-12 flex items-center justify-center bg-green-500 text-dark rounded-2xl shadow-[0_15px_30px_rgba(34,197,94,0.3)] hover:brightness-110 transition-all active:scale-90"
                                    >
                                        <CheckCircle className="w-6 h-6" />
                                    </button>
                                </div>
                                <button
                                    onClick={() => onRemove?.(stop.id)}
                                    className="w-full py-2 flex items-center justify-center bg-white/[0.02] text-white/10 hover:text-red-500 transition-colors text-[9px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-red-500/5"
                                >
                                    Eliminar
                                </button>
                            </>
                        )}
                        {(stop.isCompleted || stop.isFailed) && (
                            <div className="w-12 h-12 flex items-center justify-center">
                                {stop.isFailed ? (
                                    <XCircle className="w-8 h-8 text-red-500/30 stroke-[3px]" />
                                ) : (
                                    <CheckCircle className="w-8 h-8 text-green-500/30 stroke-[3px]" />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </Reorder.Item>
    );
};

export default StopCard;
