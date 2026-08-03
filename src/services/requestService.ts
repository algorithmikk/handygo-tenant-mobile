import { api } from '@/src/lib/api';
import type { MaintenanceRequest, RequestStatus, ServiceCategory, RequestPriority } from '@/src/types';

export interface CreateRequestPayload {
  category: ServiceCategory;
  description: string;
  priority: RequestPriority;
  images: string[];
}

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
    const path = status ? `/requests?status=${status}` : '/requests';
    const raw = await api.get<any[]>(path);
    return (Array.isArray(raw) ? raw : []).map(mapRequest);
  },

  getRequest: async (id: string): Promise<MaintenanceRequest> => {
    const raw = await api.get<any>(`/requests/${id}`);
    return mapRequest(raw);
  },

  createRequest: async (payload: CreateRequestPayload): Promise<MaintenanceRequest> => {
    const backendPayload = {
      title: `${payload.category} - ${payload.description.substring(0, 50)}`,
      description: payload.description,
      category: payload.category,
      priority: payload.priority,
      photoUrls: payload.images,
    };
    const raw = await api.post<any>('/requests', backendPayload);
    return mapRequest(raw);
  },

  cancelRequest: async (id: string): Promise<void> => {
    await api.put(`/requests/${id}/cancel`);
  },

  /**
   * Upload images via request-api presigned S3 URLs, return public URLs.
   */
  uploadPhotos: async (localUris: string[]): Promise<string[]> => {
    const urls: string[] = [];
    for (const uri of localUris) {
      const presign = await api.post<{ uploadUrl: string; publicUrl: string }>('/media/presign', {
        contentType: 'image/jpeg',
        folder: 'requests',
      });
      const blob = await (await fetch(uri)).blob();
      await fetch(presign.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'image/jpeg' },
        body: blob,
      });
      urls.push(presign.publicUrl);
    }
    return urls;
  },
};
