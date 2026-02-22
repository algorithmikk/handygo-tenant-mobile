export type ServiceCategory = 'plumbing' | 'electrical' | 'ac' | 'painting' | 'carpentry' | 'cleaning' | 'general';
export type RequestStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
export type RequestPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'tenant';
}

export interface Tenant {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  propertyAddress: string;
  unit?: string;
  companyId?: string;
}

export interface MaintenanceRequest {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantPhone: string;
  companyId?: string;
  propertyAddress: string;
  category: ServiceCategory;
  description: string;
  images: string[];
  priority: RequestPriority;
  status: RequestStatus;
  createdAt: string;
  assignedHandymanId?: string;
  assignedHandymanName?: string;
  handymanPhone?: string;
  lat: number;
  lng: number;
  estimatedCost?: number;
  completedAt?: string;
}

export interface Review {
  id: string;
  requestId: string;
  handymanId: string;
  handymanName: string;
  tenantId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  requestId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  description: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  tenant?: Tenant;
}

