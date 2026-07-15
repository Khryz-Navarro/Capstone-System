import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import AuthScreen from './src/screens/AuthScreen';
import DashboardScreen from './src/screens/DashboardScreen';

export default function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    async function bootstrap() {
      const token = await AsyncStorage.getItem('mobile_token');
      setAuthenticated(Boolean(token));
    }

    bootstrap();
  }, []);

  if (authenticated === null) {
    return null;
  }

  return (
    <>
      <StatusBar style="auto" />
      {authenticated ? (
        <DashboardScreen onLogout={() => setAuthenticated(false)} />
      ) : (
        <AuthScreen onAuthenticated={() => setAuthenticated(true)} />
      )}
    </>
  );
}
