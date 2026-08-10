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
import { getNotifications, getProfile, listRequests, markAllNotificationsRead } from '../services/api';
import { TabName } from '../components/BottomTabBar';
import { useTheme } from '../theme/ThemeContext';

interface HomeScreenProps {
  onNavigate: (tab: TabName) => void;
}

export default function HomeScreen({ onNavigate }: HomeScreenProps) {
  const [profile, setProfile] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { colors } = useTheme();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [profileData, requestsData, notifData] = await Promise.all([
        getProfile(),
        listRequests(),
        getNotifications().catch(() => []),
      ]);
      setProfile(profileData);
      setRequests(Array.isArray(requestsData) ? requestsData : []);
      const notifs = Array.isArray(notifData) ? notifData : [];
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n: any) => !n.read_at).length);
    } catch {
      Alert.alert('Error', 'Unable to load your dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    loadData();
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead().catch(() => null);
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })));
  }

  const activeRequests = requests.filter((r) =>
    ['pending', 'processing', 'approved'].includes(r.status?.toLowerCase() ?? ''),
  );
  const recentActivity = [...notifications, ...requests]
    .slice(0, 4)
    .map((item) =>
      item.data
        ? { id: item.id, title: item.data?.title ?? 'Notification', desc: item.data?.body ?? '', time: item.created_at, type: 'notif' }
        : { id: item.id, title: item.document_type?.name ?? 'Request', desc: item.status_label ?? item.status, time: item.created_at, type: 'request' },
    );

  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const firstName = profile?.name?.split(' ')[0] ?? 'Resident';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.logoIcon, { backgroundColor: colors.primary }]}>
            <Text style={[styles.logoText, { color: colors.headerText }]}>⌂</Text>
          </View>
          <Text style={[styles.logoTitle, { color: colors.headerText }]}>Barangay Connect</Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable style={styles.headerBtn} onPress={handleMarkAllRead}>
            <Text style={styles.headerBtnIcon}>🔔</Text>
            {unreadCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.danger }]}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </Pressable>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.avatarText, { color: colors.headerBg }]}>{firstName.charAt(0).toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Welcome */}
        <View style={styles.welcomeRow}>
          <Text style={[styles.welcomeSub, { color: colors.textMuted }]}>WELCOME BACK</Text>
          <Text style={[styles.welcomeName, { color: colors.text }]}>{profile?.name ?? 'Resident'}</Text>
        </View>

        {/* Active Requests Card */}
        <Pressable style={[styles.activeCard, { backgroundColor: colors.headerBg, borderLeftColor: colors.primary }]} onPress={() => onNavigate('tracking')}>
          <View style={styles.activeCardInner}>
            <View>
              <Text style={[styles.activeCardLabel, { color: colors.textMuted }]}>Active Requests</Text>
              <Text style={[styles.activeCardCount, { color: colors.headerText }]}>
                {activeRequests.length} Barangay Clearance{activeRequests.length !== 1 ? 's' : ''} pending
              </Text>
              {activeRequests[0] && (
                <View style={[styles.readyBadge, { backgroundColor: colors.success }]}>
                  <Text style={styles.readyText}>
                    {activeRequests[0].status_label ?? activeRequests[0].status}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.activeArrow, { color: colors.primary }]}>›</Text>
          </View>
        </Pressable>

        {/* Request Document Shortcut */}
        <Pressable style={[styles.shortcutCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => onNavigate('documents')}>
          <View style={styles.shortcutLeft}>
            <View style={[styles.shortcutIcon, { backgroundColor: colors.iconBg }]}>
              <Text style={[styles.shortcutIconText, { color: colors.iconColor }]}>☰</Text>
            </View>
            <View>
              <Text style={[styles.shortcutTitle, { color: colors.text }]}>Request Document</Text>
              <Text style={[styles.shortcutDesc, { color: colors.textSecondary }]}>Apply for Clearance, Indigency or Residency</Text>
            </View>
          </View>
          <Text style={[styles.shortcutArrow, { color: colors.primary }]}>›</Text>
        </Pressable>

        {/* Track Status */}
        <Pressable style={[styles.trackCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => onNavigate('tracking')}>
          <View style={styles.shortcutLeft}>
            <View style={[styles.shortcutIcon, { backgroundColor: colors.warningBg }]}>
              <Text style={[styles.shortcutIconText, { color: colors.iconColor }]}>◎</Text>
            </View>
            <View>
              <Text style={[styles.shortcutTitle, { color: colors.text }]}>Track Status</Text>
              <Text style={[styles.shortcutDesc, { color: colors.textSecondary }]}>Check your document request status</Text>
            </View>
          </View>
          <Text style={[styles.shortcutArrow, { color: colors.primary }]}>›</Text>
        </Pressable>

        {/* Help & Support */}
        <Pressable style={[styles.helpRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={styles.helpIcon}>❓</Text>
          <Text style={[styles.helpText, { color: colors.text }]}>Help & Support</Text>
          <Text style={[styles.helpArrow, { color: colors.textMuted }]}>↗</Text>
        </Pressable>

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
              <Pressable onPress={() => onNavigate('tracking')}>
                <Text style={[styles.viewAll, { color: colors.primary }]}>View All</Text>
              </Pressable>
            </View>
            <View style={styles.activityList}>
              {recentActivity.map((item) => (
                <View key={`${item.type}-${item.id}`} style={[styles.activityItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.activityDot, { backgroundColor: colors.success }]} />
                  <View style={styles.activityContent}>
                    <Text style={[styles.activityTitle, { color: colors.text }]}>{item.title}</Text>
                    <Text style={[styles.activityDesc, { color: colors.textSecondary }]}>{item.desc}</Text>
                  </View>
                  <Text style={[styles.activityTime, { color: colors.textMuted }]}>{formatTime(item.time)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Announcement Banner */}
        <View style={[styles.announcementCard, { backgroundColor: colors.headerBg }]}>
          <View style={[styles.announcementOverlay, { backgroundColor: colors.overlay }]}>
            <Text style={[styles.announcementBadge, { color: colors.primary }]}>ANNOUNCEMENT</Text>
            <Text style={[styles.announcementTitle, { color: colors.headerText }]}>Barangay General Assembly</Text>
            <Text style={[styles.announcementDesc, { color: colors.textMuted }]}>Join us at the Barangay Hall for the quarterly meeting</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function formatTime(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${Math.floor(diffHrs / 24)}d ago`;
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
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { fontSize: 14 },
  logoTitle: { fontWeight: '700', fontSize: 15 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerBtn: { position: 'relative' },
  headerBtnIcon: { fontSize: 20 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    borderRadius: 999,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontWeight: '700', fontSize: 14 },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 12, paddingBottom: 32 },
  welcomeRow: { gap: 2 },
  welcomeSub: { fontSize: 11, fontWeight: '600', letterSpacing: 1 },
  welcomeName: { fontSize: 26, fontWeight: '800' },
  activeCard: {
    borderRadius: 16,
    padding: 18,
    borderLeftWidth: 4,
  },
  activeCardInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activeCardLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  activeCardCount: { fontSize: 15, fontWeight: '600' },
  readyBadge: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  readyText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  activeArrow: { fontSize: 28, fontWeight: '300' },
  shortcutCard: {
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  trackCard: {
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  shortcutLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  shortcutIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutIconText: { fontSize: 18 },
  shortcutTitle: { fontWeight: '700', fontSize: 14 },
  shortcutDesc: { fontSize: 12, marginTop: 2 },
  shortcutArrow: { fontSize: 24 },
  helpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  helpIcon: { fontSize: 18 },
  helpText: { flex: 1, fontSize: 14, fontWeight: '500' },
  helpArrow: { fontSize: 16 },
  section: { gap: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontWeight: '700', fontSize: 16 },
  viewAll: { fontSize: 13, fontWeight: '600' },
  activityList: { gap: 8 },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderWidth: 1,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  activityContent: { flex: 1, gap: 2 },
  activityTitle: { fontWeight: '600', fontSize: 13 },
  activityDesc: { fontSize: 12 },
  activityTime: { fontSize: 11 },
  announcementCard: {
    height: 130,
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  announcementOverlay: {
    padding: 14,
    gap: 3,
  },
  announcementBadge: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 2,
  },
  announcementTitle: { fontSize: 15, fontWeight: '700' },
  announcementDesc: { fontSize: 12 },
});
