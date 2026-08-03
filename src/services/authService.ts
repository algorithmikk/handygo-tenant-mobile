import * as SecureStore from 'expo-secure-store';
import { api } from '@/src/lib/api';
import type { AuthResponse, User } from '@/src/types';

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const raw = await api.post<any>('/auth/login', { email, password });
    const userData = raw.user || raw;
    if (!raw.token) {
      throw new Error('No auth token returned from server');
    }
    const user: User = {
      id: userData.id,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phoneNumber || userData.phone,
      role: userData.role || 'TENANT',
      createdAt: userData.createdAt,
    };
    const res: AuthResponse = { token: raw.token, user, tenant: raw.tenant };
    await SecureStore.setItemAsync('token', res.token);
    await SecureStore.setItemAsync('user', JSON.stringify(user));
    if (raw.tenant) {
      await SecureStore.setItemAsync('tenant', JSON.stringify(raw.tenant));
    }
    return res;
  },

  async logout(): Promise<void> {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
    await SecureStore.deleteItemAsync('tenant');
  },

  async getToken(): Promise<string | null> {
    return SecureStore.getItemAsync('token');
  },
};
