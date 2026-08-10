import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

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
  const { colors } = useTheme();

  if (featured) {
    return (
      <View style={[styles.featuredCard, { backgroundColor: colors.headerBg }]}>
        <View style={[styles.featuredIconCircle, { backgroundColor: colors.primary }]}>
          <Text style={[styles.featuredIcon, { color: colors.headerText }]}>✦</Text>
        </View>
        <View style={styles.featuredContent}>
          <Text style={[styles.featuredTitle, { color: colors.headerText }]}>{name}</Text>
          <Text style={[styles.featuredDesc, { color: colors.textMuted }]}>{description ?? 'Most documents are processed within 1-3 days. You can track your request anytime.'}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconCircle, { backgroundColor: colors.inputBg }]}>
          <Text style={[styles.icon, { color: colors.textSecondary }]}>☰</Text>
        </View>
        <View style={styles.cardMeta}>
          <Text style={[styles.cardName, { color: colors.text }]}>{name}</Text>
          {fee !== undefined && (
            <View style={[styles.feeBadge, { backgroundColor: colors.warningBg }]}>
              <Text style={[styles.feeText, { color: colors.warningText }]}>{fee === 0 ? 'Free' : `₱${fee}`}</Text>
            </View>
          )}
        </View>
      </View>

      {description ? <Text style={[styles.desc, { color: colors.textSecondary }]}>{description}</Text> : null}

      {requiredDocs && requiredDocs.length > 0 && (
        <View style={styles.docsRow}>
          <Text style={[styles.docsLabel, { color: colors.textMuted }]}>Required Documents</Text>
          <View style={styles.chips}>
            {requiredDocs.slice(0, 3).map((doc, i) => (
              <View key={i} style={[styles.chip, { backgroundColor: colors.infoBg }]}>
                <Text style={[styles.chipText, { color: colors.infoText }]}>● {doc.label}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <Pressable style={({ pressed }) => [styles.requestBtn, { backgroundColor: colors.primary }, pressed && styles.requestBtnPressed]} onPress={onRequest}>
        <Text style={[styles.requestBtnText, { color: colors.headerText }]}>Request Now</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  featuredCard: {
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredIcon: { fontSize: 16 },
  featuredContent: { flex: 1, gap: 4 },
  featuredTitle: { fontWeight: '700', fontSize: 15 },
  featuredDesc: { fontSize: 12, lineHeight: 18 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 16 },
  cardMeta: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardName: { fontSize: 15, fontWeight: '700', flex: 1 },
  feeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  feeText: { fontSize: 11, fontWeight: '700' },
  desc: { fontSize: 13, lineHeight: 18 },
  docsRow: { gap: 6 },
  docsLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipText: { fontSize: 11, fontWeight: '500' },
  requestBtn: {
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 2,
  },
  requestBtnPressed: { opacity: 0.85 },
  requestBtnText: { fontWeight: '700', fontSize: 14 },
});
