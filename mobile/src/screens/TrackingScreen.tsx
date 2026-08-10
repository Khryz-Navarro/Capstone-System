import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import StatusBadge from '../components/StatusBadge';
import { listRequests } from '../services/api';
import { useTheme } from '../theme/ThemeContext';

const STEPS = ['Received', 'Processed', 'Notification', 'Ready for Pickup'];

function getStepIndex(status: string): number {
  const s = status?.toLowerCase() ?? '';
  if (s === 'pending') return 0;
  if (s === 'processing') return 1;
  if (s === 'approved') return 2;
  if (s === 'completed' || s === 'ready') return 3;
  return 0;
}

export default function TrackingScreen() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    try {
      const data = await listRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      Alert.alert('Error', 'Unable to load your requests.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    loadRequests();
  }

  function handleCancel() {
    Alert.alert(
      'Cancel Request',
      'To cancel this request, please visit the Barangay Hall or contact your barangay office.',
      [{ text: 'OK' }],
    );
  }

  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const currentRequest = requests[0] ?? null;
  const history = requests.slice(1);
  const currentStep = currentRequest ? getStepIndex(currentRequest.status) : -1;

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
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Current Request */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Current Request</Text>

          {currentRequest ? (
            <View style={[styles.currentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Reference */}
              <View style={styles.refRow}>
                <Text style={[styles.docName, { color: colors.text }]}>{currentRequest.document_type?.name ?? 'Document Request'}</Text>
                <StatusBadge status={currentRequest.status} label={currentRequest.status_label} />
              </View>
              {currentRequest.reference_number && (
                <Text style={[styles.refNum, { color: colors.textMuted }]}>Ref# {currentRequest.reference_number}</Text>
              )}

              {/* Step Tracker */}
              <View style={styles.tracker}>
                {STEPS.map((step, index) => {
                  const done = index <= currentStep;
                  const active = index === currentStep;
                  return (
                    <View key={step} style={styles.trackerStep}>
                      <View style={styles.trackerLine}>
                        {index > 0 && (
                          <View style={[styles.line, { backgroundColor: colors.borderLight }, done && { backgroundColor: colors.success }]} />
                        )}
                        <View style={[
                          styles.dot,
                          { backgroundColor: colors.inputBg, borderColor: colors.borderLight },
                          done && { backgroundColor: colors.success, borderColor: colors.success },
                          active && { backgroundColor: colors.primary, borderColor: colors.primary }
                        ]}>
                          {done && <Text style={styles.dotCheck}>{active ? '●' : '✓'}</Text>}
                        </View>
                        {index < STEPS.length - 1 && (
                          <View style={[styles.line, { backgroundColor: colors.borderLight }, done && index < currentStep && { backgroundColor: colors.success }]} />
                        )}
                      </View>
                      <Text style={[
                        styles.stepLabel,
                        { color: colors.textMuted },
                        active && { color: colors.primary, fontWeight: '700' },
                        done && { color: colors.success, fontWeight: '600' }
                      ]}>
                        {step}
                      </Text>
                      {index === currentStep && currentRequest.updated_at && (
                        <Text style={[styles.stepDate, { color: colors.textMuted }]}>{formatDate(currentRequest.updated_at)}</Text>
                      )}
                    </View>
                  );
                })}
              </View>

              {/* Actions */}
              <View style={styles.actionRow}>
                <Pressable style={[styles.viewBtn, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.viewBtnText, { color: colors.headerText }]}>View Receipt</Text>
                </Pressable>
                <Pressable style={[styles.cancelBtn, { backgroundColor: colors.dangerBg, borderColor: colors.dangerBorder }]} onPress={handleCancel}>
                  <Text style={[styles.cancelBtnText, { color: colors.dangerText }]}>Cancel Request</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={[styles.emptyText, { color: colors.text }]}>No active requests</Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Submit a document request to track it here</Text>
            </View>
          )}
        </View>

        {/* History */}
        {history.length > 0 && (
          <View style={styles.section}>
            <View style={styles.historyHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>History</Text>
              <Pressable style={[styles.filterBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.filterText, { color: colors.text }]}>Filter ⊿</Text>
              </Pressable>
            </View>

            <View style={styles.historyList}>
              {history.map((item) => (
                <View key={item.id} style={[styles.historyItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.historyIcon, { backgroundColor: colors.inputBg }]}>
                    <Text style={[styles.historyIconText, { color: colors.textSecondary }]}>☰</Text>
                  </View>
                  <View style={styles.historyContent}>
                    <Text style={[styles.historyName, { color: colors.text }]}>{item.document_type?.name ?? 'Request'}</Text>
                    <Text style={[styles.historyDate, { color: colors.textMuted }]}>{formatDate(item.created_at)}</Text>
                  </View>
                  <StatusBadge status={item.status} label={item.status_label} />
                </View>
              ))}
            </View>
          </View>
        )}

        {requests.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📂</Text>
            <Text style={[styles.emptyStateText, { color: colors.text }]}>No requests yet</Text>
            <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>Your document requests will appear here</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function formatDate(iso?: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  scroll: { flex: 1 },
  content: { padding: 20, gap: 16, paddingBottom: 32 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '800' },
  currentCard: {
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  refRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  docName: { fontSize: 15, fontWeight: '700', flex: 1, marginRight: 8 },
  refNum: { fontSize: 11, marginTop: -8 },
  tracker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  trackerStep: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  trackerLine: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  line: {
    flex: 1,
    height: 2,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  dotCheck: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  stepLabel: {
    fontSize: 9,
    textAlign: 'center',
    fontWeight: '500',
  },
  stepDate: {
    fontSize: 8,
    textAlign: 'center',
  },
  actionRow: { flexDirection: 'row', gap: 10 },
  viewBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  viewBtnText: { fontWeight: '700', fontSize: 13 },
  cancelBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelBtnText: { fontWeight: '700', fontSize: 13 },
  emptyCard: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
  },
  emptyIcon: { fontSize: 36 },
  emptyText: { fontSize: 15, fontWeight: '700' },
  emptySubtext: { fontSize: 13, textAlign: 'center' },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterText: { fontSize: 12, fontWeight: '600' },
  historyList: { gap: 8 },
  historyItem: {
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
  },
  historyIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyIconText: { fontSize: 16 },
  historyContent: { flex: 1 },
  historyName: { fontWeight: '600', fontSize: 13 },
  historyDate: { fontSize: 11, marginTop: 2 },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyStateIcon: { fontSize: 48 },
  emptyStateText: { fontSize: 17, fontWeight: '700' },
  emptyStateSubtext: { fontSize: 13, textAlign: 'center' },
});
