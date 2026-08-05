import type { CapacitorConfig } from '@capacitor/cli';

const serverUrl = process.env.CAP_SERVER_URL ?? 'http://127.0.0.1:8000/login';
const isHttps = serverUrl.startsWith('https://');

const config: CapacitorConfig = {
    appId: 'com.doculink.app',
    appName: 'DocuLink',
    webDir: '../public',
    server: {
        url: serverUrl,
        cleartext: !isHttps,
        androidScheme: isHttps ? 'https' : 'http',
    },
    plugins: {
        SplashScreen: {
            launchAutoHide: true,
            backgroundColor: '#1e40af',
            showSpinner: false,
        },
        StatusBar: {
            style: 'DEFAULT',
        },
    },
};

export default config;
