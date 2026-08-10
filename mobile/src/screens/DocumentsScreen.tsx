import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DocumentCard from '../components/DocumentCard';
import { createRequest, getDocumentTypes } from '../services/api';
import { TabName } from '../components/BottomTabBar';
import { useTheme } from '../theme/ThemeContext';

interface DocumentsScreenProps {
  onNavigate: (tab: TabName) => void;
}

const STATIC_DOC_META: Record<string, { requiredDocs: string[]; fee: number }> = {
  'Barangay Clearance': {
    requiredDocs: ['Valid ID', 'Latest Utility Bill'],
    fee: 0,
  },
  'Certificate of Residency': {
    requiredDocs: ['Valid ID', 'Proof of Residency'],
    fee: 0,
  },
  'Certificate of Indigency': {
    requiredDocs: ['Referral'],
    fee: 0,
  },
  'First Time Job Seeker': {
    requiredDocs: ['Barangay ID', 'Birth Certificate'],
    fee: 0,
  },
};

export default function DocumentsScreen({ onNavigate }: DocumentsScreenProps) {
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { colors } = useTheme();

  useEffect(() => {
    getDocumentTypes()
      .then((data) => setDocumentTypes(Array.isArray(data) ? data : []))
      .catch(() => Alert.alert('Error', 'Unable to load document types.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleRequest(documentTypeId: number, name: string) {
    Alert.alert(
      `Request ${name}`,
      'Please provide the purpose of your request.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            try {
              await createRequest(documentTypeId, 'For personal use');
              Alert.alert('Submitted!', 'Your request has been received. You can track it in the Tracking tab.');
              onNavigate('tracking');
            } catch {
              Alert.alert('Error', 'Unable to submit your request. Please try again.');
            }
          },
        },
      ],
    );
  }

  const filtered = documentTypes.filter((t) =>
    t.name?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
        <View style={styles.headerLogoRow}>
          <View style={[styles.logoIcon, { backgroundColor: colors.primary }]}>
            <Text style={[styles.logoText, { color: colors.headerText }]}>⌂</Text>
          </View>
          <Text style={[styles.logoTitle, { color: colors.headerText }]}>Barangay Connect</Text>
        </View>
        <Text style={styles.headerSearch}>🔍</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Page Title */}
        <View style={styles.pageTitle}>
          <Text style={[styles.titleMain, { color: colors.text }]}>Document Services</Text>
          <Text style={[styles.titleSub, { color: colors.textSecondary }]}>Select the document you need to request from your local barangay office.</Text>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            placeholder="Search for clearances, residency, etc..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Featured notice */}
            <DocumentCard
              featured
              name="Digital Processing"
              description="Most documents are processed within 1-3 days. You can track your request anytime from the app."
              onRequest={() => {}}
            />

            {/* Document type list */}
            {filtered.map((type) => {
              const meta = STATIC_DOC_META[type.name] ?? { requiredDocs: [], fee: 0 };
              return (
                <DocumentCard
                  key={type.id}
                  name={type.name}
                  description={type.description ?? 'Required for official business, government applications and legal purposes.'}
                  requiredDocs={meta.requiredDocs.map((l) => ({ label: l }))}
                  fee={type.fee ?? meta.fee}
                  onRequest={() => handleRequest(type.id, type.name)}
                />
              );
            })}

            {filtered.length === 0 && !loading && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📄</Text>
                <Text style={[styles.emptyText, { color: colors.text }]}>No documents found</Text>
                <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>Try a different search term</Text>
              </View>
            )}

            {/* Footer */}
            <View style={[styles.footer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.footerText, { color: colors.text }]}>Can't find what you need?</Text>
              <Text style={[styles.footerSub, { color: colors.textSecondary }]}>
                You can visit the Barangay hall for special requests or visit our Help center.
              </Text>
              <View style={[styles.contactRow, { backgroundColor: colors.background }]}>
                <Text style={styles.contactIcon}>📞</Text>
                <Text style={[styles.contactText, { color: colors.text }]}>Contact Support</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 16,
  },
  headerLogoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { fontSize: 14 },
  logoTitle: { fontWeight: '700', fontSize: 15 },
  headerSearch: { fontSize: 20 },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 12, paddingBottom: 32 },
  pageTitle: { gap: 4 },
  titleMain: { fontSize: 20, fontWeight: '800' },
  titleSub: { fontSize: 13, lineHeight: 18 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 14 },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 16, fontWeight: '700' },
  emptySubtext: { fontSize: 13 },
  footer: {
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    marginTop: 4,
  },
  footerText: { fontSize: 14, fontWeight: '700' },
  footerSub: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  contactIcon: { fontSize: 14 },
  contactText: { fontSize: 13, fontWeight: '600' },
});
