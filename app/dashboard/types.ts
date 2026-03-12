import { LucideIcon } from 'lucide-react';
import { Truck, Car } from 'lucide-react';

export type VehicleType = 'car' | 'truck' | 'van' | 'motorcycle' | 'pickup' | 'ufo';

export interface VehicleOption {
    type: VehicleType;
    icon: LucideIcon;
    label: string;
}

export const VEHICLE_OPTIONS: VehicleOption[] = [
    { type: 'truck', icon: Truck, label: 'Trailer' },
    { type: 'van', icon: Car, label: 'Van' },
    { type: 'car', icon: Car, label: 'Auto' },
    { type: 'pickup', icon: Car, label: 'Pickup' },
    { type: 'motorcycle', icon: Car, label: 'Moto' },
    { type: 'ufo', icon: Car, label: '🛸 OVNI' },
];

export const SOUND_OPTIONS = [
    { id: 'sound1', label: 'Hormi-Tone', url: '/sound/sound1.mp3' },
    { id: 'sound2', label: 'Logi-Beep', url: '/sound/sound2.mp3' },
    { id: 'sound3', label: 'Route-Alert', url: '/sound/sound3.mp3' },
];

export interface Stop {
    id: string;
    lat: number;
    lng: number;
    address: string;
    order: number;
    isCompleted: boolean;
    isFailed: boolean;
    isCurrent: boolean;
    completedAt?: Date;
    customerName?: string;
    phone?: string;
    timeWindow?: string;
    licensePlate?: string;
    boxes?: string | number;
    zipCode?: string;
    notes?: string;
}

export interface Expense {
    id: string;
    amount: number;
    description: string;
    category: string;
    date: Date;
    routeId?: string;
}

export type ActiveModal = 'add-stop' | 'edit-stop' | 'expense' | 'bulk-import' | 'settings' | 'saved-routes' | 'save-route' | 'new-route-confirm' | 'route-summary' | 'navigation-choice' | 'profile' | 'welcome-map-preference' | 'marker-actions' | 'pricing' | 'privacy' | 'terms' | 'sos-config' | null;
