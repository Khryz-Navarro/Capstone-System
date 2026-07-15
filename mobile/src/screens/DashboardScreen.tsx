import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { createRequest, getDocumentTypes, getProfile, listRequests, logoutUser } from '../services/api';

export default function DashboardScreen({ onLogout }: { onLogout: () => void }) {
  const [profile, setProfile] = useState<any>(null);
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [profileData, typesData, requestsData] = await Promise.all([getProfile(), getDocumentTypes(), listRequests()]);
      setProfile(profileData);
      setDocumentTypes(typesData);
      setRequests(requestsData);
    } catch (error) {
      Alert.alert('Error', 'Unable to load your dashboard right now.');
    } finally {
      setLoading(false);
    }
  }

  async function submitRequest(documentTypeId: number) {
    try {
      await createRequest(documentTypeId, 'Mobile request');
      Alert.alert('Submitted', 'Your request has been received.');
      await loadData();
    } catch (error) {
      Alert.alert('Error', 'Unable to submit the request.');
    }
  }

  async function handleLogout() {
    await logoutUser();
    onLogout();
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greeting}>Welcome</Text>
          <Text style={styles.name}>{profile?.name || 'Resident'}</Text>
        </View>
        <Pressable style={styles.outlineButton} onPress={handleLogout}>
          <Text style={styles.outlineText}>Logout</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Available documents</Text>
      <View style={styles.cardList}>
        {documentTypes.map((type) => (
          <Pressable key={type.id} style={styles.card} onPress={() => submitRequest(type.id)}>
            <Text style={styles.cardTitle}>{type.name}</Text>
            <Text style={styles.cardText}>{type.description || 'Request this document'}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Recent requests</Text>
      <FlatList
        data={requests}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.requestItem}>
            <Text style={styles.requestTitle}>{item.document_type?.name || 'Request'}</Text>
            <Text style={styles.requestStatus}>{item.status_label}</Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fb', padding: 20, gap: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  greeting: { color: '#64748b', fontSize: 14 },
  name: { color: '#0f172a', fontSize: 22, fontWeight: '700' },
  outlineButton: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  outlineText: { color: '#334155' },
  sectionTitle: { fontWeight: '700', color: '#0f172a', fontSize: 16, marginTop: 4 },
  cardList: { gap: 10 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  cardText: { color: '#64748b', marginTop: 4 },
  requestItem: { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 8 },
  requestTitle: { fontWeight: '600', color: '#0f172a' },
  requestStatus: { color: '#2563eb', marginTop: 4 },
});
