import { App as CapApp } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { isNativeApp } from '@/lib/platform';

export async function initializeNativeShell(onBack: () => boolean): Promise<void> {
    if (! isNativeApp()) {
        return;
    }

    try {
        await StatusBar.setStyle({ style: Style.Default });
    } catch {
        // StatusBar is not available on all platforms.
    }

    try {
        await SplashScreen.hide();
    } catch {
        // SplashScreen may already be hidden.
    }

    await CapApp.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack || onBack()) {
            return;
        }

        CapApp.minimizeApp();
    });
}
