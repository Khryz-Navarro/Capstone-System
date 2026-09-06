import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  launchImageLibraryAsync,
  launchCameraAsync,
  requestMediaLibraryPermissionsAsync,
  requestCameraPermissionsAsync,
  MediaTypeOptions,
} from 'expo-image-picker';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { loginUser, registerUser, getBarangays } from '../services/api';
import { useTheme } from '../theme/ThemeContext';

interface Barangay {
  id: number;
  name: string;
}

const GENDER_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
];

const CIVIL_STATUS_OPTIONS = [
  { label: 'Single', value: 'single' },
  { label: 'Married', value: 'married' },
  { label: 'Widowed', value: 'widowed' },
  { label: 'Separated', value: 'separated' },
  { label: 'Divorced', value: 'divorced' },
];

function OptionPicker({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: colors.text }]}>{label}</Text>
      <View style={styles.optionRow}>
        {options.map((opt) => {
          const isActive = value === opt.value;

          return (
            <Pressable
              key={opt.value}
              style={[
                styles.optionBtn,
                { borderColor: colors.border, backgroundColor: colors.inputBg },
                isActive && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={() => onChange(opt.value)}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: isActive ? '#041720' : colors.text },
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function AuthScreen({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const { colors } = useTheme();

  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');

  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [suffix, setSuffix] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [gender, setGender] = useState('male');
  const [civilStatus, setCivilStatus] = useState('single');
  const [birthdate, setBirthdate] = useState('');
  const [city, setCity] = useState('Kidapawan City');
  const [province, setProvince] = useState('Cotabato');
  const [purok, setPurok] = useState('');
  const [houseStreetAddress, setHouseStreetAddress] = useState('');
  const [barangayId, setBarangayId] = useState('');
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [govIdType, setGovIdType] = useState('');
  const [govIdNumber, setGovIdNumber] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [idPhoto, setIdPhoto] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [facialPhoto, setFacialPhoto] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getBarangays()
      .then((data: Barangay[]) => setBarangays(data))
      .catch(() => {
        // Fails silently on screen load; error surfaces when they try to submit with no options
      });
  }, []);

  async function handleLogin() {
    if (!login || !password) {
      Alert.alert('Missing details', 'Please provide your email or username and password.');
      return;
    }

    setLoading(true);
    try {
      const data = await loginUser(login, password);
      await AsyncStorage.setItem('mobile_token', data.token);
      onAuthenticated();
    } catch (error: any) {
      const errors = error?.response?.data?.errors as Record<string, string[]> | undefined;
      const firstError = errors ? Object.values(errors)[0]?.[0] : undefined;
      const msg =
        firstError ??
        error?.response?.data?.message ??
        'Unable to sign in. Please check your credentials.';
      Alert.alert('Login failed', msg);
    } finally {
      setLoading(false);
    }
  }

  async function handlePickIdPhoto() {
    const permission = await requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow access to your photo library to upload your valid ID.');
      return;
    }

    const result = await launchImageLibraryAsync({
      mediaTypes: MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setIdPhoto({
        uri: asset.uri,
        name: asset.fileName ?? 'valid-id.jpg',
        type: asset.mimeType ?? 'image/jpeg',
      });
    }
  }

  async function handleTakeSelfie() {
    const permission = await requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow camera access to take your selfie.');
      return;
    }

    const result = await launchCameraAsync({
      mediaTypes: MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      cameraType: 'front' as any,
    });

    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setFacialPhoto({
        uri: asset.uri,
        name: asset.fileName ?? 'selfie.jpg',
        type: asset.mimeType ?? 'image/jpeg',
      });
    }
  }

    async function handlePickFacialPhoto() {
  const permission = await requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permission needed', 'Please allow access to your photo library to upload your photo.');
    return;
  }

  const result = await launchImageLibraryAsync({
    mediaTypes: MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.8,
  });

  if (!result.canceled && result.assets?.[0]) {
    const asset = result.assets[0];
    setFacialPhoto({
      uri: asset.uri,
      name: asset.fileName ?? 'facial-photo.jpg',
      type: asset.mimeType ?? 'image/jpeg',
    });
  }
  }

  async function handleSignup() {
    if (!firstName || !middleName || !lastName || !email || !mobileNumber || !houseStreetAddress) {
      Alert.alert('Missing details', 'Please complete all required personal details.');
      return;
    }
    if (!birthdate) {
      Alert.alert('Missing details', 'Please enter your date of birth (YYYY-MM-DD).');
      return;
    }
    if (!govIdType || !govIdNumber) {
      Alert.alert('ID verification required', 'Please provide your valid government ID type and number.');
      return;
    }
    if (!signupPassword) {
      Alert.alert('Missing details', 'Please create a password.');
      return;
    }
    if (signupPassword !== confirmPassword) {
      Alert.alert('Password mismatch', 'Your passwords do not match.');
      return;
    }
    if (!idPhoto) {
      Alert.alert('ID photo required', 'Please upload a clear photo of your valid ID.');
      return;
    }
    if (!facialPhoto) {
      Alert.alert('Selfie required', 'Please take a live selfie to verify your identity.');
      return;
    }
    if (!barangayId) {
      Alert.alert('Missing details', 'Please select your barangay of residence.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('barangay_id', String(Number(barangayId)));
      formData.append('first_name', firstName);
      formData.append('middle_name', middleName);
      formData.append('last_name', lastName);
      formData.append('suffix', suffix);
      formData.append('gender', gender);
      formData.append('birthdate', birthdate);
      formData.append('civil_status', civilStatus);
      formData.append('mobile_number', mobileNumber);
      formData.append('city', city);
      formData.append('province', province);
      formData.append('purok', purok);
      formData.append('house_number', houseStreetAddress);
      formData.append('street', houseStreetAddress);
      formData.append('gov_id_type', govIdType);
      formData.append('gov_id_number', govIdNumber);
      formData.append('email', email);
      formData.append('password', signupPassword);
      formData.append('password_confirmation', confirmPassword);
      formData.append('id_photo', { uri: idPhoto.uri, name: idPhoto.name, type: idPhoto.type } as any);
      formData.append('facial_photo', { uri: facialPhoto.uri, name: facialPhoto.name, type: facialPhoto.type } as any);

      const data = await registerUser(formData);

      if (!data?.token) {
        throw new Error('No token received from server.');
      }

      await AsyncStorage.setItem('mobile_token', data.token);
      onAuthenticated();
    } catch (error: any) {
      const errors = error?.response?.data?.errors as Record<string, string[]> | undefined;
      const firstError = errors ? Object.values(errors)[0]?.[0] : undefined;
      const msg =
        firstError ??
        error?.response?.data?.message ??
        error?.message ??
        'Unable to create your account. Please try again.';
      Alert.alert('Registration failed', String(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.brandHeader}>
          <View style={[styles.brandIcon, { backgroundColor: colors.primary }]}>
            <Text style={[styles.brandIconText, { color: '#071A27' }]}>⌂</Text>
          </View>

          <Text style={[styles.brandTitle, { color: colors.text }]}>RESIDENT MOBILE PORTAL</Text>
          <Text style={[styles.brandSub, { color: colors.textMuted }]}>
            City Government of Kidapawan • Cotabato
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.text }]}>
          <View style={[styles.tabRow, { backgroundColor: colors.borderLight }]}>
            <Pressable
              style={[styles.tabBtn, mode === 'login' && { backgroundColor: colors.card }]}
              onPress={() => setMode('login')}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: colors.textMuted },
                  mode === 'login' && { color: colors.text },
                ]}
              >
                Sign In
              </Text>
            </Pressable>

            <Pressable
              style={[styles.tabBtn, mode === 'signup' && { backgroundColor: colors.card }]}
              onPress={() => setMode('signup')}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: colors.textMuted },
                  mode === 'signup' && { color: colors.text },
                ]}
              >
                Sign Up
              </Text>
            </Pressable>
          </View>

          {mode === 'login' ? (
            <>
              <Text style={[styles.formTitle, { color: colors.text }]}>Resident Login</Text>
              <Text style={[styles.formSubtitle, { color: colors.textSecondary }]}>
                Access your barangay services and document requests.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Email or Mobile Number</Text>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="e.g. resident@kidapawan.gov.ph"
                  placeholderTextColor={colors.textMuted}
                  value={login}
                  onChangeText={setLogin}
                  style={[
                    styles.input,
                    { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg },
                  ]}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Password</Text>
                <TextInput
                  placeholder="Enter password"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  style={[
                    styles.input,
                    { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg },
                  ]}
                />
              </View>

              <View style={styles.rememberRow}>
                <View style={styles.checkBox} />
                <Text style={[styles.rememberText, { color: colors.textSecondary }]}>
                  Remember my login credentials
                </Text>
              </View>

              <Pressable
                style={[styles.submitBtn, { backgroundColor: colors.primary }, loading && styles.submitBtnDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#071A27" />
                ) : (
                  <Text style={[styles.submitBtnText, { color: '#071A27' }]}>SIGN IN TO RESIDENT APP</Text>
                )}
              </Pressable>
            </>
          ) : (
            <>
              <Text style={[styles.formTitle, { color: colors.text }]}>Citizen Registration</Text>
              <Text style={[styles.formSubtitle, { color: colors.textSecondary }]}>
                Create your account to request certifications. Your data is protected.
              </Text>

              <View
                style={[
                  styles.sectionBlock,
                  { borderColor: colors.border, backgroundColor: colors.inputBg },
                ]}
              >
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>CITIZEN FACIAL PHOTO</Text>
                  <Text style={[styles.requiredTag, { color: colors.danger }]}>REQUIRED</Text>
                </View>

                <Pressable
                  style={[styles.uploadButton, { backgroundColor: colors.primary }]}
                  onPress={handleTakeSelfie}
                >
                  <Text style={[styles.uploadButtonText, { color: '#071A27' }]}>
                    {facialPhoto ? '✓ Selfie captured' : 'Take selfie'}
                  </Text>
                </Pressable>

               <Pressable
                  style={[styles.secondaryUploadButton, { borderColor: colors.primary }]}
                  onPress={handlePickFacialPhoto}
                    >
                    <Text style={[styles.secondaryUploadButtonText, { color: colors.primary }]}>Upload Photo</Text>
                </Pressable>

                {facialPhoto && <Image source={{ uri: facialPhoto.uri }} style={styles.idPreview} />}
              </View>

              <View
                style={[
                  styles.sectionBlock,
                  { borderColor: colors.border, backgroundColor: colors.inputBg },
                ]}
              >
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>RESIDENCE & BARANGAY</Text>
                  <Text style={[styles.requiredTag, { color: colors.danger }]}>REQUIRED</Text>
                </View>

                <OptionPicker
                  label="Barangay of Residence *"
                  value={barangayId}
                  options={barangays.map((b) => ({ label: b.name, value: String(b.id) }))}
                  onChange={setBarangayId}
                />

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Purok / Zone / Block *</Text>
                  <TextInput
                    placeholder="e.g. Purok 3A"
                    placeholderTextColor={colors.textMuted}
                    value={purok}
                    onChangeText={setPurok}
                    style={[
                      styles.input,
                      { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg },
                    ]}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>House No. / Street Address *</Text>
                  <TextInput
                    placeholder="e.g. 142 Quirino Highway"
                    placeholderTextColor={colors.textMuted}
                    value={houseStreetAddress}
                    onChangeText={setHouseStreetAddress}
                    style={[
                      styles.input,
                      { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg },
                    ]}
                  />
                </View>
              </View>

              <View
                style={[
                  styles.sectionBlock,
                  { borderColor: colors.border, backgroundColor: colors.inputBg },
                ]}
              >
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>CITIZEN IDENTITY</Text>
                  <Text style={[styles.requiredTag, { color: colors.danger }]}>REQUIRED</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>First Legal Name *</Text>
                  <TextInput
                    placeholder="e.g. Juan"
                    placeholderTextColor={colors.textMuted}
                    value={firstName}
                    onChangeText={setFirstName}
                    style={[
                      styles.input,
                      { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg },
                    ]}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Middle Legal Name *</Text>
                  <TextInput
                    placeholder="e.g. Santos"
                    placeholderTextColor={colors.textMuted}
                    value={middleName}
                    onChangeText={setMiddleName}
                    style={[
                      styles.input,
                      { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg },
                    ]}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Last Legal Name *</Text>
                  <TextInput
                    placeholder="e.g. Dela Cruz"
                    placeholderTextColor={colors.textMuted}
                    value={lastName}
                    onChangeText={setLastName}
                    style={[
                      styles.input,
                      { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg },
                    ]}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Suffix (Jr / III)</Text>
                  <TextInput
                    placeholder="e.g. Jr."
                    placeholderTextColor={colors.textMuted}
                    value={suffix}
                    onChangeText={setSuffix}
                    style={[
                      styles.input,
                      { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg },
                    ]}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Birth Date *</Text>
                  <TextInput
                    placeholder="Select date of birth"
                    placeholderTextColor={colors.textMuted}
                    value={birthdate}
                    onChangeText={setBirthdate}
                    style={[
                      styles.input,
                      { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg },
                    ]}
                    keyboardType="numbers-and-punctuation"
                  />
                </View>

                <OptionPicker label="Gender" value={gender} options={GENDER_OPTIONS} onChange={setGender} />
                <OptionPicker
                  label="Civil Status"
                  value={civilStatus}
                  options={CIVIL_STATUS_OPTIONS}
                  onChange={setCivilStatus}
                />
              </View>

              <View
                style={[
                  styles.sectionBlock,
                  { borderColor: colors.border, backgroundColor: colors.inputBg },
                ]}
              >
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>MANDATORY VALID ID VERIFICATION</Text>
                  <Text style={[styles.requiredTag, { color: colors.danger }]}>REQUIRED</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Government ID Type *</Text>
                  <TextInput
                    placeholder="Unified Multi-Purpose ID (UMID)"
                    placeholderTextColor={colors.textMuted}
                    value={govIdType}
                    onChangeText={setGovIdType}
                    style={[
                      styles.input,
                      { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg },
                    ]}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Government ID Number *</Text>
                  <TextInput
                    placeholder="e.g. CRN 011-2345678-9"
                    placeholderTextColor={colors.textMuted}
                    value={govIdNumber}
                    onChangeText={setGovIdNumber}
                    style={[
                      styles.input,
                      { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg },
                    ]}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>ID Front Scan Upload *</Text>
                  <Pressable
                    style={[styles.fileButton, { borderColor: colors.primary }]}
                    onPress={handlePickIdPhoto}
                  >
                    <Text style={[styles.fileButtonText, { color: colors.primary }]}>Choose File</Text>
                  </Pressable>

                  <Text style={[styles.fileStatus, { color: colors.textMuted }]}>
                    {idPhoto ? idPhoto.name : 'No file chosen'}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.sectionBlock,
                  { borderColor: colors.border, backgroundColor: colors.inputBg },
                ]}
              >
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>MOBILE PORTAL CREDENTIALS</Text>
                  <Text style={[styles.requiredTag, { color: colors.danger }]}>REQUIRED</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Mobile Number *</Text>
                  <TextInput
                    keyboardType="phone-pad"
                    placeholder="e.g. 0917 123 4567"
                    placeholderTextColor={colors.textMuted}
                    value={mobileNumber}
                    onChangeText={setMobileNumber}
                    style={[
                      styles.input,
                      { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg },
                    ]}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Email Address *</Text>
                  <TextInput
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholder="e.g. citizen@example.com"
                    placeholderTextColor={colors.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    style={[
                      styles.input,
                      { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg },
                    ]}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Password *</Text>
                  <TextInput
                    secureTextEntry
                    placeholder="Choose strong password"
                    placeholderTextColor={colors.textMuted}
                    value={signupPassword}
                    onChangeText={setSignupPassword}
                    style={[
                      styles.input,
                      { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg },
                    ]}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Confirm Password *</Text>
                  <TextInput
                    secureTextEntry
                    placeholder="Repeat chosen password"
                    placeholderTextColor={colors.textMuted}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    style={[
                      styles.input,
                      { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg },
                    ]}
                  />
                </View>
              </View>

              <Pressable
                style={[styles.submitBtn, { backgroundColor: colors.primary }, loading && styles.submitBtnDisabled]}
                onPress={handleSignup}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#071A27" />
                ) : (
                  <Text style={[styles.submitBtnText, { color: '#071A27' }]}>
                    COMPLETE REGISTRATION & SUBMIT ID +
                  </Text>
                )}
              </Pressable>

              <Text style={[styles.noteText, { color: colors.textMuted }]}>
                Note: You can complete additional profile details later once your basic identification document is successfully reviewed.
              </Text>

              <Text style={[styles.footerText, { color: colors.textMuted }]}>
                Already have a resident account? <Text style={{ color: colors.primary }}>Sign in here.</Text>
              </Text>
            </>
          )}

          {mode === 'login' && (
            <Text style={[styles.footerText, { color: colors.textMuted }]}>
              No resident account yet? <Text style={{ color: colors.primary }}>Register with ID</Text>
            </Text>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 18,
  },
  brandHeader: {
    alignItems: 'center',
    gap: 8,
  },
  brandIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandIconText: {
    fontSize: 30,
    fontWeight: '800',
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  brandSub: {
    fontSize: 12,
    textAlign: 'center',
  },
  card: {
    borderRadius: 20,
    padding: 18,
    gap: 14,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  tabRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 6,
  },
  formSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: -6,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: -4,
  },
  checkBox: {
    width: 14,
    height: 14,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#7EA0B9',
    backgroundColor: 'transparent',
  },
  rememberText: {
    fontSize: 12,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    minWidth: 90,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  uploadButton: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  secondaryUploadButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  secondaryUploadButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  idPreview: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    marginTop: 8,
    resizeMode: 'cover',
  },
  sectionBlock: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  requiredTag: {
    fontSize: 10,
    fontWeight: '800',
  },
  fileButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A1D2B',
  },
  fileButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  fileStatus: {
    fontSize: 11,
    marginTop: 4,
  },
  noteText: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
  submitBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 2,
  },
});