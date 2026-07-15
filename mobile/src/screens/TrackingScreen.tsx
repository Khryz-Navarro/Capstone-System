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
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#C9A227" />
      </View>
    );
  }

  const currentRequest = requests[0] ?? null;
  const history = requests.slice(1);
  const currentStep = currentRequest ? getStepIndex(currentRequest.status) : -1;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLogoRow}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoText}>⌂</Text>
          </View>
          <Text style={styles.logoTitle}>Barangay Connect</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C9A227" />}
      >
        {/* Current Request */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Request</Text>

          {currentRequest ? (
            <View style={styles.currentCard}>
              {/* Reference */}
              <View style={styles.refRow}>
                <Text style={styles.docName}>{currentRequest.document_type?.name ?? 'Document Request'}</Text>
                <StatusBadge status={currentRequest.status} label={currentRequest.status_label} />
              </View>
              {currentRequest.reference_number && (
                <Text style={styles.refNum}>Ref# {currentRequest.reference_number}</Text>
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
                          <View style={[styles.line, done && styles.lineDone]} />
                        )}
                        <View style={[styles.dot, done && styles.dotDone, active && styles.dotActive]}>
                          {done && <Text style={styles.dotCheck}>{active ? '●' : '✓'}</Text>}
                        </View>
                        {index < STEPS.length - 1 && (
                          <View style={[styles.line, done && index < currentStep && styles.lineDone]} />
                        )}
                      </View>
                      <Text style={[styles.stepLabel, active && styles.stepLabelActive, done && styles.stepLabelDone]}>
                        {step}
                      </Text>
                      {index === currentStep && currentRequest.updated_at && (
                        <Text style={styles.stepDate}>{formatDate(currentRequest.updated_at)}</Text>
                      )}
                    </View>
                  );
                })}
              </View>

              {/* Actions */}
              <View style={styles.actionRow}>
                <Pressable style={styles.viewBtn}>
                  <Text style={styles.viewBtnText}>View Receipt</Text>
                </Pressable>
                <Pressable style={styles.cancelBtn} onPress={handleCancel}>
                  <Text style={styles.cancelBtnText}>Cancel Request</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>No active requests</Text>
              <Text style={styles.emptySubtext}>Submit a document request to track it here</Text>
            </View>
          )}
        </View>

        {/* History */}
        {history.length > 0 && (
          <View style={styles.section}>
            <View style={styles.historyHeader}>
              <Text style={styles.sectionTitle}>History</Text>
              <Pressable style={styles.filterBtn}>
                <Text style={styles.filterText}>Filter ⊿</Text>
              </Pressable>
            </View>

            <View style={styles.historyList}>
              {history.map((item) => (
                <View key={item.id} style={styles.historyItem}>
                  <View style={styles.historyIcon}>
                    <Text style={styles.historyIconText}>☰</Text>
                  </View>
                  <View style={styles.historyContent}>
                    <Text style={styles.historyName}>{item.document_type?.name ?? 'Request'}</Text>
                    <Text style={styles.historyDate}>{formatDate(item.created_at)}</Text>
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
            <Text style={styles.emptyStateText}>No requests yet</Text>
            <Text style={styles.emptyStateSubtext}>Your document requests will appear here</Text>
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
  root: { flex: 1, backgroundColor: '#F5F6FA' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F6FA' },
  header: {
    backgroundColor: '#1a1a2e',
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
    backgroundColor: '#C9A227',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { color: '#fff', fontSize: 14 },
  logoTitle: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 16, paddingBottom: 32 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#0D1B2A' },
  currentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  refRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  docName: { fontSize: 15, fontWeight: '700', color: '#0D1B2A', flex: 1, marginRight: 8 },
  refNum: { fontSize: 11, color: '#9CA3AF', marginTop: -8 },
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
    backgroundColor: '#E5E7EB',
  },
  lineDone: {
    backgroundColor: '#22C55E',
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  dotDone: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  dotActive: {
    backgroundColor: '#C9A227',
    borderColor: '#C9A227',
  },
  dotCheck: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  stepLabel: {
    fontSize: 9,
    color: '#9CA3AF',
    textAlign: 'center',
    fontWeight: '500',
  },
  stepLabelActive: {
    color: '#C9A227',
    fontWeight: '700',
  },
  stepLabelDone: {
    color: '#22C55E',
    fontWeight: '600',
  },
  stepDate: {
    fontSize: 8,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  actionRow: { flexDirection: 'row', gap: 10 },
  viewBtn: {
    flex: 1,
    backgroundColor: '#C9A227',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  viewBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cancelBtnText: { color: '#DC2626', fontWeight: '700', fontSize: 13 },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyIcon: { fontSize: 36 },
  emptyText: { fontSize: 15, fontWeight: '700', color: '#374151' },
  emptySubtext: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  filterBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterText: { fontSize: 12, color: '#374151', fontWeight: '600' },
  historyList: { gap: 8 },
  historyItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  historyIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyIconText: { fontSize: 16, color: '#6B7280' },
  historyContent: { flex: 1 },
  historyName: { fontWeight: '600', fontSize: 13, color: '#0D1B2A' },
  historyDate: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyStateIcon: { fontSize: 48 },
  emptyStateText: { fontSize: 17, fontWeight: '700', color: '#374151' },
  emptyStateSubtext: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
});
