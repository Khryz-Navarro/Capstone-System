import React, { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibraryAsync, requestMediaLibraryPermissionsAsync, MediaTypeOptions } from 'expo-image-picker';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
        <View style={styles.card}>
          <Text style={styles.title}>Barangay Mobile Portal</Text>

          {mode === 'login' ? (
            <>
              <TextInput autoCapitalize="none" autoCorrect={false} placeholder="Email or username" value={login} onChangeText={setLogin} style={styles.input} />
              <TextInput placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} style={styles.input} />
            </>
          ) : (
            <>
              <TextInput placeholder="First name" value={firstName} onChangeText={setFirstName} style={styles.input} />
              <TextInput placeholder="Last name" value={lastName} onChangeText={setLastName} style={styles.input} />
              <TextInput placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} style={styles.input} />
              <TextInput placeholder="Mobile number" keyboardType="phone-pad" value={mobileNumber} onChangeText={setMobileNumber} style={styles.input} />
              <TextInput placeholder="Barangay ID" value={barangayId} onChangeText={setBarangayId} style={styles.input} />
              <TextInput placeholder="City" value={city} onChangeText={setCity} style={styles.input} />
              <TextInput placeholder="Province" value={province} onChangeText={setProvince} style={styles.input} />
              <TextInput placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} style={styles.input} />
              <TextInput placeholder="Confirm password" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} style={styles.input} />
            </>
          )}

          {mode === 'signup' && (
            <View style={styles.uploadCard}>
              <Text style={styles.uploadLabel}>Upload a clear photo of your valid ID</Text>
              <Pressable style={styles.uploadButton} onPress={handlePickIdPhoto}>
                <Text style={styles.uploadButtonText}>{idPhoto ? 'Change ID photo' : 'Upload ID photo'}</Text>
              </Pressable>
              {idPhoto ? (
                <Image source={{ uri: idPhoto.uri }} style={styles.idPreview} />
              ) : (
                <Text style={styles.uploadHint}>Required for verification before your account can be used.</Text>
              )}
            </View>
          )}

          <Pressable style={styles.button} onPress={mode === 'login' ? handleLogin : handleSignup} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{mode === 'login' ? 'Sign In' : 'Create Account'}</Text>}
          </Pressable>

          <View style={styles.switchRow}>
            <Pressable style={[styles.switchButton, mode === 'login' && styles.switchButtonActive]} onPress={() => setMode('login')}>
              <Text style={[styles.switchText, mode === 'login' && styles.switchTextActive]}>Sign In</Text>
            </Pressable>
            <Pressable style={[styles.switchButton, mode === 'signup' && styles.switchButtonActive]} onPress={() => setMode('signup')}>
              <Text style={[styles.switchText, mode === 'signup' && styles.switchTextActive]}>Sign Up</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fb' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 24, gap: 12, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 },
  title: { fontSize: 24, fontWeight: '700', color: '#0f172a' },
  subtitle: { color: '#475569', marginBottom: 8 },
  switchRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  uploadCard: { borderWidth: 1, borderColor: '#dbeafe', borderRadius: 10, padding: 12, backgroundColor: '#eff6ff' },
  uploadLabel: { fontWeight: '600', color: '#1d4ed8', marginBottom: 8 },
  uploadButton: { backgroundColor: '#2563eb', borderRadius: 8, paddingVertical: 10, alignItems: 'center', marginBottom: 8 },
  uploadButtonText: { color: '#fff', fontWeight: '600' },
  uploadHint: { color: '#475569', fontSize: 13 },
  idPreview: { width: '100%', height: 160, borderRadius: 10, resizeMode: 'cover' },
  switchButton: { flex: 1, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: '#cbd5e1', alignItems: 'center' },
  switchButtonActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  switchText: { color: '#334155', fontWeight: '600' },
  switchTextActive: { color: '#fff' },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  button: { marginTop: 8, backgroundColor: '#2563eb', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
