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
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';

function MainApp() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<TabName>('home');
  const { theme, colors } = useTheme();

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
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
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
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.screen}>{renderScreen()}</View>
        <BottomTabBar activeTab={activeTab} onTabPress={setActiveTab} />
      </View>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  screen: { flex: 1 },
});
