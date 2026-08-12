import { useState, useCallback, useEffect, useRef } from 'react';
import { Stop, Expense, ActiveModal } from '../types';

export function useDashboardRoute(
    isPro: boolean,
    originPoint: { lat: number; lng: number; address: string },
    isOnline: boolean,
    setNotification: (msg: string | null) => void,
    setActiveModal: (modal: ActiveModal) => void,
    playNotification: (soundId?: string) => void,
    setMapCenter: (coords: any) => void,
    setActiveStop: (stop: Stop | null) => void,
    currentRouteId: string | null,
    setCurrentRouteId: (id: string | null) => void,
    routeName: string,
    setRouteName: (name: string) => void,
    routeDate: string,
    setRouteDate: (date: string) => void
) {
    const [stops, setStops] = useState<Stop[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [returnToStart, setReturnToStart] = useState(false);
    const [isRouteReversed, setIsRouteReversed] = useState(false);
    const [avoidTolls, setAvoidTolls] = useState(false);
    const [routeSummary, setRouteSummary] = useState<{ distance: number, time: string, completedStops: number } | null>(null);

    // Referencia siempre actualizada de stops: permite calcular la siguiente
    // parada con la lista más reciente sin depender de un closure obsoleto.
    const stopsRef = useRef<Stop[]>(stops);
    useEffect(() => {
        stopsRef.current = stops;
    }, [stops]);

    // Persistencia local
    useEffect(() => {
        const savedStops = localStorage.getItem('hormiruta_stops');
        const savedExpenses = localStorage.getItem('hormiruta_expenses');
        const savedReturnToStart = localStorage.getItem('hormiruta_returnToStart');

        if (savedStops) {
            try {
                const parsed = JSON.parse(savedStops);
                if (Array.isArray(parsed)) setStops(parsed);
            } catch (e) {
                console.error("Error loading stops", e);
            }
        }
        if (savedExpenses) {
            try {
                const parsed = JSON.parse(savedExpenses);
                if (Array.isArray(parsed)) setExpenses(parsed);
            } catch (e) {
                console.error("Error loading expenses", e);
            }
        }
        if (savedReturnToStart) setReturnToStart(savedReturnToStart === 'true');
    }, []);

    useEffect(() => {
        localStorage.setItem('hormiruta_stops', JSON.stringify(stops));
    }, [stops]);

    useEffect(() => {
        localStorage.setItem('hormiruta_expenses', JSON.stringify(expenses));
    }, [expenses]);

    useEffect(() => {
        localStorage.setItem('hormiruta_returnToStart', String(returnToStart));
    }, [returnToStart]);

    const handleAddStop = useCallback((newStop: any) => {
        if (!isPro && stops.length >= 10) {
            setNotification('⏳ Límite de 10 paradas para el plan gratuito. Pásate a PRO para paradas ilimitadas.');
            setTimeout(() => setActiveModal('pricing'), 1000);
            return;
        }

        const isDuplicate = stops.some(s =>
            s.address.toLowerCase().trim() === newStop.address.toLowerCase().trim() ||
            (Math.abs(s.lat - newStop.lat) < 0.0001 && Math.abs(s.lng - newStop.lng) < 0.0001)
        );

        if (isDuplicate) {
            setNotification('Esta parada ya está en tu itinerario');
            return;
        }

        const updatedStops = [...stops, { ...newStop, order: stops.length + 1 }];
        setStops(updatedStops.sort((a, b) => a.order - b.order));
        setNotification('Parada añadida');
    }, [stops, isPro, setNotification, setActiveModal]);

    const handleRemoveStop = useCallback((id: string) => {
        setStops(prev => {
            const filtered = prev.filter(s => s.id !== id);
            const next = filtered.map((s, i) => ({ ...s, order: i + 1 }));
            // Si se eliminó la parada actual, asignar la siguiente pendiente
            // como actual para que la ruta siga avanzando.
            const hasCurrent = next.some(s => s.isCurrent);
            if (!hasCurrent) {
                const firstPendingIndex = next.findIndex(s => !s.isCompleted && !s.isFailed);
                if (firstPendingIndex !== -1) {
                    next[firstPendingIndex] = { ...next[firstPendingIndex], isCurrent: true };
                }
            }
            return next;
        });
        setNotification('Parada eliminada del itinerario');
        setIsRouteReversed(false);
    }, [setNotification]);

    const handleUpdateStop = useCallback((updatedStop: any) => {
        setStops(prev => prev.map(s => s.id === updatedStop.id ? updatedStop : s));
        setActiveModal(null);
        setNotification('Parada actualizada');
    }, [setNotification, setActiveModal]);

    const handleCompleteStop = useCallback((id: string, isFailed: boolean = false) => {
        setStops(prevStops => {
            const newStops = prevStops.map(s => {
                if (s.id === id) return {
                    ...s,
                    isCompleted: !isFailed,
                    isFailed: isFailed,
                    isCurrent: false,
                    completedAt: new Date()
                };
                return s;
            });

            const nextPendingIndex = newStops.findIndex(s => !s.isCompleted && !s.isFailed);
            if (nextPendingIndex !== -1) {
                newStops[nextPendingIndex] = { ...newStops[nextPendingIndex], isCurrent: true };
            }
            return newStops;
        });

        setNotification(isFailed ? '⚠️ Parada marcada como FALLIDA' : '✅ Entrega REALIZADA con éxito');

        // La siguiente parada se calcula con la lista MÁS RECIENTE y NUNCA se
        // devuelve la parada recién marcada (evita que el mapa se recentre o
        // vuelva a cargar la misma parada que se acaba de omitir).
        const latest = stopsRef.current;
        const completedIdx = latest.findIndex(s => s.id === id);
        if (completedIdx === -1) return null;

        const nextPending = latest.find((s, i) => i !== completedIdx && !s.isCompleted && !s.isFailed);

        // Reorientar la navegación y la tarjeta flotante hacia la siguiente
        // parada disponible (currentIndex + 1). Aplica por igual al botón
        // "Completar" y al "Cancelar/Omitir" (isFailed = true).
        if (nextPending) {
            setMapCenter({ lat: nextPending.lat, lng: nextPending.lng } as any);
            setActiveStop(nextPending);
        } else if (latest.length > 0) {
            // Ruta terminada: limpiar la tarjeta para que no apunte a una parada ya marcada.
            setActiveStop(null);
            setTimeout(() => {
                setActiveModal('route-summary');
            }, 800);
        }
        return nextPending || null;
    }, [setNotification, setActiveModal, setMapCenter, setActiveStop]);

    const handleRevertStop = useCallback((id: string) => {
        setStops(prevStops => {
            const newStops = prevStops.map(s => {
                if (s.id === id) return {
                    ...s,
                    isCompleted: false,
                    isFailed: false,
                    isCurrent: false,
                    completedAt: undefined
                };
                return s;
            });

            const currentExists = newStops.some(s => s.isCurrent);
            if (!currentExists) {
                const firstPendingIndex = newStops.findIndex(s => !s.isCompleted && !s.isFailed);
                if (firstPendingIndex !== -1) newStops[firstPendingIndex] = { ...newStops[firstPendingIndex], isCurrent: true };
            }
            return newStops;
        });
        setNotification('🔄 Parada restaurada al itinerario');
    }, [setNotification]);

    const handleSwapOrder = useCallback((stopId: string, newOrder: number) => {
        setStops(prevStops => {
            const movingStop = prevStops.find(s => s.id === stopId);
            if (!movingStop) return prevStops;
            if (movingStop.order === newOrder) return prevStops;

            const sorted = [...prevStops].sort((a, b) => a.order - b.order);
            const indexToMove = sorted.findIndex(s => s.id === stopId);
            const targetIndex = newOrder - 1;

            const [removed] = sorted.splice(indexToMove, 1);
            sorted.splice(targetIndex, 0, removed);

            return sorted.map((s, i) => ({ ...s, order: i + 1 }));
        });
        setNotification(`🚚 Ruta reordenada: movido a posición ${newOrder}`);
        setIsRouteReversed(false);
    }, [setNotification]);

    // Reordenar por arrastre: renumerar TODAS las paradas (incluidas
    // completadas) para que lista y pines del mapa coincidan.
    const handleReorder = useCallback((newStops: any[]) => {
        setStops(newStops.map((s, i) => ({ ...s, order: i + 1 })));
        setIsRouteReversed(false);
    }, []);

    const optimizeRoute = async (customStops?: any[], serviceTimeMinutes?: number) => {
        if (!isOnline) {
            setNotification('🚨 No se puede optimizar en modo offline. Requiere internet para tráfico real.');
            return;
        }
        // Asegurar que si viene de un evento de React (MouseEvent), no lo trate como stops
        const stopsToProcess = Array.isArray(customStops) ? customStops : stops;
        const pendingStops = stopsToProcess.filter((s: any) => !s.isCompleted && !s.isFailed);
        const completedStops = stopsToProcess.filter((s: any) => s.isCompleted || s.isFailed);

        if (!isPro && stopsToProcess.length > 10) {
            setNotification('🚨 Límite de 10 paradas superado. ¡Actualiza a Pro para optimizar rutas grandes!');
            setActiveModal('pricing');
            return;
        }

        if (pendingStops.length < 2) {
            setNotification('No hay suficientes paradas pendientes para optimizar');
            return;
        }

        setIsOptimizing(true);
        try {
            const response = await fetch('/api/optimize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    stops: pendingStops,
                    origin: originPoint,
                    returnToStart,
                    avoidTolls,
                    serviceTime: serviceTimeMinutes ?? 5,
                }),
            });

            const data = await response.json();
            if (response.ok && data.optimizedStops) {
                const newPending = data.optimizedStops.map((s: any, i: number) => ({
                    ...s,
                    order: completedStops.length + i + 1,
                    isCurrent: i === 0 && completedStops.length === 0 ? true : false
                }));

                if (newPending.length > 0) newPending[0].isCurrent = true;
                const cleanCompleted = completedStops.map(s => ({ ...s, isCurrent: false }));
                // Renumerar TODO (completadas + pendientes) para evitar números
                // duplicados/saltados y mantener lista === pines del mapa.
                const finalStops = [...cleanCompleted, ...newPending].map((s: any, i: number) => ({ ...s, order: i + 1 }));
                setStops(finalStops);
                setIsRouteReversed(false);
                setNotification(data.message || 'Ruta optimizada correctamente');

                if (newPending.length > 0) {
                    const avgLat = newPending.reduce((sum: number, s: any) => sum + s.lat, 0) / newPending.length;
                    const avgLng = newPending.reduce((sum: number, s: any) => sum + s.lng, 0) / newPending.length;
                    setMapCenter({ lat: avgLat, lng: avgLng } as any);
                    playNotification('success');
                }
            } else {
                setNotification(data.error || 'Error al optimizar');
            }
        } catch (error) {
            console.error('Error optimizando:', error);
            setNotification('Error de conexión con el optimizador');
        } finally {
            setIsOptimizing(false);
        }
    };

    const handleReverseRoute = useCallback(() => {
        if (stops.length < 2) return;
        const completed = stops.filter(s => s.isCompleted);
        const pending = stops.filter(s => !s.isCompleted);
        const reversedPending = [...pending].reverse();
        const updated = [...completed, ...reversedPending].map((s, i) => ({
            ...s,
            order: i + 1,
            isCurrent: i === completed.length
        }));
        setStops(updated);
        setIsRouteReversed(prev => !prev);
        setNotification('Ruta invertida correctamente');
    }, [stops, setNotification]);

    const handleSaveRoute = async (routeName: string, routeDate: string, vehicleType: string) => {
        if (!routeName) return;
        setNotification('Transmitiendo datos a satélites...');
        try {
            const response = await fetch('/api/routes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: routeName,
                    date: routeDate,
                    stops,
                    returnToStart,
                    vehicleType
                }),
            });
            const data = await response.json();
            if (response.ok) {
                setCurrentRouteId(data._id);
                setNotification('Ruta blindada en el servidor');
                setActiveModal(null);
            } else {
                setNotification(data.error || 'Fallo en la comunicación');
            }
        } catch (error) {
            setNotification('Error de conexión con el centro de mando');
        }
    };

    const confirmFinish = async (setIsGpsActive: (v: boolean) => void, setShowConfetti: (v: boolean) => void) => {
        setIsGpsActive(false);
        setNotification('Punto final verificado. Guardando en bitácora...');
        try {
            if (currentRouteId) {
                await fetch('/api/routes', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: currentRouteId,
                        stops: stops,
                        isCompleted: true,
                        completedAt: new Date(),
                    })
                });
            }
            setNotification('Misión verificada y guardada');
        } catch (e) {
            console.warn("Auto-save failed on finish", e);
        }
        setStops([]);
        setRouteName('');
        setCurrentRouteId(null);
        setActiveModal(null);
        setShowConfetti(false);
    };

    const handleCleanDuplicates = useCallback(() => {
        setStops(prev => {
            const seen = new Set<string>();
            return prev.filter(s => {
                const key = s.address.toLowerCase().trim();
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            }).map((s, i) => ({ ...s, order: i + 1 }));
        });
        setNotification('Direcciones duplicadas eliminadas');
        setIsRouteReversed(false);
    }, [setNotification]);

    return {
        stops, setStops,
        expenses, setExpenses,
        isOptimizing, setIsOptimizing,
        returnToStart, setReturnToStart,
        isRouteReversed, setIsRouteReversed,
        avoidTolls, setAvoidTolls,
        routeSummary, setRouteSummary,
        handleAddStop, handleRemoveStop, handleUpdateStop,
        handleCompleteStop, handleRevertStop, handleSwapOrder, handleReorder,
        optimizeRoute, handleReverseRoute,
        handleSaveRoute, confirmFinish,
        handleCleanDuplicates
    };
}
