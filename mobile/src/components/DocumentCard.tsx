import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface RequiredDoc {
  label: string;
}

interface DocumentCardProps {
  name: string;
  description?: string;
  requiredDocs?: RequiredDoc[];
  fee?: string | number;
  onRequest: () => void;
  featured?: boolean;
}

export default function DocumentCard({ name, description, requiredDocs, fee, onRequest, featured }: DocumentCardProps) {
  if (featured) {
    return (
      <View style={styles.featuredCard}>
        <View style={styles.featuredIconCircle}>
          <Text style={styles.featuredIcon}>✦</Text>
        </View>
        <View style={styles.featuredContent}>
          <Text style={styles.featuredTitle}>{name}</Text>
          <Text style={styles.featuredDesc}>{description ?? 'Most documents are processed within 1-3 days. You can track your request anytime.'}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>☰</Text>
        </View>
        <View style={styles.cardMeta}>
          <Text style={styles.cardName}>{name}</Text>
          {fee !== undefined && (
            <View style={styles.feeBadge}>
              <Text style={styles.feeText}>{fee === 0 ? 'Free' : `₱${fee}`}</Text>
            </View>
          )}
        </View>
      </View>

      {description ? <Text style={styles.desc}>{description}</Text> : null}

      {requiredDocs && requiredDocs.length > 0 && (
        <View style={styles.docsRow}>
          <Text style={styles.docsLabel}>Required Documents</Text>
          <View style={styles.chips}>
            {requiredDocs.slice(0, 3).map((doc, i) => (
              <View key={i} style={styles.chip}>
                <Text style={styles.chipText}>● {doc.label}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <Pressable style={({ pressed }) => [styles.requestBtn, pressed && styles.requestBtnPressed]} onPress={onRequest}>
        <Text style={styles.requestBtnText}>Request Now</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  featuredCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  featuredIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#C9A227',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredIcon: { color: '#FFFFFF', fontSize: 16 },
  featuredContent: { flex: 1, gap: 4 },
  featuredTitle: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  featuredDesc: { color: '#CBD5E1', fontSize: 12, lineHeight: 18 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 16, color: '#6B7280' },
  cardMeta: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardName: { fontSize: 15, fontWeight: '700', color: '#0D1B2A', flex: 1 },
  feeBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  feeText: { fontSize: 11, color: '#92400E', fontWeight: '700' },
  desc: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
  docsRow: { gap: 6 },
  docsLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    backgroundColor: '#EFF6FF',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipText: { fontSize: 11, color: '#1D4ED8', fontWeight: '500' },
  requestBtn: {
    backgroundColor: '#C9A227',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 2,
  },
  requestBtnPressed: { opacity: 0.85 },
  requestBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});
