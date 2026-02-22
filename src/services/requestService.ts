import { api } from '@/src/lib/api';
import { MOCK_REQUESTS } from '@/src/lib/mockData';
import type { MaintenanceRequest, RequestStatus, ServiceCategory, RequestPriority } from '@/src/types';

export interface CreateRequestPayload {
  category: ServiceCategory;
  description: string;
  priority: RequestPriority;
  images: string[];
}

export const requestService = {
  getRequests: async (status?: RequestStatus): Promise<MaintenanceRequest[]> => {
    try {
      const path = status ? `/requests?status=${status}` : '/requests';
      return await api.get<MaintenanceRequest[]>(path);
    } catch {
      return status ? MOCK_REQUESTS.filter(r => r.status === status) : MOCK_REQUESTS;
    }
  },

  getRequest: async (id: string): Promise<MaintenanceRequest> => {
    try {
      return await api.get<MaintenanceRequest>(`/requests/${id}`);
    } catch {
      const found = MOCK_REQUESTS.find(r => r.id === id);
      if (!found) throw new Error('Request not found');
      return found;
    }
  },

  createRequest: async (payload: CreateRequestPayload): Promise<MaintenanceRequest> => {
    try {
      // Map frontend payload to backend CreateRequestDTO fields
      const backendPayload = {
        title: `${payload.category} - ${payload.description.substring(0, 50)}`,
        description: payload.description,
        category: payload.category,
        priority: payload.priority,
        photoUrls: payload.images,
      };
      return await api.post<MaintenanceRequest>('/requests', backendPayload);
    } catch {
      const newReq: MaintenanceRequest = {
        id: 'r' + Date.now(),
        tenantId: 't1',
        tenantName: 'Sarah Johnson',
        tenantPhone: '+971551234567',
        propertyAddress: 'Marina Towers, Apt 1204',
        category: payload.category,
        description: payload.description,
        images: payload.images,
        priority: payload.priority,
        status: 'pending',
        createdAt: new Date().toISOString(),
        lat: 25.0780,
        lng: 55.1350,
      };
      MOCK_REQUESTS.unshift(newReq);
      return newReq;
    }
  },

  cancelRequest: async (id: string): Promise<void> => {
    try {
      await api.put(`/requests/${id}/cancel`);
    } catch {
      const req = MOCK_REQUESTS.find(r => r.id === id);
      if (req) req.status = 'cancelled';
    }
  },
};

