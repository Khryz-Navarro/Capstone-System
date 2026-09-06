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
import { getProfile, listRequests } from '../services/api';
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

function formatDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

interface TrackingScreenProps {
  onNavigate: (tab: import('../components/BottomTabBar').TabName) => void;
}

export default function TrackingScreen({ onNavigate }: TrackingScreenProps) {
  const [requests, setRequests] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();

  useEffect(() => {
    loadRequests();
    getProfile()
      .then(setProfile)
      .catch(() => {
        // Header falls back to a generic initial if this fails; not worth blocking the screen.
      });
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

  const firstName = profile?.name?.split(' ')[0] ?? 'Resident';
  const currentRequest = requests[0] ?? null;
  const currentStep = currentRequest ? getStepIndex(currentRequest.status) : -1;

  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.logoIcon, { backgroundColor: colors.primary }]}>
            <Text style={[styles.logoText, { color: '#071A27' }]}>⌂</Text>
          </View>
          <Text style={[styles.logoTitle, { color: colors.headerText }]}>KIDAPAWAN CITY</Text>
        </View>

        <View style={styles.headerRight}>
          <Pressable style={styles.headerBtn}>
            <Text style={styles.headerBtnIcon}>🔔</Text>
          </Pressable>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.avatarText, { color: colors.headerBg }]}>
              {firstName?.charAt(0)?.toUpperCase() ?? 'R'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text }]}>My Document Requests</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Track and claim your requested certifications</Text>
        </View>

        <View style={styles.tabsRow}>
          <Pressable style={[styles.tabPill, styles.tabPillActive, { borderColor: colors.border }]}>
            <Text style={[styles.tabText, styles.tabTextActive]}>All requests</Text>
          </Pressable>
          <Pressable style={[styles.tabPill, { borderColor: colors.border }]}>
            <Text style={[styles.tabText, { color: colors.textMuted }]}>Pending review</Text>
          </Pressable>
          <Pressable style={[styles.tabPill, { borderColor: colors.border }]}>
            <Text style={[styles.tabText, { color: colors.textMuted }]}>Ready for pickup</Text>
          </Pressable>
        </View>

        {currentRequest ? (
          <View style={[styles.currentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardRow}>
              <Text style={[styles.docName, { color: colors.text }]}>
                {currentRequest.document_type?.name ?? 'Document Request'}
              </Text>

              <View style={[styles.statusChip, { backgroundColor: colors.primarySoft }]}>
                <Text style={[styles.statusText, { color: '#071A27' }]}>{currentRequest.status_label ?? currentRequest.status}</Text>
              </View>
            </View>

            <Text style={[styles.refLabel, { color: colors.textMuted }]}>Reference No.: {currentRequest.reference_number ?? 'N/A'}</Text>

            <View style={styles.stepper}>
              {STEPS.map((step, index) => {
                const done = index <= currentStep;
                const active = index === currentStep;

                return (
                  <View key={step} style={styles.step}>
                    <View style={styles.stepTop}>
                      {index > 0 && (
                        <View
                          style={[
                            styles.line,
                            { backgroundColor: done ? colors.primary : colors.border },
                          ]}
                        />
                      )}

                      <View
                        style={[
                          styles.dot,
                          {
                            backgroundColor: done ? colors.primary : colors.inputBg,
                            borderColor: done ? colors.primary : colors.border,
                          },
                          active && { borderWidth: 2, borderColor: colors.primary },
                        ]}
                      />

                      {index < STEPS.length - 1 && (
                        <View
                          style={[
                            styles.line,
                            { backgroundColor: done ? colors.primary : colors.border },
                          ]}
                        />
                      )}
                    </View>

                    <Text
                      style={[
                        styles.stepLabel,
                        {
                          color: active ? colors.primary : colors.textMuted,
                          fontWeight: active ? '700' : '500',
                        },
                      ]}
                    >
                      {step}
                    </Text>

                    {index === currentStep && currentRequest.updated_at && (
                      <Text style={[styles.stepDate, { color: colors.textMuted }]}>
                        {formatDate(currentRequest.updated_at)}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.emptyIconWrap, { borderColor: colors.primary }]}>
              <Text style={styles.emptyIcon}>◌</Text>
            </View>

            <Text style={[styles.emptyTitle, { color: colors.text }]}>No requests found</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              You do not have any active certification requests at this time. Go to Home to request new certificates.
            </Text>

            <Pressable
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={() => onNavigate('documents')}
              >
              <Text style={[styles.primaryButtonText, { color: '#071A27' }]}>REQUEST A DOCUMENT</Text>
           </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 14,
    fontWeight: '700',
  },
  logoTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerBtn: {
    padding: 6,
  },
  headerBtnIcon: {
    fontSize: 18,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 28,
    gap: 14,
  },
  titleRow: {
    gap: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  tabPill: {
    flex: 1,
    minHeight: 32,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  tabPillActive: {
    backgroundColor: '#152C3D',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabTextActive: {
    color: '#EAF6FF',
  },
  currentCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  docName: {
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
  },
  statusChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  refLabel: {
    fontSize: 12,
  },
  stepper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 8,
  },
  step: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  stepTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  line: {
    flex: 1,
    height: 2,
    borderRadius: 999,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  stepLabel: {
    fontSize: 9,
    textAlign: 'center',
    lineHeight: 12,
  },
  stepDate: {
    fontSize: 9,
    textAlign: 'center',
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    minHeight: 290,
    justifyContent: 'center',
    marginTop: 8,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyIcon: {
    fontSize: 30,
    color: '#2EE6C8',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  primaryButton: {
    width: '100%',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});