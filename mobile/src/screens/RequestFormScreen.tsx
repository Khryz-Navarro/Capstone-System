import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { createRequest, getDocumentTypes, getProfile } from '../services/api';
import { TabName } from '../components/BottomTabBar';

interface RequestFormScreenProps {
  onNavigate: (tab: TabName) => void;
}

const STEPS = ['Personal', 'Purpose', 'Notifications'];

export default function RequestFormScreen({ onNavigate }: RequestFormScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Step 1 — Personal Info
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  // Step 2 — Purpose
  const [purpose, setPurpose] = useState('');

  // Step 3 — Notifications
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySms, setNotifySms] = useState(true);

  useEffect(() => {
    Promise.all([getDocumentTypes(), getProfile()])
      .then(([types, profileData]) => {
        setDocumentTypes(Array.isArray(types) ? types : []);
        setProfile(profileData);
        setFullName(profileData?.name ?? '');
      })
      .catch(() => Alert.alert('Error', 'Unable to load form data.'))
      .finally(() => setLoading(false));
  }, []);

  function validateStep(): boolean {
    if (currentStep === 0) {
      if (!fullName.trim()) { Alert.alert('Required', 'Please enter your full name.'); return false; }
      if (!address.trim()) { Alert.alert('Required', 'Please enter your residential address.'); return false; }
      if (!dateOfBirth.trim()) { Alert.alert('Required', 'Please enter your date of birth.'); return false; }
    }
    if (currentStep === 1) {
      if (!selectedTypeId) { Alert.alert('Required', 'Please select a document type.'); return false; }
      if (!purpose.trim()) { Alert.alert('Required', 'Please enter the purpose of your request.'); return false; }
    }
    return true;
  }

  function handleNext() {
    if (!validateStep()) return;
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    }
  }

  function handleBack() {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }

  async function handleSubmit() {
    if (!selectedTypeId) { Alert.alert('Required', 'Please select a document type.'); return; }
    setSubmitting(true);
    try {
      await createRequest(selectedTypeId, purpose || 'For personal use');
      Alert.alert('Request Submitted!', 'Your request has been received. Processing usually takes 1-3 business days.', [
        { text: 'Track Request', onPress: () => onNavigate('tracking') },
      ]);
      // Reset form
      setCurrentStep(0);
      setPurpose('');
      setSelectedTypeId(null);
    } catch {
      Alert.alert('Error', 'Unable to submit your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#C9A227" />
      </View>
    );
  }

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
        {profile && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(profile.name ?? 'R').charAt(0).toUpperCase()}</Text>
          </View>
        )}
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Page Title */}
          <View style={styles.titleBlock}>
            <Text style={styles.titleMain}>Request Barangay Clearance</Text>
            <Text style={styles.titleSub}>Complete the steps below to apply for your official document. Processing usually takes 1-3 business days.</Text>
          </View>

          {/* Step Indicator */}
          <View style={styles.stepIndicator}>
            {STEPS.map((label, i) => {
              const done = i < currentStep;
              const active = i === currentStep;
              return (
                <View key={label} style={styles.stepIndicatorItem}>
                  <View style={[styles.stepCircle, done && styles.stepCircleDone, active && styles.stepCircleActive]}>
                    {done ? (
                      <Text style={styles.stepCircleCheck}>✓</Text>
                    ) : (
                      <Text style={[styles.stepCircleNum, active && styles.stepCircleNumActive]}>{i + 1}</Text>
                    )}
                  </View>
                  <Text style={[styles.stepLabel, active && styles.stepLabelActive, done && styles.stepLabelDone]}>{label}</Text>
                  {i < STEPS.length - 1 && <View style={[styles.stepConnector, done && styles.stepConnectorDone]} />}
                </View>
              );
            })}
          </View>

          {/* Step 1: Personal Info */}
          {currentStep === 0 && (
            <View style={styles.formCard}>
              <Text style={styles.formSectionTitle}>Personal Information</Text>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Juan Dela Cruz"
                  placeholderTextColor="#9CA3AF"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Residential Address</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="House No., Street, Barangay, City/Municipality"
                  placeholderTextColor="#9CA3AF"
                  value={address}
                  onChangeText={setAddress}
                  multiline
                  numberOfLines={3}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Date of Birth</Text>
                <TextInput
                  style={styles.input}
                  placeholder="mm/dd/yyyy"
                  placeholderTextColor="#9CA3AF"
                  value={dateOfBirth}
                  onChangeText={setDateOfBirth}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>
          )}

          {/* Step 2: Purpose */}
          {currentStep === 1 && (
            <View style={styles.formCard}>
              <Text style={styles.formSectionTitle}>Document Type & Purpose</Text>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Select Document Type</Text>
                <View style={styles.docTypeList}>
                  {documentTypes.map((type) => (
                    <Pressable
                      key={type.id}
                      style={[styles.docTypeOption, selectedTypeId === type.id && styles.docTypeOptionSelected]}
                      onPress={() => setSelectedTypeId(type.id)}
                    >
                      <View style={[styles.radioCircle, selectedTypeId === type.id && styles.radioCircleSelected]}>
                        {selectedTypeId === type.id && <View style={styles.radioDot} />}
                      </View>
                      <View style={styles.docTypeText}>
                        <Text style={[styles.docTypeName, selectedTypeId === type.id && styles.docTypeNameSelected]}>
                          {type.name}
                        </Text>
                        {type.description && (
                          <Text style={styles.docTypeDesc}>{type.description}</Text>
                        )}
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Purpose of Request</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="e.g. For employment, for scholarship application..."
                  placeholderTextColor="#9CA3AF"
                  value={purpose}
                  onChangeText={setPurpose}
                  multiline
                  numberOfLines={4}
                />
              </View>
            </View>
          )}

          {/* Step 3: Notifications */}
          {currentStep === 2 && (
            <View style={styles.formCard}>
              <Text style={styles.formSectionTitle}>Notification Preferences</Text>
              <Text style={styles.formSubtext}>How would you like to be notified about your request?</Text>

              <Pressable style={styles.toggleRow} onPress={() => setNotifyEmail((v) => !v)}>
                <View style={styles.toggleInfo}>
                  <Text style={styles.toggleIcon}>📧</Text>
                  <View>
                    <Text style={styles.toggleLabel}>Email Notifications</Text>
                    <Text style={styles.toggleDesc}>Get updates sent to your email</Text>
                  </View>
                </View>
                <View style={[styles.toggle, notifyEmail && styles.toggleOn]}>
                  <View style={[styles.toggleThumb, notifyEmail && styles.toggleThumbOn]} />
                </View>
              </Pressable>

              <Pressable style={styles.toggleRow} onPress={() => setNotifySms((v) => !v)}>
                <View style={styles.toggleInfo}>
                  <Text style={styles.toggleIcon}>📱</Text>
                  <View>
                    <Text style={styles.toggleLabel}>SMS Notifications</Text>
                    <Text style={styles.toggleDesc}>Receive text message updates</Text>
                  </View>
                </View>
                <View style={[styles.toggle, notifySms && styles.toggleOn]}>
                  <View style={[styles.toggleThumb, notifySms && styles.toggleThumbOn]} />
                </View>
              </Pressable>

              {/* Summary */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Request Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryKey}>Document</Text>
                  <Text style={styles.summaryValue}>
                    {documentTypes.find((t) => t.id === selectedTypeId)?.name ?? '—'}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryKey}>Applicant</Text>
                  <Text style={styles.summaryValue}>{fullName}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryKey}>Purpose</Text>
                  <Text style={styles.summaryValue}>{purpose || '—'}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Navigation Buttons */}
          <View style={styles.navRow}>
            {currentStep > 0 && (
              <Pressable style={styles.backBtn} onPress={handleBack}>
                <Text style={styles.backBtnText}>← Back</Text>
              </Pressable>
            )}
            {currentStep < STEPS.length - 1 ? (
              <Pressable style={styles.nextBtn} onPress={handleNext}>
                <Text style={styles.nextBtnText}>Next Step →</Text>
              </Pressable>
            ) : (
              <Pressable style={[styles.nextBtn, submitting && styles.nextBtnDisabled]} onPress={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.nextBtnText}>Submit Request</Text>
                )}
              </Pressable>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F6FA' },
  flex: { flex: 1 },
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
    width: 28, height: 28, borderRadius: 6,
    backgroundColor: '#C9A227', alignItems: 'center', justifyContent: 'center',
  },
  logoText: { color: '#fff', fontSize: 14 },
  logoTitle: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#C9A227', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#1a1a2e', fontWeight: '700', fontSize: 14 },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  titleBlock: { gap: 4 },
  titleMain: { fontSize: 18, fontWeight: '800', color: '#0D1B2A' },
  titleSub: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
  stepIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 0 },
  stepIndicatorItem: { flexDirection: 'row', alignItems: 'center' },
  stepCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#D1D5DB',
  },
  stepCircleDone: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
  stepCircleActive: { backgroundColor: '#C9A227', borderColor: '#C9A227' },
  stepCircleCheck: { color: '#fff', fontSize: 12, fontWeight: '700' },
  stepCircleNum: { color: '#9CA3AF', fontSize: 12, fontWeight: '700' },
  stepCircleNumActive: { color: '#fff' },
  stepLabel: { fontSize: 9, color: '#9CA3AF', marginLeft: 4, marginRight: 2, fontWeight: '500' },
  stepLabelActive: { color: '#C9A227', fontWeight: '700' },
  stepLabelDone: { color: '#22C55E' },
  stepConnector: { width: 20, height: 2, backgroundColor: '#E5E7EB', marginHorizontal: 2 },
  stepConnectorDone: { backgroundColor: '#22C55E' },
  formCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, gap: 14,
    borderWidth: 1, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  formSectionTitle: { fontSize: 15, fontWeight: '800', color: '#0D1B2A' },
  formSubtext: { fontSize: 13, color: '#6B7280' },
  formGroup: { gap: 6 },
  formLabel: { fontSize: 13, fontWeight: '600', color: '#374151' },
  input: {
    borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 11,
    fontSize: 14, color: '#0D1B2A', backgroundColor: '#F9FAFB',
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  docTypeList: { gap: 8 },
  docTypeOption: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12,
    padding: 12, backgroundColor: '#F9FAFB',
  },
  docTypeOptionSelected: { borderColor: '#C9A227', backgroundColor: '#FFFBEB' },
  radioCircle: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: '#D1D5DB',
    alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  radioCircleSelected: { borderColor: '#C9A227' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#C9A227' },
  docTypeText: { flex: 1 },
  docTypeName: { fontSize: 14, fontWeight: '600', color: '#0D1B2A' },
  docTypeNameSelected: { color: '#C9A227' },
  docTypeDesc: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  toggleInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  toggleIcon: { fontSize: 20 },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: '#0D1B2A' },
  toggleDesc: { fontSize: 11, color: '#9CA3AF' },
  toggle: {
    width: 44, height: 24, borderRadius: 12, backgroundColor: '#E5E7EB',
    justifyContent: 'center', paddingHorizontal: 2,
  },
  toggleOn: { backgroundColor: '#C9A227' },
  toggleThumb: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 2, elevation: 2,
  },
  toggleThumbOn: { alignSelf: 'flex-end' },
  summaryCard: {
    backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, gap: 8,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  summaryTitle: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 2 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryKey: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
  summaryValue: { fontSize: 12, color: '#0D1B2A', fontWeight: '600', flex: 1, textAlign: 'right' },
  navRow: { flexDirection: 'row', gap: 10 },
  backBtn: {
    flex: 1, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12,
    paddingVertical: 13, alignItems: 'center', backgroundColor: '#FFFFFF',
  },
  backBtnText: { color: '#374151', fontWeight: '600', fontSize: 14 },
  nextBtn: {
    flex: 2, backgroundColor: '#C9A227', borderRadius: 12,
    paddingVertical: 13, alignItems: 'center',
  },
  nextBtnDisabled: { opacity: 0.7 },
  nextBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
