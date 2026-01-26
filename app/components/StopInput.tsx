'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, X, User, Clock, AlertCircle, FileText, ChevronDown, MapPin, QrCode, Mic, Hash, Package, ArrowUpCircle, ArrowDownCircle, RotateCw, Truck, ClipboardList } from 'lucide-react';
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
    const [priority, setPriority] = useState<'HIGH' | 'NORMAL' | 'FIRST' | 'LAST'>(initialData?.priority || 'NORMAL');
    const [timeWindow, setTimeWindow] = useState(initialData?.timeWindow || '');
    const [notes, setNotes] = useState(initialData?.notes || '');

    // New fields
    const [locator, setLocator] = useState(initialData?.locator || '');
    const [numPackages, setNumPackages] = useState(initialData?.numPackages || 1);
    const [taskType, setTaskType] = useState<'DELIVERY' | 'COLLECTION'>(initialData?.taskType || 'DELIVERY');
    const [arrivalTimeType, setArrivalTimeType] = useState<'ANY' | 'SPECIFIC'>(initialData?.arrivalTimeType || 'ANY');
    const [estimatedDuration, setEstimatedDuration] = useState(initialData?.estimatedDuration || 10);
    const [licensePlate, setLicensePlate] = useState(initialData?.licensePlate || '');
    const [boxes, setBoxes] = useState(initialData?.boxes || 0);

    // Manual refinement fields
    const [street, setStreet] = useState('');
    const [extNumber, setExtNumber] = useState('');
    const [colony, setColony] = useState('');
    const [zipCode, setZipCode] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [showManualRefinement, setShowManualRefinement] = useState(false);

    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isFocused, setIsFocused] = useState(false);
    const [showDetails, setShowDetails] = useState(isEditing || !!(initialData?.customerName || initialData?.timeWindow || initialData?.notes || initialData?.locator));
    const [isRecording, setIsRecording] = useState(false);
    const [notification, setNotification] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const placesLibrary = useMapsLibrary('places');
    const [autocompleteService, setAutocompleteService] = useState<google.maps.places.AutocompleteService | null>(null);
    const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);
    const [sessionToken, setSessionToken] = useState<google.maps.places.AutocompleteSessionToken | null>(null);

    const [selectedCoords, setSelectedCoords] = useState<{ lat: number, lng: number } | null>(null);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    React.useEffect(() => {
        if (!placesLibrary || autocompleteService) return;
        setAutocompleteService(new placesLibrary.AutocompleteService());
        setSessionToken(new placesLibrary.AutocompleteSessionToken());
        const dummy = document.createElement('div');
        setPlacesService(new placesLibrary.PlacesService(dummy));
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
        if (query.length < 3 || !autocompleteService) {
            setSuggestions([]);
            return;
        }

        autocompleteService.getPlacePredictions({
            input: query,
            sessionToken: sessionToken || undefined,
            componentRestrictions: { country: 'mx' },
        }, (predictions, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                setSuggestions(predictions);
            } else {
                setSuggestions([]);
            }
        });
    };

    const handleSelectSuggestion = (suggestion: google.maps.places.AutocompletePrediction) => {
        setAddress(suggestion.description);
        setSuggestions([]);
        setShowDetails(true);

        if (placesService) {
            placesService.getDetails({
                placeId: suggestion.place_id,
                fields: ['geometry', 'formatted_address'],
                sessionToken: sessionToken || undefined
            }, (place, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
                    setSelectedCoords({
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng()
                    });
                    if (place.formatted_address) setAddress(place.formatted_address);

                    if (placesLibrary) {
                        setSessionToken(new placesLibrary.AutocompleteSessionToken());
                    }
                }
            });
        }
    };
    const updateAddressFromRefinement = () => {
        const parts = [street, extNumber, colony, zipCode, city, state].filter(Boolean);
        if (parts.length > 0) {
            setAddress(parts.join(', '));
        }
    };

    useEffect(() => {
        if (showManualRefinement) {
            updateAddressFromRefinement();
        }
    }, [street, extNumber, colony, zipCode, city, state]);

    const handleSave = () => {
        if (!address) return;
        const stopData = {
            id: initialData?.id || Math.random().toString(36).substr(2, 9),
            address,
            customerName,
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

    return (
        <div className="space-y-6">
            <div className="relative">
                <div className={cn(
                    "flex items-center gap-3 p-4 bg-dark border border-white/5 rounded-2xl transition-all shadow-inner",
                    isFocused && "border-info shadow-[0_0_30px_rgba(49,204,236,0.1)] ring-1 ring-info/20"
                )}>
                    <Search className="w-5 h-5 text-info/50 shrink-0" />
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
                            className="w-full bg-transparent border-none outline-none text-white text-sm placeholder:text-white/20"
                        />
                        <AnimatePresence>
                            {notification && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="absolute inset-0 bg-darker flex items-center text-xs font-black text-info uppercase tracking-widest px-1"
                                >
                                    {notification}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <div className="flex items-center gap-2 border-l border-white/10 pl-3">
                        <button onClick={handleVoiceInput} className={cn("p-2 rounded-xl transition-all", isRecording ? "bg-red-500 animate-pulse text-white" : "hover:bg-white/5 text-info/50")}>
                            <Mic className="w-4 h-4" />
                        </button>
                        <button
                            onClick={async () => {
                                try {
                                    setNotification('Iniciando Escáner...');
                                    const status = await BarcodeScanner.checkPermission({ force: true });
                                    if (status.granted) {
                                        // Typical implementation for Capacitor QR Scanner
                                        // It makes the webview background transparent
                                        document.querySelector('body')?.classList.add('scanner-active');
                                        await BarcodeScanner.hideBackground();
                                        const result = await BarcodeScanner.startScan();

                                        if (result.hasContent) {
                                            setAddress(result.content);
                                            fetchSuggestions(result.content);
                                            setNotification('✅ Código escaneado');
                                        }

                                        await BarcodeScanner.showBackground();
                                        document.querySelector('body')?.classList.remove('scanner-active');
                                    } else {
                                        setNotification('❌ Permiso denegado');
                                    }
                                } catch (e) {
                                    console.error("Scanner error", e);
                                    setNotification('⚠️ Error al escanear');
                                    await BarcodeScanner.showBackground();
                                    document.querySelector('body')?.classList.remove('scanner-active');
                                }
                            }}
                            className="p-2 rounded-xl hover:bg-white/5 text-info/50 transition-all active:scale-95"
                            title="Escanear QR"
                        >
                            <QrCode className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {isFocused && suggestions.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full left-0 right-0 mt-3 bg-dark border border-white/10 rounded-2xl z-50 overflow-hidden shadow-2xl backdrop-blur-xl"
                        >
                            <ul className="divide-y divide-white/5">
                                {suggestions.map((s, i) => (
                                    <li
                                        key={i}
                                        onClick={() => handleSelectSuggestion(s)}
                                        className="p-5 hover:bg-info/10 cursor-pointer text-white/70 text-sm flex items-center gap-4 transition-all group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-info/5 flex items-center justify-center group-hover:bg-info/20">
                                            <MapPin className="w-4 h-4 text-info/50" />
                                        </div>
                                        <div className="flex-1 truncate">
                                            <p className="truncate font-medium text-white">{s.structured_formatting?.main_text}</p>
                                            <p className="truncate text-[10px] text-white/30 uppercase tracking-wider">{s.structured_formatting?.secondary_text}</p>
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
                className="text-[10px] font-black text-info/60 uppercase tracking-[0.3em] flex items-center gap-2 px-2 hover:text-info transition-colors italic"
            >
                {showDetails ? 'Cerrar Detalles' : 'Configuración Avanzada'}
                <ChevronDown className={cn("w-3 h-3 transition-transform", showDetails && "rotate-180")} />
            </button>

            <AnimatePresence>
                {showDetails && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-6 overflow-hidden"
                    >
                        {/* Placas y Cuadros */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/20 uppercase tracking-widest pl-1">Placas</label>
                                <div className="flex items-center gap-3 p-3.5 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-colors group">
                                    <Truck className="w-4 h-4 text-info/30 group-focus-within:text-info" />
                                    <input
                                        value={licensePlate}
                                        onChange={(e) => setLicensePlate(e.target.value)}
                                        className="bg-transparent border-none outline-none text-xs text-white w-full font-bold"
                                        placeholder="ABC-123"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/20 uppercase tracking-widest pl-1">Cuadros (Unidades)</label>
                                <div className="flex items-center gap-3 p-3.5 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-colors group">
                                    <Package className="w-4 h-4 text-info/30 group-focus-within:text-info" />
                                    <input
                                        type="number"
                                        value={boxes}
                                        onChange={(e) => setBoxes(parseInt(e.target.value) || 0)}
                                        className="bg-transparent border-none outline-none text-xs text-white w-full font-bold"
                                        min="0"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ID y Localizador */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/20 uppercase tracking-widest pl-1">Localizador</label>
                                <div className="flex items-center gap-3 p-3.5 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-colors group">
                                    <Hash className="w-4 h-4 text-info/30 group-focus-within:text-info transition-colors" />
                                    <input
                                        value={locator}
                                        onChange={(e) => setLocator(e.target.value)}
                                        className="bg-transparent border-none outline-none text-xs text-white w-full font-bold group-focus-within:placeholder:opacity-0 transition-all"
                                        placeholder="PED-1234"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/20 uppercase tracking-widest pl-1">Paquetes</label>
                                <div className="flex items-center gap-3 p-3.5 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-colors group">
                                    <Package className="w-4 h-4 text-info/30 group-focus-within:text-info" />
                                    <input
                                        type="number"
                                        value={numPackages}
                                        onChange={(e) => setNumPackages(parseInt(e.target.value))}
                                        className="bg-transparent border-none outline-none text-xs text-white w-full font-bold"
                                        min="1"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Tipo de Trabajo - Full Width row for mobile airiness */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] pl-1">Tipo de Operación</label>
                            <div className="flex p-1.5 bg-darker border border-white/5 rounded-[24px]">
                                <button
                                    onClick={() => setTaskType('DELIVERY')}
                                    className={cn("flex-1 py-4 px-4 rounded-[18px] text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3",
                                        taskType === 'DELIVERY' ? "bg-info text-dark shadow-[0_10px_20px_rgba(49,204,236,0.2)]" : "text-white/20 hover:text-white/40")}
                                >
                                    <Truck className="w-4 h-4" /> Entrega de Mercancía
                                </button>
                                <button
                                    onClick={() => setTaskType('COLLECTION')}
                                    className={cn("flex-1 py-4 px-4 rounded-[18px] text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3",
                                        taskType === 'COLLECTION' ? "bg-purple-500 text-white shadow-[0_10px_20px_rgba(168,85,247,0.2)]" : "text-white/20 hover:text-white/40")}
                                >
                                    <ClipboardList className="w-4 h-4" /> Recogida / Devolución
                                </button>
                            </div>
                        </div>

                        {/* Prioridad y Orden - Full Width row */}
                        <div className="space-y-3 pt-2">
                            <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] pl-1">Algoritmo de Prioridad</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                    <RotateCw className="w-4 h-4 text-info/30" />
                                </div>
                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value as any)}
                                    className="w-full bg-white/5 border border-white/5 rounded-[24px] py-4 pl-12 pr-6 text-xs text-white/70 font-black uppercase tracking-widest outline-none focus:border-info/30 transition-all appearance-none"
                                >
                                    <option value="NORMAL" className="bg-dark">⚡ Inteligencia Automática</option>
                                    <option value="HIGH" className="bg-dark">🔥 Alta Prioridad (Urgente)</option>
                                    <option value="FIRST" className="bg-dark">🔝 Forzar como Primera</option>
                                    <option value="LAST" className="bg-dark">🏁 Forzar como Última</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <ChevronDown className="w-4 h-4 text-white/20" />
                                </div>
                            </div>
                        </div>

                        {/* Horario y Tiempo Estimado */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/20 uppercase tracking-widest pl-1">Llegada</label>
                                <div className="flex p-1 bg-darker border border-white/5 rounded-2xl">
                                    <button
                                        onClick={() => setArrivalTimeType('ANY')}
                                        className={cn("flex-1 py-2 px-2 rounded-xl text-[8px] font-black uppercase tracking-wider transition-all",
                                            arrivalTimeType === 'ANY' ? "bg-white/10 text-white" : "text-white/30")}
                                    >
                                        Cualquier h.
                                    </button>
                                    <button
                                        onClick={() => setArrivalTimeType('SPECIFIC')}
                                        className={cn("flex-1 py-2 px-2 rounded-xl text-[8px] font-black uppercase tracking-wider transition-all",
                                            arrivalTimeType === 'SPECIFIC' ? "bg-white/10 text-white" : "text-white/30")}
                                    >
                                        Específico
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/20 uppercase tracking-widest pl-1">Tiempo Est. (Min)</label>
                                <div className="flex items-center gap-3 p-3.5 bg-white/5 border border-white/5 rounded-2xl">
                                    <Clock className="w-4 h-4 text-info/30" />
                                    <input
                                        type="number"
                                        value={estimatedDuration}
                                        onChange={(e) => setEstimatedDuration(parseInt(e.target.value))}
                                        className="bg-transparent border-none outline-none text-xs text-white w-full font-bold"
                                        min="5"
                                        step="5"
                                    />
                                </div>
                            </div>
                        </div>

                        <AnimatePresence>
                            {arrivalTimeType === 'SPECIFIC' && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-2"
                                >
                                    <label className="text-[10px] font-black text-white/20 uppercase tracking-widest pl-1">Ventana Horaria</label>
                                    <div className="flex items-center gap-3 p-3.5 bg-info/5 border border-info/20 rounded-2xl">
                                        <Clock className="w-4 h-4 text-info/50" />
                                        <input
                                            value={timeWindow}
                                            onChange={(e) => setTimeWindow(e.target.value)}
                                            className="bg-transparent border-none outline-none text-xs text-info font-bold w-full"
                                            placeholder="Ej: 08:00 - 10:00"
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <button
                                onClick={() => setShowManualRefinement(!showManualRefinement)}
                                className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-info transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <MapPin className="w-4 h-4" />
                                    Refinar Dirección Manualmente
                                </div>
                                <ChevronDown className={cn("w-4 h-4 transition-transform", showManualRefinement && "rotate-180")} />
                            </button>

                            <AnimatePresence>
                                {showManualRefinement && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="space-y-4 overflow-hidden pt-2"
                                    >
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="col-span-2 space-y-1.5">
                                                <label className="text-[9px] font-bold text-white/20 uppercase">Calle</label>
                                                <input
                                                    value={street}
                                                    onChange={(e) => setStreet(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-xs text-white outline-none focus:border-info/30"
                                                    placeholder="Ej: Av. Reforma"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-bold text-white/20 uppercase">Num</label>
                                                <input
                                                    value={extNumber}
                                                    onChange={(e) => setExtNumber(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-xs text-white outline-none focus:border-info/30"
                                                    placeholder="123"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-bold text-white/20 uppercase">Colonia</label>
                                                <input
                                                    value={colony}
                                                    onChange={(e) => setColony(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-xs text-white outline-none focus:border-info/30"
                                                    placeholder="Ej: Juárez"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-bold text-white/20 uppercase">C.P.</label>
                                                <input
                                                    value={zipCode}
                                                    onChange={(e) => setZipCode(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-xs text-white outline-none focus:border-info/30"
                                                    placeholder="06600"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-bold text-white/20 uppercase">Ciudad</label>
                                                <input
                                                    value={city}
                                                    onChange={(e) => setCity(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-xs text-white outline-none focus:border-info/30"
                                                    placeholder="CDMX"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-bold text-white/20 uppercase">Estado</label>
                                                <input
                                                    value={state}
                                                    onChange={(e) => setState(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-xs text-white outline-none focus:border-info/30"
                                                    placeholder="México"
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/20 uppercase tracking-widest pl-1">Nota del Cliente</label>
                            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 hover:bg-white/10 transition-all">
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="bg-transparent border-none outline-none text-xs text-white w-full h-24 resize-none placeholder:text-white/10 italic"
                                    placeholder="Instrucciones especiales para el conductor..."
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col gap-3 pt-6">
                <div className="flex gap-4">
                    {onCancel && (
                        <button
                            onClick={onCancel}
                            className="flex-1 py-4 bg-white/5 text-white/40 font-black uppercase text-[10px] tracking-widest rounded-2xl border border-white/5 hover:bg-white/10 hover:text-white transition-all active:scale-95"
                        >
                            Cancelar
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={!address}
                        className="flex-[2] py-4 bg-info text-dark font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-[0_10px_30px_rgba(49,204,236,0.3)] hover:brightness-110 active:scale-95 transition-all disabled:opacity-30 disabled:shadow-none"
                    >
                        {isEditing ? 'Guardar Cambios' : 'Registrar Parada'}
                    </button>
                </div>

                {onOptimize && !isEditing && (
                    <button
                        onClick={() => {
                            if (!address) return;
                            const stopData = {
                                id: initialData?.id || Math.random().toString(36).substr(2, 9),
                                address,
                                customerName,
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
                                isCurrent: initialData?.isCurrent || false,
                                order: initialData?.order || 1,
                            };
                            onOptimize(stopData);
                        }}
                        className="w-full py-4 bg-white/5 border border-info/20 text-info font-black uppercase text-[10px] tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:bg-info/10 transition-all active:scale-95"
                    >
                        <RotateCw className="w-4 h-4 animate-spin-slow" />
                        Registrar y Optimizar Ruta
                    </button>
                )}
            </div>
        </div>
    );
};

export default StopInput;
