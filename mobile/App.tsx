import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import DocumentsScreen from './src/screens/DocumentsScreen';
import TrackingScreen from './src/screens/TrackingScreen';
import RequestFormScreen from './src/screens/RequestFormScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import BottomTabBar, { TabName } from './src/components/BottomTabBar';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { getProfile, logoutUser } from './src/services/api';

function MainApp() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<TabName>('home');
  const [selectedDocumentTypeId, setSelectedDocumentTypeId] = useState<number | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const { theme, colors } = useTheme();

  useEffect(() => {
    async function bootstrap() {
      const token = await AsyncStorage.getItem('mobile_token');
      setAuthenticated(Boolean(token));
    }
    bootstrap();
  }, []);

  useEffect(() => {
    if (activeTab === 'profile' && authenticated) {
      getProfile()
        .then(setProfile)
        .catch((err) => console.error('Failed to load profile', err));
    }
  }, [activeTab, authenticated]);

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

  function handleRequestDocument(documentTypeId: number) {
    setSelectedDocumentTypeId(documentTypeId);
    setActiveTab('request');
  }

  function renderScreen() {
    switch (activeTab) {
      case 'home':
        return <HomeScreen onNavigate={setActiveTab} onRequestDocument={handleRequestDocument} />;
      case 'documents':
        return <DocumentsScreen onNavigate={setActiveTab} onRequestDocument={handleRequestDocument} />;
      case 'tracking':
        return <TrackingScreen onNavigate={setActiveTab} />;
      case 'notifications':
        return <NotificationsScreen />;
      case 'request':
        return (
          <RequestFormScreen
            onNavigate={setActiveTab}
            initialDocumentTypeId={selectedDocumentTypeId}
          />
        );
      case 'profile':
        if (!profile?.resident_profile) return null;

        if (editingProfile) {
          return (
            <EditProfileScreen
              profile={profile}
              onCancel={() => setEditingProfile(false)}
              onSaved={(updated) => {
                setProfile(updated);
                setEditingProfile(false);
              }}
            />
          );
        }

        return (
          <ProfileScreen
            profile={profile.resident_profile}
            onEditDetails={() => setEditingProfile(true)}
            onEditSection={() => setEditingProfile(true)}
            onLogout={async () => {
              await logoutUser();
              setAuthenticated(false);
            }}
          />
        );
      default:
        return <HomeScreen onNavigate={setActiveTab} onRequestDocument={handleRequestDocument} />;
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
  container: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
});