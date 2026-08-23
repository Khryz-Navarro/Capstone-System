import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';   // ← add this import

const getApiBaseUrl = () => {              // ← add this function
  if (__DEV__) {
    const debuggerHost = Constants.expoConfig?.hostUri?.split(':')[0];
    if (debuggerHost) {
      return `http://${debuggerHost}:8000/api`;
    }
  }
  return 'https://your-production-domain.com/api'; // production fallback
};

const API_BASE_URL = getApiBaseUrl();      // ← replaces the old hardcoded line

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
    'X-App-Type': 'mobile',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('mobile_token');
  if (token) {
    if (!config.headers) {
      (config as any).headers = {};
    }
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface UploadableFile {
  uri: string;
  name: string;
  type: string;
}

interface CreateRequestOptions {
  idPhoto?: UploadableFile | null;
  supportingDocuments?: UploadableFile[];
  notificationChannels?: Array<'email' | 'sms'>;
}

export async function loginUser(login: string, password: string, deviceName = Platform.OS) {
  const response = await api.post('/mobile/login', { login, password, device_name: deviceName });
  return response.data.data;
}

export async function registerUser(payload: Record<string, unknown> | FormData) {
  const response = await api.post('/auth/register', payload, {
    headers: payload instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
  });
  return response.data.data;
}

export async function getProfile() {
  const response = await api.get('/user');
  return response.data.data;
}

export async function updateProfile(payload: Record<string, unknown>) {
  const response = await api.put('/profile', payload);
  return response.data.data;
}

export async function getDocumentTypes() {
  const response = await api.get('/document-types');
  return response.data.data;
}

export async function listRequests() {
  const response = await api.get('/document-requests');
  return response.data.data;
}

export async function getRequest(id: number) {
  const response = await api.get(`/document-requests/${id}`);
  return response.data.data;
}

export async function createRequest(documentTypeId: number, purpose: string, options?: CreateRequestOptions) {
  const hasIdPhoto = Boolean(options?.idPhoto);
  const hasSupportingDocs = Boolean(options?.supportingDocuments?.length);
  const hasNotificationChannels = Boolean(options?.notificationChannels?.length);

  if (!hasIdPhoto && !hasSupportingDocs && !hasNotificationChannels) {
    const response = await api.post('/document-requests', { document_type_id: documentTypeId, purpose });
    return response.data.data;
  }

  const formData = new FormData();
  formData.append('document_type_id', String(documentTypeId));
  formData.append('purpose', purpose);

  if (options?.idPhoto) {
    formData.append('id_photo', options.idPhoto as any);
  }

  (options?.supportingDocuments ?? []).forEach((file) => {
    formData.append('requirements[]', file as any);
  });

  (options?.notificationChannels ?? []).forEach((channel) => {
    formData.append('notification_channels[]', channel);
  });

  const response = await api.post('/document-requests', formData, {
   
  });

  return response.data.data;
}

export async function getNotifications() {
  const response = await api.get('/notifications');
  return response.data.data;
}

export async function markNotificationRead(id: string) {
  const response = await api.post(`/notifications/${id}/read`);
  return response.data;
}

export async function markAllNotificationsRead() {
  const response = await api.post('/notifications/read-all');
  return response.data;
}

export async function logoutUser() {
  await AsyncStorage.removeItem('mobile_token');
}
