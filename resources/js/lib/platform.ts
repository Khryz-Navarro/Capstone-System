import { Capacitor } from '@capacitor/core';

export function isNativeApp(): boolean {
    return Capacitor.isNativePlatform();
}

export function isMobileApp(): boolean {
    return isNativeApp();
}
