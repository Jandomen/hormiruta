'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, X, User, Clock, AlertCircle, FileText, ChevronDown, MapPin, QrCode, Mic, Hash, Package, ArrowUpCircle, ArrowDownCircle, RotateCw, Truck, ClipboardList, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { cn } from '../lib/utils';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';

interface StopInputProps {
    onAddStop: (stop: any) => void;
    onUpdateStop?: (stop: any) => void;
    onOptimize?: (newStop: any) => void;
    onCancel?: () => void;
    initialData?: any;
    isEditing?: boolean;
}

const StopInput = ({ onAddStop, onUpdateStop, onOptimize, onCancel, initialData, isEditing }: StopInputProps) => {
    const [address, setAddress] = useState(initialData?.address || '');
    const [customerName, setCustomerName] = useState(initialData?.customerName || '');
    const [phone, setPhone] = useState(initialData?.phone || '');
    const [priority, setPriority] = useState<'HIGH' | 'NORMAL' | 'FIRST' | 'LAST'>(initialData?.priority || 'NORMAL');
    const [timeWindow, setTimeWindow] = useState(initialData?.timeWindow || '');
    const [notes, setNotes] = useState(initialData?.notes || '');

    const [locator, setLocator] = useState(initialData?.locator || '');
    const [numPackages, setNumPackages] = useState(initialData?.numPackages || 1);
    const [taskType, setTaskType] = useState<'DELIVERY' | 'COLLECTION'>(initialData?.taskType || 'DELIVERY');
    const [arrivalTimeType, setArrivalTimeType] = useState<'ANY' | 'SPECIFIC'>(initialData?.arrivalTimeType || 'ANY');
    const [estimatedDuration, setEstimatedDuration] = useState(initialData?.estimatedDuration || 10);
    const [licensePlate, setLicensePlate] = useState(initialData?.licensePlate || '');
    const [boxes, setBoxes] = useState(initialData?.boxes || 0);

    const [street, setStreet] = useState('');
    const [extNumber, setExtNumber] = useState('');
    const [colony, setColony] = useState('');
    const [zipCode, setZipCode] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [showManualRefinement, setShowManualRefinement] = useState(false);

    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isFocused, setIsFocused] = useState(false);
    const [showDetails, setShowDetails] = useState(isEditing || !!(initialData?.customerName || initialData?.timeWindow || initialData?.notes || initialData?.locator || initialData?.phone));
    const [isRecording, setIsRecording] = useState(false);
    const [notification, setNotification] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const placesLibrary = useMapsLibrary('places');
    const [sessionToken, setSessionToken] = useState<google.maps.places.AutocompleteSessionToken | null>(null);

    const [selectedCoords, setSelectedCoords] = useState<{ lat: number, lng: number } | null>(null);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    React.useEffect(() => {
        if (!placesLibrary || sessionToken) return;
        setSessionToken(new (placesLibrary as any).AutocompleteSessionToken());
    }, [placesLibrary]);

    const handleVoiceInput = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('El reconocimiento de voz no es compatible con este navegador.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'es-MX';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => setIsRecording(true);
        recognition.onend = () => setIsRecording(false);
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            if (isFocused) {
                setAddress(transcript);
                fetchSuggestions(transcript);
            } else {
                setNotes((prev: string) => prev + ' ' + transcript);
            }
        };

        recognition.start();
    };

    const fetchSuggestions = async (query: string) => {
        if (query.length < 3 || !placesLibrary) {
            setSuggestions([]);
            return;
        }

        const lib = placesLibrary as any;
        if (!lib.AutocompleteSuggestion) return;

        try {
            const { suggestions } = await lib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
                input: query,
                sessionToken: sessionToken || undefined,
                includedRegionCodes: ['mx'],
            });
            setSuggestions(suggestions);
        } catch (err) {
            console.error('Autocomplete error:', err);
            setSuggestions([]);
        }
    };

    const handleSelectSuggestion = async (suggestion: any) => {
        const placePrediction = suggestion.placePrediction;
        if (!placePrediction) return;

        setAddress(placePrediction.text.text);
        setSuggestions([]);
        setShowDetails(true);

        try {
            const place = await placePrediction.toPlace();
            await place.fetchFields({
                fields: ['location', 'formattedAddress']
            });

            if (place.location) {
                setSelectedCoords({
                    lat: place.location.lat(),
                    lng: place.location.lng()
                });
            }
            if (place.formattedAddress) setAddress(place.formattedAddress);

            // Renovamos token para la siguiente búsqueda
            const lib = placesLibrary as any;
            if (lib.AutocompleteSessionToken) {
                setSessionToken(new lib.AutocompleteSessionToken());
            }
        } catch (err) {
            console.error('Place Details error:', err);
        }
    };

    const handleSave = () => {
        if (!address) return;
        const stopData = {
            id: initialData?.id || Math.random().toString(36).substr(2, 9),
            address,
            customerName,
            phone,
            priority,
            timeWindow: arrivalTimeType === 'SPECIFIC' ? timeWindow : 'Cualquier hora',
            notes,
            locator,
            numPackages,
            taskType,
            arrivalTimeType,
            estimatedDuration,
            lat: selectedCoords?.lat || initialData?.lat || 19.43,
            lng: selectedCoords?.lng || initialData?.lng || -99.13,
            isCompleted: initialData?.isCompleted || false,
            isFailed: initialData?.isFailed || false,
            isCurrent: initialData?.isCurrent || false,
            order: initialData?.order || 1,
            licensePlate,
            boxes,
        };

        if (isEditing && onUpdateStop) {
            onUpdateStop(stopData);
        } else {
            onAddStop(stopData);
        }

        if (!isEditing) {
            setAddress('');
            setCustomerName('');
            setPhone('');
            setTimeWindow('');
            setNotes('');
            setLocator('');
            setNumPackages(1);
            setTaskType('DELIVERY');
            setArrivalTimeType('ANY');
            setEstimatedDuration(10);
            setLicensePlate('');
            setBoxes(0);
            setSuggestions([]);
            setSelectedCoords(null);
            setShowDetails(false);

            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    };

    const [activeTab, setActiveTab] = useState<'CONTACT' | 'LOGISTICS' | 'OPERATIONS'>('CONTACT');

    return (
        <div className="space-y-3 sm:space-y-6">
            <div className="relative">
                <div className={cn(
                    "flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-dark border border-white/5 rounded-2xl transition-all shadow-inner",
                    isFocused && "border-info shadow-[0_0_30px_rgba(49,204,236,0.1)] ring-1 ring-info/20"
                )}>
                    <Search className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-info/50 shrink-0" />
                    <div className="flex-1 relative">
                        <input
                            ref={inputRef}
                            type="text"
                            value={address}
                            onChange={(e) => {
                                setAddress(e.target.value);
                                fetchSuggestions(e.target.value);
                            }}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                            placeholder="Buscar dirección..."
                            className="w-full bg-transparent border-none outline-none text-white text-xs sm:text-base placeholder:text-white/20 font-bold"
                        />
                        <AnimatePresence>
                            {notification && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="absolute inset-0 bg-darker flex items-center text-[10px] font-black text-info uppercase tracking-widest px-1"
                                >
                                    {notification}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 border-l border-white/10 pl-2 sm:pl-3">
                        {!isEditing && onOptimize && (
                            <button
                                onClick={async (e) => { 
                                    e.preventDefault(); 
                                    if (!address) return;
                                    const stopData = {
                                        id: Math.random().toString(36).substr(2, 9),
                                        address,
                                        lat: selectedCoords?.lat || 19.43,
                                        lng: selectedCoords?.lng || -99.13,
                                        isCompleted: false,
                                        isFailed: false,
                                        isCurrent: false,
                                        order: 999,
                                        customerName,
                                        phone,
                                        timeWindow: arrivalTimeType === 'SPECIFIC' ? timeWindow : 'Cualquier hora',
                                        notes,
                                        numPackages,
                                    };
                                    onOptimize(stopData);
                                    setAddress('');
                                    setNotification('🔄 Optimizando...');
                                }}
                                disabled={!address}
                                className="p-2 sm:p-3 bg-darker border border-info/30 text-info rounded-xl sm:rounded-2xl hover:bg-info/10 transition-all disabled:opacity-20"
                                title="Agregar y Optimizar"
                            >
                                <RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        )}
                        <button
                            onClick={(e) => { e.preventDefault(); handleSave(); }}
                            disabled={!address}
                            className="px-3 sm:px-6 py-2 sm:py-3 bg-info text-dark rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all disabled:opacity-20 disabled:grayscale shrink-0"
                        >
                            {isEditing ? 'Guardar' : 'Agregar'}
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {isFocused && suggestions.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-dark border border-white/10 rounded-2xl z-50 overflow-hidden shadow-2xl backdrop-blur-xl"
                        >
                            <ul className="divide-y divide-white/5">
                                {suggestions.map((s, i) => (
                                    <li
                                        key={i}
                                        onClick={() => handleSelectSuggestion(s)}
                                        className="p-3 sm:p-5 hover:bg-info/10 cursor-pointer text-white/70 flex items-center gap-3 sm:gap-4 transition-all group"
                                    >
                                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-info/5 flex items-center justify-center group-hover:bg-info/20 shrink-0">
                                            <MapPin className="w-4 h-4 text-info/60" />
                                        </div>
                                        <div className="flex-1 truncate">
                                            <p className="truncate font-black text-[10px] sm:text-sm text-white italic">{s.placePrediction?.mainText?.text}</p>
                                            <p className="truncate text-[7px] sm:text-[10px] text-white/40 uppercase tracking-widest font-bold">{s.placePrediction?.secondaryText?.text}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-[8px] font-black text-info uppercase tracking-widest flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors italic w-full justify-center"
            >
                {showDetails ? 'Menos Opciones' : 'Más Opciones'}
                <ChevronDown className={cn("w-3 h-3 transition-transform", showDetails && "rotate-180")} />
            </button>

            <AnimatePresence>
                {showDetails && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-3 overflow-hidden"
                    >
                        <div className="flex p-0.5 sm:p-1 bg-white/5 rounded-xl border border-white/5">
                            {[
                                { id: 'CONTACT', label: 'Contacto' },
                                { id: 'LOGISTICS', label: 'Carga' },
                                { id: 'OPERATIONS', label: 'Ruta' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={cn(
                                        "flex-1 py-2 sm:py-2 text-[7px] sm:text-[8px] font-black uppercase tracking-tighter rounded-lg transition-all",
                                        activeTab === tab.id ? "bg-info text-dark" : "text-white/30 hover:text-white/50"
                                    )}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="bg-darker/30 p-3 sm:p-4 rounded-2xl border border-white/5 space-y-3 sm:space-y-4">
                            {activeTab === 'CONTACT' && (
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <label className="text-[7px] font-black text-white/20 uppercase tracking-widest pl-1">Cliente</label>
                                        <div className="flex items-center gap-2.5 p-2.5 bg-white/5 border border-white/5 rounded-xl text-white">
                                            <User className="w-3 h-3 text-info/30" />
                                            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="bg-transparent outline-none text-[10px] w-full font-bold" placeholder="Nombre..." />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[7px] font-black text-white/20 uppercase tracking-widest pl-1">Teléfono</label>
                                        <div className="flex items-center gap-2.5 p-2.5 bg-white/5 border border-white/5 rounded-xl text-white">
                                            <Phone className="w-3 h-3 text-info/30" />
                                            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-transparent outline-none text-[10px] w-full font-bold" placeholder="55..." />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'LOGISTICS' && (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <label className="text-[7px] font-black text-white/20 uppercase tracking-widest pl-1">Placas</label>
                                            <div className="flex items-center gap-2 p-2.5 bg-white/5 border border-white/5 rounded-xl text-white">
                                                <Truck className="w-3 h-3 text-info/30" />
                                                <input value={licensePlate} onChange={(e) => setLicensePlate(e.target.value)} className="bg-transparent outline-none text-[10px] w-full font-bold uppercase" placeholder="---" />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[7px] font-black text-white/20 uppercase tracking-widest pl-1">Cuadros</label>
                                            <div className="flex items-center gap-2 p-2.5 bg-white/5 border border-white/5 rounded-xl text-white">
                                                <Package className="w-3 h-3 text-info/30" />
                                                <input type="number" value={boxes} onChange={(e) => setBoxes(parseInt(e.target.value) || 0)} className="bg-transparent outline-none text-[10px] w-full font-bold" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <label className="text-[7px] font-black text-white/20 uppercase tracking-widest pl-1">Localizador</label>
                                            <div className="flex items-center gap-2 p-2.5 bg-white/5 border border-white/5 rounded-xl text-white">
                                                <Hash className="w-3 h-3 text-info/30" />
                                                <input value={locator} onChange={(e) => setLocator(e.target.value)} className="bg-transparent outline-none text-[10px] w-full font-bold" placeholder="ID" />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[7px] font-black text-white/20 uppercase tracking-widest pl-1">Piezas</label>
                                            <div className="flex items-center gap-2 p-2.5 bg-white/5 border border-white/5 rounded-xl text-white">
                                                <Package className="w-3 h-3 text-info/30" />
                                                <input type="number" value={numPackages} onChange={(e) => setNumPackages(parseInt(e.target.value))} className="bg-transparent outline-none text-[10px] w-full font-bold" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'OPERATIONS' && (
                                <div className="space-y-3">
                                    <div className="flex p-0.5 bg-darker/50 rounded-xl border border-white/5">
                                        <button onClick={() => setTaskType('DELIVERY')} className={cn("flex-1 py-1.5 text-[7px] font-black uppercase rounded-lg transition-all", taskType === 'DELIVERY' ? "bg-info text-dark shadow-lg" : "text-white/20")}>Entrega</button>
                                        <button onClick={() => setTaskType('COLLECTION')} className={cn("flex-1 py-1.5 text-[7px] font-black uppercase rounded-lg transition-all", taskType === 'COLLECTION' ? "bg-purple-500 text-white shadow-lg" : "text-white/20")}>Recogida</button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <label className="text-[7px] font-black text-white/20 uppercase tracking-widest pl-1">Prioridad</label>
                                            <select value={priority} onChange={(e) => setPriority(e.target.value as any)} className="w-full bg-white/5 border border-white/5 rounded-xl py-2 px-2 text-[9px] text-white font-black uppercase outline-none appearance-none">
                                                <option value="NORMAL">⚡ Auto</option>
                                                <option value="HIGH">🔥 Alta</option>
                                                <option value="FIRST">🔝 1ra</option>
                                                <option value="LAST">🏁 Fin</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[7px] font-black text-white/20 uppercase tracking-widest pl-1">Duración</label>
                                            <div className="flex items-center gap-2 p-2 bg-white/5 border border-white/5 rounded-xl text-white">
                                                <Clock className="w-3 h-3 text-info/30" />
                                                <input type="number" value={estimatedDuration} onChange={(e) => setEstimatedDuration(parseInt(e.target.value))} className="bg-transparent outline-none text-[10px] w-full font-bold" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[7px] font-black text-white/20 uppercase tracking-widest pl-1">Instrucciones</label>
                                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-xl p-2.5 text-[9px] text-white h-16 resize-none placeholder:text-white/10 italic outline-none" placeholder="Nota..." />
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex gap-2 pt-1">
                {onCancel && (
                    <button onClick={onCancel} className="flex-1 py-3 bg-white/5 text-white/40 font-black uppercase text-[8px] tracking-widest rounded-xl border border-white/5">Cerrar</button>
                )}
                <button onClick={handleSave} disabled={!address} className="flex-[2] py-3 bg-info text-dark font-black uppercase text-[8px] tracking-widest rounded-xl shadow-lg disabled:opacity-30">
                    {isEditing ? 'Guardar Cambios' : 'Añadir a Ruta'}
                </button>
            </div>
        </div>
    );
};

export default StopInput;
