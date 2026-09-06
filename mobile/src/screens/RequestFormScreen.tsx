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
import { launchImageLibraryAsync, MediaTypeOptions, requestMediaLibraryPermissionsAsync } from 'expo-image-picker';
import { createRequest, getDocumentTypes, getProfile, type UploadableFile } from '../services/api';
import { TabName } from '../components/BottomTabBar';
import { useTheme } from '../theme/ThemeContext';
interface RequestFormScreenProps {
  onNavigate: (tab: TabName) => void;
  initialDocumentTypeId?: number | null;
}

const STEPS = ['Personal', 'Purpose', 'Notifications'];

export default function RequestFormScreen({ onNavigate, initialDocumentTypeId }: RequestFormScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(initialDocumentTypeId ?? null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { colors } = useTheme();

  // Step 1 — Personal Info
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  // Step 2 — Purpose
  const [purpose, setPurpose] = useState('');

  // Step 3 — Notifications
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySms, setNotifySms] = useState(true);

  const [idPhoto, setIdPhoto] = useState<UploadableFile | null>(null);
  const [supportingDocs, setSupportingDocs] = useState<UploadableFile[]>([]);

 useEffect(() => {
    Promise.all([getDocumentTypes(), getProfile()])
      .then(([types, profileData]) => {
        setDocumentTypes(Array.isArray(types) ? types : []);
        setProfile(profileData);
        setFullName(profileData?.name ?? '');
        if (initialDocumentTypeId) {
          setSelectedTypeId(initialDocumentTypeId);
        }
      })
      .catch(() => Alert.alert('Error', 'Unable to load form data.'))
      .finally(() => setLoading(false));
  }, [initialDocumentTypeId]);

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
    if (currentStep === 2) {
      if (!idPhoto) { Alert.alert('Required', 'Please upload a valid ID photo.'); return false; }
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

function normalizeUploadFile(asset: any, fallbackName: string): UploadableFile {
  return {
    uri: asset.uri,
    name: asset.fileName ?? fallbackName,
    type: asset.mimeType ?? 'image/jpeg',
  };
}

async function ensureMediaPermission(): Promise<boolean> {
  const permission = await requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permission needed', 'Please allow photo library access to upload requirements.');
    return false;
  }
  return true;
}

async function handlePickIdPhoto() {
  const allowed = await ensureMediaPermission();
  if (!allowed) return;

  const result = await launchImageLibraryAsync({
    mediaTypes: MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.8,
  });

  if (!result.canceled && result.assets?.[0]) {
    setIdPhoto(normalizeUploadFile(result.assets[0], 'valid-id.jpg'));
  }
}

async function handlePickSupportingDocs() {
  const allowed = await ensureMediaPermission();
  if (!allowed) return;

  const result = await launchImageLibraryAsync({
    mediaTypes: MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    quality: 0.8,
    selectionLimit: 5,
  });

  if (!result.canceled && result.assets?.length) {
    setSupportingDocs(
      result.assets.map((asset, index) => normalizeUploadFile(asset, `supporting-${index + 1}.jpg`)),
    );
  }
}

  async function handleSubmit() {
  if (!selectedTypeId) { Alert.alert('Required', 'Please select a document type.'); return; }
  if (!idPhoto) { Alert.alert('Required', 'Please upload a valid ID photo.'); return; }
  setSubmitting(true);
    try {
      await createRequest(selectedTypeId, purpose || 'For personal use', {
  idPhoto,
  supportingDocuments: supportingDocs,
  notificationChannels: [
    ...(notifyEmail ? ['email' as const] : []),
    ...(notifySms ? ['sms' as const] : []),
  ],
});
      // Reset form
      setCurrentStep(0);
      setPurpose('');
      setSelectedTypeId(null);
      setIdPhoto(null);
      setSupportingDocs([]);
    } catch (error: any) {
  console.log('Submit error:', JSON.stringify(error?.response?.data, null, 2));
  Alert.alert(
    'Error',
    error?.response?.data?.message || JSON.stringify(error?.response?.data?.errors) || 'Unable to submit your request. Please try again.'
  );
} finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

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
        {profile && (
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.avatarText, { color: colors.headerBg }]}>{(profile.name ?? 'R').charAt(0).toUpperCase()}</Text>
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
            <Text style={[styles.titleMain, { color: colors.text }]}>
              Request {documentTypes.find((t) => t.id === selectedTypeId)?.name ?? 'Document'}
            </Text>
            <Text style={[styles.titleSub, { color: colors.textSecondary }]}>Complete the steps below to apply for your official document. Processing usually takes 1-3 business days.</Text>
          </View>

          {/* Step Indicator */}
          <View style={styles.stepIndicator}>
            {STEPS.map((label, i) => {
              const done = i < currentStep;
              const active = i === currentStep;
              return (
                <View key={label} style={styles.stepIndicatorItem}>
                  <View style={[
                    styles.stepCircle,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    done && { backgroundColor: colors.success, borderColor: colors.success },
                    active && { backgroundColor: colors.primary, borderColor: colors.primary }
                  ]}>
                    {done ? (
                      <Text style={[styles.stepCircleCheck, { color: colors.headerText }]}>✓</Text>
                    ) : (
                      <Text style={[
                        styles.stepCircleNum,
                        { color: colors.textMuted },
                        active && { color: colors.headerText }
                      ]}>{i + 1}</Text>
                    )}
                  </View>
                  <Text style={[
                    styles.stepLabel,
                    { color: colors.textMuted },
                    active && { color: colors.primary, fontWeight: '700' },
                    done && { color: colors.success }
                  ]}>{label}</Text>
                  {i < STEPS.length - 1 && <View style={[styles.stepConnector, { backgroundColor: colors.borderLight }, done && { backgroundColor: colors.success }]} />}
                </View>
              );
            })}
          </View>

          {/* Step 1: Personal Info */}
          {currentStep === 0 && (
            <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.formSectionTitle, { color: colors.text }]}>Personal Information</Text>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Full Name</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg }]}
                  placeholder="Juan Dela Cruz"
                  placeholderTextColor={colors.textMuted}
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Residential Address</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg }]}
                  placeholder="House No., Street, Barangay, City/Municipality"
                  placeholderTextColor={colors.textMuted}
                  value={address}
                  onChangeText={setAddress}
                  multiline
                  numberOfLines={3}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Date of Birth</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg }]}
                  placeholder="mm/dd/yyyy"
                  placeholderTextColor={colors.textMuted}
                  value={dateOfBirth}
                  onChangeText={setDateOfBirth}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>
          )}

                  {/* Step 2: Purpose */}
        {currentStep === 1 && (
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.formSectionTitle, { color: colors.text }]}>Document Type & Purpose</Text>
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Select Document Type</Text>
              <View style={styles.docTypeList}>
                {documentTypes.map((type) => (
                  <Pressable
                    key={type.id}
                    style={[
                      styles.docTypeOption,
                      { borderColor: colors.borderLight, backgroundColor: colors.inputBg },
                      selectedTypeId === type.id && { borderColor: colors.primary, backgroundColor: colors.warningBg }
                    ]}
                    onPress={() => setSelectedTypeId(type.id)}
                  >
                    <View style={[styles.radioCircle, { borderColor: colors.border }, selectedTypeId === type.id && { borderColor: colors.primary }]}>
                      {selectedTypeId === type.id && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
                    </View>
                    <View style={styles.docTypeText}>
                      <Text style={[styles.docTypeName, { color: colors.text }, selectedTypeId === type.id && { color: colors.primary }]}>
                        {type.name}
                      </Text>
                      {type.description && (
                        <Text style={[styles.docTypeDesc, { color: colors.textMuted }]}>{type.description}</Text>
                      )}
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Purpose of Request</Text>
              <TextInput
                style={[styles.input, styles.textArea, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg }]}
                placeholder="e.g. For employment, for scholarship application..."
                placeholderTextColor={colors.textMuted}
                value={purpose}
                onChangeText={setPurpose}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Upload Requirements */}
            <View style={[styles.uploadSection, { borderColor: colors.warningBg, backgroundColor: colors.warningBg }]}>
              <Text style={[styles.uploadTitle, { color: colors.warningText }]}>Upload Requirements</Text>
              <Text style={[styles.uploadHint, { color: colors.textSecondary }]}>
                Add at least one valid ID photo. You can also attach supporting document photos.
              </Text>
              <Pressable style={[styles.uploadBtn, { backgroundColor: colors.primary }]} onPress={handlePickIdPhoto}>
                <Text style={[styles.uploadBtnText, { color: colors.headerText }]}>
                  {idPhoto ? '✓ Change Valid ID Photo' : '↑ Upload Valid ID Photo'}
                </Text>
              </Pressable>
              {idPhoto && <Text style={[styles.uploadFileName, { color: colors.text }]}>ID: {idPhoto.name}</Text>}
              <Pressable style={[styles.uploadBtnSecondary, { borderColor: colors.border }]} onPress={handlePickSupportingDocs}>
                <Text style={[styles.uploadBtnSecondaryText, { color: colors.text }]}>
                  {supportingDocs.length > 0 ? `✓ Replace Supporting Docs (${supportingDocs.length})` : '↑ Upload Supporting Documents'}
                </Text>
              </Pressable>
              {supportingDocs.map((file, index) => (
                <Text key={`${file.name}-${index}`} style={[styles.uploadFileName, { color: colors.textMuted }]}>
                  • {file.name}
                </Text>
              ))}
            </View>
          </View>
        )}

          {/* Step 3: Notifications */}
          {currentStep === 2 && (
            <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.formSectionTitle, { color: colors.text }]}>Notification Preferences</Text>
              <Text style={[styles.formSubtext, { color: colors.textSecondary }]}>How would you like to be notified about your request?</Text>

              <Pressable style={[styles.toggleRow, { borderBottomColor: colors.borderLight }]} onPress={() => setNotifyEmail((v) => !v)}>
                <View style={styles.toggleInfo}>
                  <Text style={styles.toggleIcon}>📧</Text>
                  <View>
                    <Text style={[styles.toggleLabel, { color: colors.text }]}>Email Notifications</Text>
                    <Text style={[styles.toggleDesc, { color: colors.textMuted }]}>Get updates sent to your email</Text>
                  </View>
                </View>
                <View style={[styles.toggle, { backgroundColor: colors.border }, notifyEmail && { backgroundColor: colors.primary }]}>
                  <View style={[styles.toggleThumb, { backgroundColor: colors.headerText }, notifyEmail && styles.toggleThumbOn]} />
                </View>
              </Pressable>

              <Pressable style={[styles.toggleRow, { borderBottomColor: 'transparent' }]} onPress={() => setNotifySms((v) => !v)}>
                <View style={styles.toggleInfo}>
                  <Text style={styles.toggleIcon}>📱</Text>
                  <View>
                    <Text style={[styles.toggleLabel, { color: colors.text }]}>SMS Notifications</Text>
                    <Text style={[styles.toggleDesc, { color: colors.textMuted }]}>Receive text message updates</Text>
                  </View>
                </View>
                <View style={[styles.toggle, { backgroundColor: colors.border }, notifySms && { backgroundColor: colors.primary }]}>
                  <View style={[styles.toggleThumb, { backgroundColor: colors.headerText }, notifySms && styles.toggleThumbOn]} />
                </View>
              </Pressable>

              {/* Summary */}
              <View style={[styles.summaryCard, { backgroundColor: colors.inputBg, borderColor: colors.borderLight }]}>
                <Text style={[styles.summaryTitle, { color: colors.text }]}>Request Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryKey, { color: colors.textMuted }]}>Document</Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {documentTypes.find((t) => t.id === selectedTypeId)?.name ?? '—'}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryKey, { color: colors.textMuted }]}>Applicant</Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>{fullName}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryKey, { color: colors.textMuted }]}>Purpose</Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>{purpose || '—'}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Navigation Buttons */}
          <View style={styles.navRow}>
            {currentStep > 0 && (
              <Pressable style={[styles.backBtn, { borderColor: colors.border, backgroundColor: colors.card }]} onPress={handleBack}>
                <Text style={[styles.backBtnText, { color: colors.text }]}>← Back</Text>
              </Pressable>
            )}
            {currentStep < STEPS.length - 1 ? (
              <Pressable style={[styles.nextBtn, { backgroundColor: colors.primary }]} onPress={handleNext}>
                <Text style={[styles.nextBtnText, { color: colors.headerText }]}>Next Step →</Text>
              </Pressable>
            ) : (
              <Pressable style={[styles.nextBtn, { backgroundColor: colors.primary }, submitting && styles.nextBtnDisabled]} onPress={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator color={colors.headerText} />
                ) : (
                  <Text style={[styles.nextBtnText, { color: colors.headerText }]}>Submit Request</Text>
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
  root: { flex: 1 },
  flex: { flex: 1 },
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
    width: 28, height: 28, borderRadius: 6,
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontSize: 14 },
  logoTitle: { fontWeight: '700', fontSize: 15 },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontWeight: '700', fontSize: 14 },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  titleBlock: { gap: 4 },
  titleMain: { fontSize: 18, fontWeight: '800' },
  titleSub: { fontSize: 13, lineHeight: 18 },
  stepIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 0 },
  stepIndicatorItem: { flexDirection: 'row', alignItems: 'center' },
  stepCircle: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  stepCircleCheck: { fontSize: 12, fontWeight: '700' },
  stepCircleNum: { fontSize: 12, fontWeight: '700' },
  stepLabel: { fontSize: 9, marginLeft: 4, marginRight: 2, fontWeight: '500' },
  stepConnector: { width: 20, height: 2, marginHorizontal: 2 },
  formCard: {
    borderRadius: 16, padding: 16, gap: 14,
    borderWidth: 1,
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  formSectionTitle: { fontSize: 15, fontWeight: '800' },
  formSubtext: { fontSize: 13 },
  formGroup: { gap: 6 },
  formLabel: { fontSize: 13, fontWeight: '600' },
  input: {
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 11,
    fontSize: 14,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  docTypeList: { gap: 8 },
  docTypeOption: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderWidth: 1, borderRadius: 12,
    padding: 12,
  },
  radioCircle: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  docTypeText: { flex: 1 },
  docTypeName: { fontSize: 14, fontWeight: '600' },
  docTypeDesc: { fontSize: 12, marginTop: 2 },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1,
  },
  toggleInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  toggleIcon: { fontSize: 20 },
  toggleLabel: { fontSize: 14, fontWeight: '600' },
  toggleDesc: { fontSize: 11 },
  toggle: {
    width: 44, height: 24, borderRadius: 12,
    justifyContent: 'center', paddingHorizontal: 2,
  },
  toggleThumb: {
    width: 20, height: 20, borderRadius: 10,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 2, elevation: 2,
  },
  toggleThumbOn: { alignSelf: 'flex-end' },
  summaryCard: {
    borderRadius: 12, padding: 14, gap: 8,
    borderWidth: 1,
  },
  summaryTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryKey: { fontSize: 12, fontWeight: '500' },
  summaryValue: { fontSize: 12, fontWeight: '600', flex: 1, textAlign: 'right' },
  navRow: { flexDirection: 'row', gap: 10 },
  backBtn: {
    flex: 1, borderWidth: 1, borderRadius: 12,
    paddingVertical: 13, alignItems: 'center',
  },
  backBtnText: { fontWeight: '600', fontSize: 14 },
  nextBtn: {
    flex: 2, borderRadius: 12,
    paddingVertical: 13, alignItems: 'center',
  },
  nextBtnDisabled: { opacity: 0.7 },
  nextBtnText: { fontWeight: '700', fontSize: 14 },

 uploadSection: {
  borderWidth: 1,
  borderRadius: 12,
  padding: 12,
  gap: 8,
},
uploadTitle: { fontSize: 13, fontWeight: '700' },
uploadHint: { fontSize: 12, lineHeight: 16 },
uploadBtn: {
  borderRadius: 8,
  paddingVertical: 10,
  alignItems: 'center',
},
uploadBtnText: { fontWeight: '700', fontSize: 13 },
uploadBtnSecondary: {
  borderRadius: 8,
  paddingVertical: 10,
  alignItems: 'center',
  borderWidth: 1,
},
uploadBtnSecondaryText: { fontWeight: '600', fontSize: 13 },
uploadFileName: { fontSize: 12 },
});

