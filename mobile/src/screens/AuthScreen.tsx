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

export default function AuthScreen({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [city, setCity] = useState('Kidapawan City');
  const [province, setProvince] = useState('Cotabato');
  const [barangayId, setBarangayId] = useState('1');
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
      Alert.alert('Login failed', error?.response?.data?.message || 'Unable to sign in.');
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
    if (!email || !password || !firstName || !lastName || !mobileNumber) {
      Alert.alert('Missing details', 'Please fill in your name, email, mobile number, and password.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Please confirm your password.');
      return;
    }
    if (!idPhoto) {
      Alert.alert('ID photo required', 'Please upload a clear photo of your valid ID before creating your account.');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('barangay_id', String(Number(barangayId)));
      formData.append('first_name', firstName);
      formData.append('last_name', lastName);
      formData.append('gender', 'male');
      formData.append('birthdate', '2000-01-01');
      formData.append('civil_status', 'single');
      formData.append('mobile_number', mobileNumber);
      formData.append('city', city);
      formData.append('province', province);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('password_confirmation', confirmPassword);
      formData.append('id_photo', { uri: idPhoto.uri, name: idPhoto.name, type: idPhoto.type } as any);
      const data = await registerUser(formData);
      await AsyncStorage.setItem('mobile_token', data.token || '');
      onAuthenticated();
    } catch (error: any) {
      Alert.alert('Registration failed', error?.response?.data?.message || 'Unable to create your account.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <View style={styles.brandIcon}>
            <Text style={styles.brandIconText}>⌂</Text>
          </View>
          <Text style={styles.brandTitle}>Barangay Connect</Text>
          <Text style={styles.brandSub}>Your digital barangay portal</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {/* Tab switcher */}
          <View style={styles.tabRow}>
            <Pressable
              style={[styles.tabBtn, mode === 'login' && styles.tabBtnActive]}
              onPress={() => setMode('login')}
            >
              <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>Sign In</Text>
            </Pressable>
            <Pressable
              style={[styles.tabBtn, mode === 'signup' && styles.tabBtnActive]}
              onPress={() => setMode('signup')}
            >
              <Text style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}>Sign Up</Text>
            </Pressable>
          </View>

          <Text style={styles.formTitle}>
            {mode === 'login' ? 'Welcome back!' : 'Create your account'}
          </Text>
          <Text style={styles.formSubtitle}>
            {mode === 'login'
              ? 'Sign in to access your barangay services.'
              : 'Fill in your details to register as a resident.'}
          </Text>

          {mode === 'login' ? (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email or Username</Text>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="juan@example.com"
                  placeholderTextColor="#9CA3AF"
                  value={login}
                  onChangeText={setLogin}
                  style={styles.input}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  style={styles.input}
                />
              </View>
            </>
          ) : (
            <>
              <View style={styles.nameRow}>
                <View style={[styles.inputGroup, styles.halfInput]}>
                  <Text style={styles.inputLabel}>First Name</Text>
                  <TextInput placeholder="Juan" placeholderTextColor="#9CA3AF" value={firstName} onChangeText={setFirstName} style={styles.input} />
                </View>
                <View style={[styles.inputGroup, styles.halfInput]}>
                  <Text style={styles.inputLabel}>Last Name</Text>
                  <TextInput placeholder="Dela Cruz" placeholderTextColor="#9CA3AF" value={lastName} onChangeText={setLastName} style={styles.input} />
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput autoCapitalize="none" keyboardType="email-address" placeholder="juan@example.com" placeholderTextColor="#9CA3AF" value={email} onChangeText={setEmail} style={styles.input} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mobile Number</Text>
                <TextInput keyboardType="phone-pad" placeholder="09XX XXX XXXX" placeholderTextColor="#9CA3AF" value={mobileNumber} onChangeText={setMobileNumber} style={styles.input} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Barangay ID</Text>
                <TextInput placeholder="1" placeholderTextColor="#9CA3AF" value={barangayId} onChangeText={setBarangayId} style={styles.input} keyboardType="numeric" />
              </View>
              <View style={styles.nameRow}>
                <View style={[styles.inputGroup, styles.halfInput]}>
                  <Text style={styles.inputLabel}>City</Text>
                  <TextInput placeholder="City" placeholderTextColor="#9CA3AF" value={city} onChangeText={setCity} style={styles.input} />
                </View>
                <View style={[styles.inputGroup, styles.halfInput]}>
                  <Text style={styles.inputLabel}>Province</Text>
                  <TextInput placeholder="Province" placeholderTextColor="#9CA3AF" value={province} onChangeText={setProvince} style={styles.input} />
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput placeholder="••••••••" placeholderTextColor="#9CA3AF" secureTextEntry value={password} onChangeText={setPassword} style={styles.input} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <TextInput placeholder="••••••••" placeholderTextColor="#9CA3AF" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} style={styles.input} />
              </View>

              {/* ID Photo upload */}
              <View style={styles.uploadSection}>
                <Text style={styles.uploadTitle}>📷  Valid ID Photo</Text>
                <Text style={styles.uploadHint}>Upload a clear photo of any government-issued ID. Required for account verification.</Text>
                <Pressable style={styles.uploadBtn} onPress={handlePickIdPhoto}>
                  <Text style={styles.uploadBtnText}>{idPhoto ? '✓ Change ID photo' : '↑ Upload ID photo'}</Text>
                </Pressable>
                {idPhoto && <Image source={{ uri: idPhoto.uri }} style={styles.idPreview} />}
              </View>
            </>
          )}

          <Pressable style={[styles.submitBtn, loading && styles.submitBtnDisabled]} onPress={mode === 'login' ? handleLogin : handleSignup} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#1a1a2e" />
              : <Text style={styles.submitBtnText}>{mode === 'login' ? 'Sign In' : 'Create Account'}</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 24 },
  brandHeader: { alignItems: 'center', gap: 8 },
  brandIcon: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: '#C9A227', alignItems: 'center', justifyContent: 'center',
  },
  brandIconText: { fontSize: 28, color: '#fff' },
  brandTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  brandSub: { fontSize: 13, color: '#9CA3AF' },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, gap: 14,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 8,
  },
  tabRow: {
    flexDirection: 'row', backgroundColor: '#F3F4F6',
    borderRadius: 12, padding: 4,
  },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
  tabTextActive: { color: '#0D1B2A' },
  formTitle: { fontSize: 18, fontWeight: '800', color: '#0D1B2A', marginTop: 4 },
  formSubtitle: { fontSize: 13, color: '#6B7280', marginTop: -8 },
  nameRow: { flexDirection: 'row', gap: 10 },
  halfInput: { flex: 1 },
  inputGroup: { gap: 5 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#374151' },
  input: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 11, fontSize: 14,
    color: '#0D1B2A', backgroundColor: '#F9FAFB',
  },
  uploadSection: {
    borderWidth: 1, borderColor: '#FDE68A', borderRadius: 12,
    padding: 14, backgroundColor: '#FFFBEB', gap: 8,
  },
  uploadTitle: { fontSize: 13, fontWeight: '700', color: '#92400E' },
  uploadHint: { fontSize: 12, color: '#6B7280', lineHeight: 17 },
  uploadBtn: {
    backgroundColor: '#C9A227', borderRadius: 8,
    paddingVertical: 10, alignItems: 'center',
  },
  uploadBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  idPreview: { width: '100%', height: 160, borderRadius: 10, resizeMode: 'cover' },
  submitBtn: {
    backgroundColor: '#C9A227', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginTop: 4,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: '#1a1a2e', fontWeight: '800', fontSize: 15 },
});
