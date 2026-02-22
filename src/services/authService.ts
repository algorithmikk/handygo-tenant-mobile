import * as SecureStore from 'expo-secure-store';
import { api } from '@/src/lib/api';
import { MOCK_TENANT } from '@/src/lib/mockData';
import type { LoginRequest, AuthResponse, User, Tenant } from '@/src/types';

const MOCK_USER: User = {
  id: 'tu1', email: 'tenant@handygo.ae', firstName: 'Sarah', lastName: 'Johnson',
  phone: '+971551234567', role: 'tenant',
};

export const authService = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    try {
      // Backend returns flat object: { id, email, firstName, lastName, name, role, phoneNumber, ... }
      const raw = await api.post<any>('/auth/login', credentials);
      const d = raw.user || raw; // Handle both flat and nested response
      const user: User = {
        id: d.id, email: d.email, firstName: d.firstName, lastName: d.lastName,
        phone: d.phoneNumber || d.phone, role: d.role || 'tenant',
      };
      const token = raw.token || `backend-${user.id}`;
      const res: AuthResponse = { token, user, tenant: raw.tenant };
      await SecureStore.setItemAsync('token', token);
      await SecureStore.setItemAsync('user', JSON.stringify(user));
      if (res.tenant) await SecureStore.setItemAsync('tenant', JSON.stringify(res.tenant));
      return res;
    } catch {
      // Mock fallback
      if (credentials.email === 'tenant@handygo.ae' && credentials.password === 'tenant123') {
        const res: AuthResponse = { token: 'mock-tenant-token', user: MOCK_USER, tenant: MOCK_TENANT };
        await SecureStore.setItemAsync('token', res.token);
        await SecureStore.setItemAsync('user', JSON.stringify(res.user));
        await SecureStore.setItemAsync('tenant', JSON.stringify(MOCK_TENANT));
        return res;
      }
      throw new Error('Invalid credentials');
    }
  },

  getStoredUser: async (): Promise<User | null> => {
    const json = await SecureStore.getItemAsync('user');
    return json ? JSON.parse(json) : null;
  },

  getStoredTenant: async (): Promise<Tenant | null> => {
    const json = await SecureStore.getItemAsync('tenant');
    return json ? JSON.parse(json) : null;
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
    await SecureStore.deleteItemAsync('tenant');
  },
};

