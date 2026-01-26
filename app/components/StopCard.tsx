import { Navigation, CheckCircle, Clock, MapPin, AlertCircle, FileText, ExternalLink, XCircle, Hash, Package, Truck, ClipboardList, Copy, History, GripVertical } from 'lucide-react';
import { motion, Reorder, useDragControls } from 'framer-motion';
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
    onRevert?: (id: string) => void;
}

const StopCard = ({ stop, onNavigate, onComplete, onEdit, onDuplicate, onRemove, onRevert }: StopCardProps) => {
    const dragControls = useDragControls();

    return (
        <Reorder.Item
            value={stop}
            id={stop.id}
            dragListener={false}
            dragControls={dragControls}
        >
            <motion.div
                layout
                className={cn(
                    "bg-[#0a0a0a] border border-white/5 p-3 rounded-[24px] transition-all duration-300 relative group overflow-hidden shadow-2xl",
                    stop.isCurrent ? "ring-2 ring-info/50" : "",
                    (stop.isCompleted || stop.isFailed) && "opacity-60 grayscale"
                )}
            >
                {/* Visual Drag Handle - Dedicated for mobile scrolling safety */}
                {!stop.isCompleted && !stop.isFailed && (
                    <div
                        onPointerDown={(e) => dragControls.start(e)}
                        className="absolute left-1 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-100 transition-opacity p-2 cursor-grab active:cursor-grabbing touch-none z-10"
                    >
                        <GripVertical className="w-4 h-4 text-white/40" />
                    </div>
                )}

                <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex items-center gap-3">
                            <span className={cn(
                                "w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0 shadow-inner",
                                stop.isCurrent ? "bg-info text-dark" : "bg-white/5 text-white/40",
                                stop.isFailed ? "bg-red-500/20 text-red-500" : ""
                            )}>
                                {stop.order}
                            </span>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-white font-black text-xs truncate uppercase tracking-tight">{stop.address}</h3>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    {stop.taskType === 'COLLECTION' ? (
                                        <div className="flex items-center gap-1 text-[8px] text-purple-400 font-black uppercase tracking-widest bg-purple-500/10 px-1.5 py-0.5 rounded">
                                            <ClipboardList className="w-2.5 h-2.5" /> Recogida
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 text-[8px] text-info font-black uppercase tracking-widest bg-info/10 px-1.5 py-0.5 rounded">
                                            <Truck className="w-2.5 h-2.5" /> Entrega
                                        </div>
                                    )}
                                    {stop.customerName && (
                                        <p className="text-[9px] text-white/40 font-bold truncate">
                                            {stop.customerName}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                            {stop.locator && (
                                <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg border border-white/5 text-[8px] text-white/60 font-black uppercase tracking-tighter">
                                    <Hash className="w-2.5 h-2.5 text-info" />
                                    {stop.locator}
                                </div>
                            )}
                            {stop.numPackages && stop.numPackages > 1 && (
                                <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg border border-white/5 text-[8px] text-white/60 font-black uppercase">
                                    <Package className="w-2.5 h-2.5 text-info" />
                                    {stop.numPackages} Pzs
                                </div>
                            )}
                            {stop.estimatedArrival && !stop.isCompleted && !stop.isFailed && (
                                <div className="flex items-center gap-1 bg-info/10 px-2 py-1 rounded-lg border border-info/20 text-[8px] text-info font-black uppercase">
                                    ETA: {stop.estimatedArrival}
                                </div>
                            )}
                            {stop.timeWindow && (
                                <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg border border-white/5 text-[8px] text-white/50 font-bold uppercase">
                                    <Clock className="w-2.5 h-2.5 text-info/50" />
                                    {stop.timeWindow}
                                </div>
                            )}
                            {(stop.priority === 'HIGH' || stop.priority === 'FIRST') && (
                                <div className="flex items-center gap-1 bg-red-500/10 text-red-500 px-2 py-1 rounded-lg border border-red-500/20 text-[8px] font-black uppercase animate-pulse">
                                    <AlertCircle className="w-2.5 h-2.5" />
                                    Pri.
                                </div>
                            )}
                        </div>

                        {stop.notes && (
                            <div className="bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                                <p className="text-[9px] text-white/30 font-medium leading-tight italic">
                                    "{stop.notes}"
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-1 shrink-0">
                        {!stop.isCompleted && !stop.isFailed && (
                            <>
                                <button
                                    onClick={() => onNavigate(stop)}
                                    className="w-9 h-9 flex items-center justify-center bg-info text-dark rounded-lg shadow-lg hover:scale-105 active:scale-95 transition-all"
                                >
                                    <Navigation className="w-4 h-4" />
                                </button>

                                <div className="grid grid-cols-2 gap-1">
                                    <button
                                        onClick={() => onEdit?.(stop)}
                                        className="w-9 h-9 flex items-center justify-center bg-white/5 text-white/40 rounded-lg hover:bg-white/10 transition-all active:scale-90 border border-white/5"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => onDuplicate?.(stop)}
                                        className="w-9 h-9 flex items-center justify-center bg-white/5 text-white/40 rounded-lg hover:bg-white/10 transition-all active:scale-90 border border-white/5"
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <div className="flex gap-1">
                                    <button
                                        onClick={() => onComplete(stop.id, true)}
                                        className="flex-1 h-9 flex items-center justify-center bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all active:scale-90 border border-red-500/20"
                                    >
                                        <XCircle className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => onComplete(stop.id, false)}
                                        className="flex-1 h-9 flex items-center justify-center bg-green-500 text-dark rounded-lg shadow-lg hover:brightness-110 transition-all active:scale-90"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                    </button>
                                </div>
                                <button
                                    onClick={() => onRemove?.(stop.id)}
                                    className="w-full py-1 flex items-center justify-center bg-white/[0.02] text-white/10 hover:text-red-500 transition-colors text-[7px] font-black uppercase tracking-widest rounded-lg"
                                >
                                    Eliminar
                                </button>
                            </>
                        )}
                        {(stop.isCompleted || stop.isFailed) && (
                            <div className="flex flex-col gap-2">
                                <div className="w-9 h-9 flex items-center justify-center">
                                    {stop.isFailed ? (
                                        <XCircle className="w-5 h-5 text-red-500/50 stroke-[3px]" />
                                    ) : (
                                        <CheckCircle className="w-5 h-5 text-green-500/50 stroke-[3px]" />
                                    )}
                                </div>
                                <button
                                    onClick={() => onRevert?.(stop.id)}
                                    className="px-2 py-1 text-[7px] font-black uppercase text-info hover:text-white transition-colors border border-info/20 rounded-md bg-info/5"
                                >
                                    Rescatar
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </Reorder.Item>
    );
};

export default StopCard;
