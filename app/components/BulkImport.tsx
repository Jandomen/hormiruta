'use client';

import React, { useState, useRef } from 'react';
import { X, Upload, FileText, Clipboard, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { cn } from '../lib/utils';

interface BulkImportProps {
    onImport: (stops: any[]) => void;
    onClose: () => void;
}

export default function BulkImport({ onImport, onClose }: BulkImportProps) {
    const [importMode, setImportMode] = useState<'text' | 'file'>('text');
    const [textContent, setTextContent] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [error, setError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const geocodingLibrary = useMapsLibrary('geocoding');

    const geocodeAddress = (address: string): Promise<{ lat: number; lng: number } | null> => {
        return new Promise((resolve) => {
            if (!geocodingLibrary || !address.trim()) {
                resolve(null);
                return;
            }

            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ address, componentRestrictions: { country: 'mx' } }, (results, status) => {
                if (status === 'OK' && results?.[0]?.geometry?.location) {
                    resolve({
                        lat: results[0].geometry.location.lat(),
                        lng: results[0].geometry.location.lng()
                    });
                } else {
                    console.warn(`[BULK] Geocoding failed for ${address}:`, status);
                    resolve(null);
                }
            });
        });
    };

    interface ImportRow {
        address: string;
        name?: string;
        lat?: number;
        lng?: number;
    }

    const processAddresses = async (rows: ImportRow[]) => {
        setIsProcessing(true);
        setError(null);
        setProgress({ current: 0, total: rows.length });

        const validStops: any[] = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const address = row.address?.trim() || '';
            const name = row.name?.trim() || '';

            if (!address && !row.lat) continue;

            let coords = (row.lat && row.lng) ? { lat: row.lat, lng: row.lng } : null;

            if (!coords && address) {
                coords = await geocodeAddress(address);
                // Avoid hitting rate limits
                await new Promise(r => setTimeout(r, 200));
            }

            if (coords) {
                validStops.push({
                    id: Math.random().toString(36).substr(2, 9),
                    address: address || `Coordenadas: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
                    customerName: name,
                    priority: 'NORMAL',
                    isCompleted: false,
                    isCurrent: false,
                    lat: coords.lat,
                    lng: coords.lng,
                    notes: 'Importación masiva'
                });
            }
            setProgress(prev => ({ ...prev, current: i + 1 }));
        }

        if (validStops.length > 0) {
            onImport(validStops);
            onClose();
        } else {
            setError('No se pudo procesar ninguna de las paradas. Verifica el formato.');
            setIsProcessing(false);
        }
    };

    const handleTextImport = () => {
        const lines = textContent.split('\n').filter(line => line.trim());
        if (lines.length === 0) {
            setError('Por favor ingresa al menos una dirección.');
            return;
        }

        const rows: ImportRow[] = lines.map(line => {
            const parts = line.split(/[,|\t]/).map(p => p.trim());
            if (parts.length >= 4) {
                // Formato: Nombre, Dirección, Lat, Lng
                const lat = parseFloat(parts[2]);
                const lng = parseFloat(parts[3]);
                if (!isNaN(lat) && !isNaN(lng)) {
                    return { name: parts[0], address: parts[1], lat, lng };
                }
            } else if (parts.length === 3) {
                // Formato: Dirección, Lat, Lng
                const lat = parseFloat(parts[1]);
                const lng = parseFloat(parts[2]);
                if (!isNaN(lat) && !isNaN(lng)) {
                    return { address: parts[0], lat, lng };
                }
            } else if (parts.length === 2) {
                // Formato: Nombre, Dirección
                return { name: parts[0], address: parts[1] };
            }
            return { address: line };
        });

        processAddresses(rows);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        const extension = file.name.split('.').pop()?.toLowerCase();

        const mapDataToRows = (data: any[]): ImportRow[] => {
            return data.map(row => {
                if (typeof row === 'object' && row !== null) {
                    const findKey = (keys: string[]) => Object.keys(row).find(k => keys.includes(k.toLowerCase()));
                    const latKey = findKey(['lat', 'latitude', 'latitud']);
                    const lngKey = findKey(['lng', 'longitude', 'longitud', 'lon']);
                    const addrKey = findKey(['address', 'direccion', 'dirección', 'ubicacion', 'ubicación']);
                    const nameKey = findKey(['name', 'nombre', 'cliente', 'customer']);

                    const lat = latKey ? parseFloat(row[latKey]) : undefined;
                    const lng = lngKey ? parseFloat(row[lngKey]) : undefined;

                    return {
                        address: addrKey ? row[addrKey] : (Array.isArray(row) ? row[1] : ''),
                        name: nameKey ? row[nameKey] : (Array.isArray(row) ? row[0] : ''),
                        lat: isNaN(lat as any) ? undefined : lat,
                        lng: isNaN(lng as any) ? undefined : lng
                    };
                }
                return { address: row.toString() };
            });
        };

        if (extension === 'csv') {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const rows = mapDataToRows(results.data);
                    processAddresses(rows);
                },
                error: (err) => setError(`Error parsing CSV: ${err.message}`)
            });
        } else if (extension === 'xlsx' || extension === 'xls') {
            reader.onload = (evt) => {
                try {
                    const bstr = evt.target?.result;
                    const wb = XLSX.read(bstr, { type: 'binary' });
                    const wsname = wb.SheetNames[0];
                    const ws = wb.Sheets[wsname];
                    const data = XLSX.utils.sheet_to_json(ws);
                    const rows = mapDataToRows(data);
                    processAddresses(rows);
                } catch (err: any) {
                    setError(`Error parsing Excel: ${err.message}`);
                }
            };
            reader.readAsBinaryString(file);
        } else {
            setError('Formato de archivo no soportado. Usa CSV o Excel.');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-[32px] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)]"
            >
                <div className="p-8 border-b border-white/5 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black italic tracking-tighter text-white">IMPORTACIÓN MASIVA</h2>
                        <p className="text-xs font-bold text-white/30 uppercase tracking-widest mt-1">Añadir múltiples paradas</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    <div className="flex gap-2 p-1 bg-white/5 rounded-2xl">
                        <button
                            onClick={() => setImportMode('text')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all text-sm font-bold",
                                importMode === 'text' ? "bg-info text-dark shadow-lg shadow-info/20" : "text-white/40 hover:text-white"
                            )}
                        >
                            <Clipboard className="w-4 h-4" />
                            Pegar Texto
                        </button>
                        <button
                            onClick={() => setImportMode('file')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all text-sm font-bold",
                                importMode === 'file' ? "bg-info text-dark shadow-lg shadow-info/20" : "text-white/40 hover:text-white"
                            )}
                        >
                            <Upload className="w-4 h-4" />
                            Subir Archivo
                        </button>
                    </div>

                    {importMode === 'text' ? (
                        <div className="space-y-4">
                            <label className="text-xs font-black text-white/30 uppercase tracking-widest pl-1">Direcciones (una por línea)</label>
                            <textarea
                                value={textContent}
                                onChange={(e) => setTextContent(e.target.value)}
                                disabled={isProcessing}
                                placeholder="Calle 1, Ciudad&#10;Calle 2, Ciudad&#10;..."
                                className="w-full h-48 bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:border-info/50 transition-colors resize-none"
                            />
                        </div>
                    ) : (
                        <div
                            onClick={() => !isProcessing && fileInputRef.current?.click()}
                            className={cn(
                                "w-full h-48 border-2 border-dashed rounded-[32px] flex flex-col items-center justify-center gap-4 transition-all cursor-pointer group",
                                isProcessing ? "border-white/5 opacity-50 cursor-not-allowed" : "border-white/10 hover:border-info/50 hover:bg-info/5"
                            )}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept=".csv,.xlsx,.xls"
                                className="hidden"
                            />
                            <div className="p-4 bg-white/5 rounded-2xl group-hover:scale-110 transition-transform">
                                <FileText className="w-8 h-8 text-info" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-bold text-white">Haz clic para subir un archivo</p>
                                <p className="text-xs text-white/30 mt-1 uppercase tracking-widest font-black">CSV o Excel soportados</p>
                            </div>
                        </div>
                    )}

                    {isProcessing && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 text-info animate-spin" />
                                    <span className="text-xs font-black text-white/60 uppercase tracking-widest">Procesando coordenadas...</span>
                                </div>
                                <span className="text-xs font-black text-info">{progress.current} / {progress.total}</span>
                            </div>
                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-info shadow-[0_0_10px_rgba(49,204,236,0.5)]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            {error}
                        </div>
                    )}
                </div>

                <div className="p-8 bg-white/[0.02] border-t border-white/5 flex gap-4">
                    <button
                        onClick={onClose}
                        disabled={isProcessing}
                        className="flex-1 py-4 rounded-2xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all text-sm"
                    >
                        Cancelar
                    </button>
                    {importMode === 'text' && (
                        <button
                            onClick={handleTextImport}
                            disabled={isProcessing || !textContent.trim()}
                            className="flex-[2] py-4 rounded-2xl bg-info text-dark font-black italic transition-all text-sm shadow-[0_10px_30px_rgba(49,204,236,0.2)] disabled:opacity-50 disabled:shadow-none hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {isProcessing ? 'PROCESANDO...' : 'INICIAR IMPORTACIÓN'}
                        </button>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
