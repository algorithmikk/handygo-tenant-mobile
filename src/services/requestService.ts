import { api } from '@/src/lib/api';
import { MOCK_REQUESTS } from '@/src/lib/mockData';
import type { MaintenanceRequest, RequestStatus, ServiceCategory, RequestPriority } from '@/src/types';

export interface CreateRequestPayload {
  category: ServiceCategory;
  description: string;
  priority: RequestPriority;
  images: string[];
}

// Map backend MaintenanceRequest to frontend format
function mapRequest(r: any): MaintenanceRequest {
  return {
    id: r.requestId || r.id,
    tenantId: r.tenantId || '',
    tenantName: r.tenantName || '',
    tenantPhone: r.tenantPhone || '',
    companyId: r.companyId,
    propertyAddress: r.location?.address || r.propertyAddress || r.area || '',
    category: ((r.category || 'general').toLowerCase().replace('ac_hvac', 'ac')) as ServiceCategory,
    description: r.description || r.title || '',
    images: r.photoUrls || r.images || [],
    priority: (r.priority || 'medium').toLowerCase() as RequestPriority,
    status: (r.status || 'pending').toLowerCase().replace(/ /g, '_') as RequestStatus,
    createdAt: r.createdAt || new Date().toISOString(),
    assignedHandymanId: r.assignedHandymanId,
    assignedHandymanName: r.assignedHandymanName,
    lat: r.location?.latitude || r.lat || 25.2048,
    lng: r.location?.longitude || r.lng || 55.2708,
    estimatedCost: r.estimatedCost,
    completedAt: r.completedAt,
  };
}

export const requestService = {
  getRequests: async (status?: RequestStatus): Promise<MaintenanceRequest[]> => {
    try {
      const path = status ? `/requests?status=${status}` : '/requests';
      const raw = await api.get<any[]>(path);
      const list = Array.isArray(raw) ? raw : [];
      return list.map(mapRequest);
    } catch {
      return status ? MOCK_REQUESTS.filter(r => r.status === status) : MOCK_REQUESTS;
    }
  },

  getRequest: async (id: string): Promise<MaintenanceRequest> => {
    try {
      const raw = await api.get<any>(`/requests/${id}`);
      return mapRequest(raw);
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
      const raw = await api.post<any>('/requests', backendPayload);
      return mapRequest(raw);
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

