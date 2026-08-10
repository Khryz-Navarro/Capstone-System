import React, { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibraryAsync, requestMediaLibraryPermissionsAsync, MediaTypeOptions } from 'expo-image-picker';
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
import { loginUser, registerUser } from '../services/api';
import { useTheme } from '../theme/ThemeContext';

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
        {options.map((opt) => (
          <Pressable
            key={opt.value}
            style={[styles.optionBtn, { borderColor: colors.border, backgroundColor: colors.inputBg }, value === opt.value && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => onChange(opt.value)}
          >
            <Text style={[styles.optionText, { color: colors.text }, value === opt.value && styles.optionTextActive]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function AuthScreen({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const { colors } = useTheme();

  // Login fields
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');

  // Sign-up fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [gender, setGender] = useState('male');
  const [civilStatus, setCivilStatus] = useState('single');
  const [birthdate, setBirthdate] = useState('');
  const [city, setCity] = useState('Kidapawan City');
  const [province, setProvince] = useState('Cotabato');
  const [barangayId, setBarangayId] = useState('1');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [idPhoto, setIdPhoto] = useState<{ uri: string; name: string; type: string } | null>(null);

  const [loading, setLoading] = useState(false);

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

  async function handleSignup() {
    if (!firstName || !lastName || !email || !mobileNumber) {
      Alert.alert('Missing details', 'Please fill in your name, email, and mobile number.');
      return;
    }
    if (!birthdate) {
      Alert.alert('Missing details', 'Please enter your date of birth (YYYY-MM-DD).');
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

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('barangay_id', String(Number(barangayId)));
      formData.append('first_name', firstName);
      formData.append('last_name', lastName);
      formData.append('gender', gender);
      formData.append('birthdate', birthdate);
      formData.append('civil_status', civilStatus);
      formData.append('mobile_number', mobileNumber);
      formData.append('city', city);
      formData.append('province', province);
      formData.append('email', email);
      formData.append('password', signupPassword);
      formData.append('password_confirmation', confirmPassword);
      formData.append('id_photo', { uri: idPhoto.uri, name: idPhoto.name, type: idPhoto.type } as any);

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
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <View style={[styles.brandIcon, { backgroundColor: colors.primary }]}>
            <Text style={[styles.brandIconText, { color: colors.headerBg }]}>⌂</Text>
          </View>
          <Text style={[styles.brandTitle, { color: colors.text }]}>Barangay Connect</Text>
          <Text style={[styles.brandSub, { color: colors.textMuted }]}>Your digital barangay portal</Text>
        </View>

        {/* Card */}
        <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.text }]}>
          {/* Tab switcher */}
          <View style={[styles.tabRow, { backgroundColor: colors.borderLight }]}>
            <Pressable
              style={[styles.tabBtn, mode === 'login' && { backgroundColor: colors.card }]}
              onPress={() => setMode('login')}
            >
              <Text style={[styles.tabText, { color: colors.textMuted }, mode === 'login' && { color: colors.text }]}>Sign In</Text>
            </Pressable>
            <Pressable
              style={[styles.tabBtn, mode === 'signup' && { backgroundColor: colors.card }]}
              onPress={() => setMode('signup')}
            >
              <Text style={[styles.tabText, { color: colors.textMuted }, mode === 'signup' && { color: colors.text }]}>Sign Up</Text>
            </Pressable>
          </View>

          <Text style={[styles.formTitle, { color: colors.text }]}>
            {mode === 'login' ? 'Welcome back!' : 'Create your account'}
          </Text>
          <Text style={[styles.formSubtitle, { color: colors.textSecondary }]}>
            {mode === 'login'
              ? 'Sign in to access your barangay services.'
              : 'Fill in your details to register as a resident.'}
          </Text>

          {mode === 'login' ? (
            <>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Email or Username</Text>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="juan@example.com"
                  placeholderTextColor={colors.textMuted}
                  value={login}
                  onChangeText={setLogin}
                  style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg }]}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Password</Text>
                <TextInput
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg }]}
                />
              </View>
            </>
          ) : (
            <>
              <View style={styles.nameRow}>
                <View style={[styles.inputGroup, styles.halfInput]}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>First Name</Text>
                  <TextInput placeholder="Juan" placeholderTextColor={colors.textMuted} value={firstName} onChangeText={setFirstName} style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg }]} />
                </View>
                <View style={[styles.inputGroup, styles.halfInput]}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Last Name</Text>
                  <TextInput placeholder="Dela Cruz" placeholderTextColor={colors.textMuted} value={lastName} onChangeText={setLastName} style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg }]} />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Email</Text>
                <TextInput autoCapitalize="none" keyboardType="email-address" placeholder="juan@example.com" placeholderTextColor={colors.textMuted} value={email} onChangeText={setEmail} style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg }]} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Mobile Number</Text>
                <TextInput keyboardType="phone-pad" placeholder="09XX XXX XXXX" placeholderTextColor={colors.textMuted} value={mobileNumber} onChangeText={setMobileNumber} style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg }]} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Date of Birth (YYYY-MM-DD)</Text>
                <TextInput
                  placeholder="1995-06-15"
                  placeholderTextColor={colors.textMuted}
                  value={birthdate}
                  onChangeText={setBirthdate}
                  style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg }]}
                  keyboardType="numbers-and-punctuation"
                />
              </View>

              <OptionPicker label="Gender" value={gender} options={GENDER_OPTIONS} onChange={setGender} />

              <OptionPicker label="Civil Status" value={civilStatus} options={CIVIL_STATUS_OPTIONS} onChange={setCivilStatus} />

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Barangay ID</Text>
                <TextInput placeholder="1" placeholderTextColor={colors.textMuted} value={barangayId} onChangeText={setBarangayId} style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg }]} keyboardType="numeric" />
              </View>

              <View style={styles.nameRow}>
                <View style={[styles.inputGroup, styles.halfInput]}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>City</Text>
                  <TextInput placeholder="City" placeholderTextColor={colors.textMuted} value={city} onChangeText={setCity} style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg }]} />
                </View>
                <View style={[styles.inputGroup, styles.halfInput]}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Province</Text>
                  <TextInput placeholder="Province" placeholderTextColor={colors.textMuted} value={province} onChangeText={setProvince} style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg }]} />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Password</Text>
                <TextInput placeholder="••••••••" placeholderTextColor={colors.textMuted} secureTextEntry value={signupPassword} onChangeText={setSignupPassword} style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg }]} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Confirm Password</Text>
                <TextInput placeholder="••••••••" placeholderTextColor={colors.textMuted} secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg }]} />
              </View>

              {/* ID Photo upload */}
              <View style={[styles.uploadSection, { borderColor: colors.warningBg, backgroundColor: colors.warningBg }]}>
                <Text style={[styles.uploadTitle, { color: colors.warningText }]}>📷  Valid ID Photo</Text>
                <Text style={[styles.uploadHint, { color: colors.textSecondary }]}>Upload a clear photo of any government-issued ID. Required for account verification.</Text>
                <Pressable style={[styles.uploadBtn, { backgroundColor: colors.primary }]} onPress={handlePickIdPhoto}>
                  <Text style={[styles.uploadBtnText, { color: colors.headerText }]}>{idPhoto ? '✓ Change ID photo' : '↑ Upload ID photo'}</Text>
                </Pressable>
                {idPhoto && <Image source={{ uri: idPhoto.uri }} style={styles.idPreview} />}
              </View>
            </>
          )}

          <Pressable
            style={[styles.submitBtn, { backgroundColor: colors.primary }, loading && styles.submitBtnDisabled]}
            onPress={mode === 'login' ? handleLogin : handleSignup}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={colors.headerText} />
              : <Text style={[styles.submitBtnText, { color: colors.headerText }]}>{mode === 'login' ? 'Sign In' : 'Create Account'}</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 24 },
  brandHeader: { alignItems: 'center', gap: 8 },
  brandIcon: {
    width: 56, height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  brandIconText: { fontSize: 28 },
  brandTitle: { fontSize: 22, fontWeight: '800' },
  brandSub: { fontSize: 13 },
  card: {
    borderRadius: 20, padding: 24, gap: 14,
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 8,
  },
  tabRow: {
    flexDirection: 'row',
    borderRadius: 12, padding: 4,
  },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  tabText: { fontSize: 14, fontWeight: '600' },
  formTitle: { fontSize: 18, fontWeight: '800', marginTop: 4 },
  formSubtitle: { fontSize: 13, marginTop: -8 },
  nameRow: { flexDirection: 'row', gap: 10 },
  halfInput: { flex: 1 },
  inputGroup: { gap: 5 },
  inputLabel: { fontSize: 12, fontWeight: '600' },
  input: {
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 11, fontSize: 14,
  },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1,
  },
  optionText: { fontSize: 13, fontWeight: '600' },
  optionTextActive: { color: '#FFFFFF' },
  uploadSection: {
    borderWidth: 1, borderRadius: 12,
    padding: 14, gap: 8,
  },
  uploadTitle: { fontSize: 13, fontWeight: '700' },
  uploadHint: { fontSize: 12, lineHeight: 17 },
  uploadBtn: {
    borderRadius: 8,
    paddingVertical: 10, alignItems: 'center',
  },
  uploadBtnText: { fontWeight: '700', fontSize: 13 },
  idPreview: { width: '100%', height: 160, borderRadius: 10, resizeMode: 'cover' },
  submitBtn: {
    borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginTop: 4,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { fontWeight: '800', fontSize: 15 },
});
