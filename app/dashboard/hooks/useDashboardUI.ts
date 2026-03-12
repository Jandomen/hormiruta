import { useState, useCallback, useEffect } from 'react';
import { ActiveModal, SOUND_OPTIONS } from '../types';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export function useDashboardUI() {
    const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeModal, setActiveModal] = useState<ActiveModal>(null);
    const [modalStack, setModalStack] = useState<ActiveModal[]>([]);
    const [notification, setNotification] = useState<string | null>(null);
    const [alertSound, setAlertSound] = useState('sound1');
    const [activeStop, setActiveStop] = useState<any>(null);

    const playNotification = useCallback((soundId?: string) => {
        const sound = SOUND_OPTIONS.find(s => s.id === (soundId || alertSound));
        if (sound) {
            const audio = new Audio(sound.url);
            audio.volume = 0.5;
            audio.play().catch(e => console.warn("[AUDIO] Auto-play blocked by browser", e));
        }
    }, [alertSound]);

    useEffect(() => {
        if (notification) {
            playNotification();
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification, playNotification]);

    const handleOpenModal = useCallback((modal: ActiveModal, pushToStack: boolean = true) => {
        if (pushToStack && activeModal && activeModal !== modal) {
            setModalStack(prev => [...prev, activeModal]);
        } else if (pushToStack && isMobileMenuOpen) {
            // Marker artificial para recordar que venimos del menú
            setModalStack(prev => [...prev, 'menu' as any]);
            setIsMobileMenuOpen(false);
        } else if (!pushToStack) {
            setModalStack([]);
        }
        setActiveModal(modal);
    }, [activeModal, isMobileMenuOpen]);

    const handleBackAction = useCallback(() => {
        if (modalStack.length > 0) {
            const newStack = [...modalStack];
            const prevModal = newStack.pop();
            setModalStack(newStack);
            
            if (prevModal === ('menu' as any)) {
                setActiveModal(null);
                setIsMobileMenuOpen(true);
            } else {
                setActiveModal(prevModal || null);
            }
            return true;
        }

        if (activeModal !== null) {
            setActiveModal(null);
            setActiveStop(null);
            setModalStack([]);
            return true;
        }

        if (isMobileMenuOpen) {
            setIsMobileMenuOpen(false);
            return true;
        }

        if (viewMode === 'list') {
            setViewMode('map');
            return true;
        }

        return false;
    }, [activeModal, modalStack, isMobileMenuOpen, viewMode]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const onPopState = (e: PopStateEvent) => {
            const handled = handleBackAction();
            if (handled) {
                window.history.pushState({ dashboard: true }, '');
            }
        };

        if (!window.history.state?.dashboard) {
            window.history.replaceState({ dashboard: true }, '');
        }

        const isOverlayOpen = activeModal !== null || isMobileMenuOpen || viewMode === 'list';
        if (isOverlayOpen) {
            if (!window.history.state?.overlay) {
                window.history.pushState({ dashboard: true, overlay: true }, '');
            }
            window.addEventListener('popstate', onPopState);
        }

        let nativeListener: any;
        if (Capacitor.isNativePlatform()) {
            nativeListener = App.addListener('backButton', (data) => {
                const handled = handleBackAction();
                if (!handled && data.canGoBack) {
                    window.history.back();
                }
            });
        }

        return () => {
            window.removeEventListener('popstate', onPopState);
            if (nativeListener) {
                nativeListener.then((h: any) => h.remove());
            }
        };
    }, [activeModal, isMobileMenuOpen, viewMode, handleBackAction]);

    return {
        viewMode, setViewMode,
        isMobileMenuOpen, setIsMobileMenuOpen,
        activeModal, setActiveModal,
        modalStack, setModalStack,
        notification, setNotification,
        alertSound, setAlertSound,
        activeStop, setActiveStop,
        playNotification, handleOpenModal, handleBackAction
    };
}
