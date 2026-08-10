import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { createRequest, getDocumentTypes, getProfile, listRequests, logoutUser } from '../services/api';
import { useTheme } from '../theme/ThemeContext';

export default function DashboardScreen({ onLogout }: { onLogout: () => void }) {
  const [profile, setProfile] = useState<any>(null);
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { colors } = useTheme();

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
    return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>Welcome</Text>
          <Text style={[styles.name, { color: colors.text }]}>{profile?.name || 'Resident'}</Text>
        </View>
        <Pressable style={[styles.outlineButton, { borderColor: colors.border }]} onPress={handleLogout}>
          <Text style={[styles.outlineText, { color: colors.text }]}>Logout</Text>
        </Pressable>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Available documents</Text>
      <View style={styles.cardList}>
        {documentTypes.map((type) => (
          <Pressable key={type.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => submitRequest(type.id)}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{type.name}</Text>
            <Text style={[styles.cardText, { color: colors.textSecondary }]}>{type.description || 'Request this document'}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent requests</Text>
      <FlatList
        data={requests}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={[styles.requestItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.requestTitle, { color: colors.text }]}>{item.document_type?.name || 'Request'}</Text>
            <Text style={[styles.requestStatus, { color: colors.primary }]}>{item.status_label}</Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  greeting: { fontSize: 14 },
  name: { fontSize: 22, fontWeight: '700' },
  outlineButton: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  outlineText: { },
  sectionTitle: { fontWeight: '700', fontSize: 16, marginTop: 4 },
  cardList: { gap: 10 },
  card: { borderRadius: 12, padding: 14, borderWidth: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardText: { marginTop: 4 },
  requestItem: { borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 8 },
  requestTitle: { fontWeight: '600' },
  requestStatus: { marginTop: 4 },
});
