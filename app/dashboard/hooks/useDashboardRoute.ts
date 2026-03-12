import { useState, useCallback, useEffect } from 'react';
import { Stop, Expense, ActiveModal } from '../types';

export function useDashboardRoute(
    isPro: boolean,
    isTrialActive: () => boolean,
    originPoint: { lat: number; lng: number; address: string },
    isOnline: boolean,
    setNotification: (msg: string | null) => void,
    setActiveModal: (modal: ActiveModal) => void,
    playNotification: (soundId?: string) => void,
    setMapCenter: (coords: any) => void,
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
    const [avoidTolls, setAvoidTolls] = useState(false);
    const [routeSummary, setRouteSummary] = useState<{ distance: number, time: string, completedStops: number } | null>(null);

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
        if (!isPro) {
            if (stops.length >= 10) {
                setNotification('⏳ Límite de 10 paradas para el plan gratuito. Pásate a PRO para paradas ilimitadas.');
                setTimeout(() => setActiveModal('pricing'), 1000);
                return;
            }
            if (!isTrialActive()) {
                setNotification('🚨 Periodo de prueba vencido. Súmate a los profesionales para optimizar.');
                setTimeout(() => setActiveModal('pricing'), 1000);
                return;
            }
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
    }, [stops, isPro, isTrialActive, setNotification, setActiveModal]);

    const handleRemoveStop = useCallback((id: string) => {
        setStops(prev => {
            const filtered = prev.filter(s => s.id !== id);
            return filtered.map((s, i) => ({ ...s, order: i + 1 }));
        });
        setNotification('Parada eliminada del itinerario');
    }, [setNotification]);

    const handleUpdateStop = useCallback((updatedStop: any) => {
        setStops(prev => prev.map(s => s.id === updatedStop.id ? updatedStop : s));
        setActiveModal(null);
        setNotification('Parada actualizada');
    }, [setNotification, setActiveModal]);

    const handleCompleteStop = useCallback((id: string, isFailed: boolean = false) => {
        let nextStopFound: any = null;
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

            const allDone = newStops.every(s => s.isCompleted || s.isFailed);
            if (allDone && newStops.length > 0) {
                setTimeout(() => {
                    setActiveModal('route-summary');
                }, 800);
            }

            const nextPendingIndex = newStops.findIndex(s => !s.isCompleted && !s.isFailed);
            if (nextPendingIndex !== -1) {
                newStops[nextPendingIndex].isCurrent = true;
                nextStopFound = newStops[nextPendingIndex];
            }
            return newStops;
        });

        setNotification(isFailed ? '⚠️ Parada marcada como FALLIDA' : '✅ Entrega REALIZADA con éxito');
        return nextStopFound;
    }, [setNotification, setActiveModal]);

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
                const firstPending = newStops.find(s => !s.isCompleted && !s.isFailed);
                if (firstPending) firstPending.isCurrent = true;
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
    }, [setNotification]);

    const optimizeRoute = async (customStops?: any[]) => {
        if (!isOnline) {
            setNotification('🚨 No se puede optimizar en modo offline. Requiere internet para tráfico real.');
            return;
        }
        // Asegurar que si viene de un evento de React (MouseEvent), no lo trate como stops
        const stopsToProcess = Array.isArray(customStops) ? customStops : stops;
        const pendingStops = stopsToProcess.filter((s: any) => !s.isCompleted && !s.isFailed);
        const completedStops = stopsToProcess.filter((s: any) => s.isCompleted || s.isFailed);

        if (!isPro) {
            if (stopsToProcess.length > 10) {
                setNotification('🚨 Límite de 10 paradas superado. ¡Actualiza a Pro para optimizar rutas grandes!');
                setActiveModal('pricing');
                return;
            }
            if (!isTrialActive()) {
                setNotification('🚨 Tu periodo de prueba ha vencido. Actualiza a Pro para seguir optimizando.');
                setActiveModal('pricing');
                return;
            }
        }

        if (pendingStops.length < 2) {
            setNotification('No hay suficientes paradas pendientes para optimizar');
            return;
        }

        setIsOptimizing(true);
        setNotification('Optimizando ruta con tráfico real...');
        try {
            const response = await fetch('/api/optimize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    stops: pendingStops,
                    origin: originPoint,
                    returnToStart,
                    avoidTolls
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
                const finalStops = [...cleanCompleted, ...newPending];
                setStops(finalStops);
                setNotification(data.message || 'Ruta optimizada correctamente');

                if (newPending.length > 0) {
                    setMapCenter({ lat: newPending[0].lat, lng: newPending[0].lng } as any);
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

    return {
        stops, setStops,
        expenses, setExpenses,
        isOptimizing, setIsOptimizing,
        returnToStart, setReturnToStart,
        avoidTolls, setAvoidTolls,
        routeSummary, setRouteSummary,
        handleAddStop, handleRemoveStop, handleUpdateStop,
        handleCompleteStop, handleRevertStop, handleSwapOrder,
        optimizeRoute, handleReverseRoute,
        handleSaveRoute, confirmFinish
    };
}
