import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import DocumentsScreen from './src/screens/DocumentsScreen';
import TrackingScreen from './src/screens/TrackingScreen';
import RequestFormScreen from './src/screens/RequestFormScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import BottomTabBar, { TabName } from './src/components/BottomTabBar';

export default function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<TabName>('home');

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

  if (!authenticated) {
    return (
      <>
        <StatusBar style="light" />
        <AuthScreen onAuthenticated={() => setAuthenticated(true)} />
      </>
    );
  }

  function renderScreen() {
    switch (activeTab) {
      case 'home':
        return <HomeScreen onNavigate={setActiveTab} />;
      case 'documents':
        return <DocumentsScreen onNavigate={setActiveTab} />;
      case 'tracking':
        return <TrackingScreen />;
      case 'request':
        return <RequestFormScreen onNavigate={setActiveTab} />;
      case 'profile':
        return <ProfileScreen onLogout={() => setAuthenticated(false)} />;
      default:
        return <HomeScreen onNavigate={setActiveTab} />;
    }
  }

  return (
    <>
      <StatusBar style="light" />
      <View style={styles.container}>
        <View style={styles.screen}>{renderScreen()}</View>
        <BottomTabBar activeTab={activeTab} onTabPress={setActiveTab} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  screen: { flex: 1 },
});
