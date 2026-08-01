import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';

const API_BASE_URL = 'http://localhost:8000/api';

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
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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

export async function createRequest(documentTypeId: number, purpose: string) {
  const response = await api.post('/document-requests', { document_type_id: documentTypeId, purpose });
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
