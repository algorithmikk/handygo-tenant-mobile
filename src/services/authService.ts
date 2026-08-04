import * as SecureStore from 'expo-secure-store';
import { api } from '@/src/lib/api';
import type { AuthResponse, LoginRequest, Tenant, User } from '@/src/types';

function mapUser(userData: any, fallbackRole = 'TENANT'): User {
  return {
    id: userData.id,
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
    phone: userData.phoneNumber || userData.phone,
    role: userData.role || fallbackRole,
    createdAt: userData.createdAt,
  };
}

function mapTenant(raw: any): Tenant | undefined {
  if (!raw) return undefined;
  return {
    id: raw.tenantId || raw.id,
    userId: raw.userId || '',
    name: raw.name || `${raw.firstName ?? ''} ${raw.lastName ?? ''}`.trim(),
    email: raw.email || '',
    phone: raw.phoneNumber || raw.phone || '',
    propertyAddress: raw.propertyAddress || raw.buildingName || '',
    unit: raw.unitNumber || raw.unit,
    companyId: raw.companyId,
  };
}

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const raw = await api.post<any>('/auth/login', {
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
    });
    const userData = raw.user || raw;
    if (!raw.token) {
      throw new Error('No auth token returned from server');
    }
    const user = mapUser(userData);
    const tenant = mapTenant(raw.tenant);
    const res: AuthResponse = { token: raw.token, user, tenant };
    await SecureStore.setItemAsync('token', res.token);
    await SecureStore.setItemAsync('user', JSON.stringify(user));
    if (tenant) {
      await SecureStore.setItemAsync('tenant', JSON.stringify(tenant));
    }
    return res;
  },

  async applySession(raw: { token: string; user?: any; tenant?: any }): Promise<AuthResponse> {
    if (!raw?.token) throw new Error('No auth token');
    const user = mapUser(raw.user || raw);
    const tenant = mapTenant(raw.tenant);
    await SecureStore.setItemAsync('token', raw.token);
    await SecureStore.setItemAsync('user', JSON.stringify(user));
    if (tenant) await SecureStore.setItemAsync('tenant', JSON.stringify(tenant));
    return { token: raw.token, user, tenant };
  },

  async logout(): Promise<void> {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
    await SecureStore.deleteItemAsync('tenant');
  },

  async getToken(): Promise<string | null> {
    return SecureStore.getItemAsync('token');
  },

  async getStoredUser(): Promise<User | null> {
    const json = await SecureStore.getItemAsync('user');
    return json ? JSON.parse(json) : null;
  },

  async getStoredTenant(): Promise<Tenant | null> {
    const json = await SecureStore.getItemAsync('tenant');
    return json ? JSON.parse(json) : null;
  },
};
