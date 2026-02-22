import type { MaintenanceRequest, Tenant, Review, Payment, ServiceCategory } from '@/src/types';

export const SERVICE_CATEGORIES: { key: ServiceCategory; icon: string; label: string; color: string }[] = [
  { key: 'plumbing', icon: '🔧', label: 'Plumbing', color: '#3b82f6' },
  { key: 'electrical', icon: '⚡', label: 'Electrical', color: '#f59e0b' },
  { key: 'ac', icon: '❄️', label: 'AC / HVAC', color: '#06b6d4' },
  { key: 'painting', icon: '🎨', label: 'Painting', color: '#8b5cf6' },
  { key: 'carpentry', icon: '🪚', label: 'Carpentry', color: '#f97316' },
  { key: 'cleaning', icon: '🧹', label: 'Cleaning', color: '#10b981' },
  { key: 'general', icon: '🔨', label: 'General', color: '#6b7280' },
];

export const getCategoryInfo = (cat: ServiceCategory) => SERVICE_CATEGORIES.find(c => c.key === cat);

export const PRIORITY_COLORS: Record<string, string> = {
  low: '#10b981', medium: '#f59e0b', high: '#f97316', urgent: '#ef4444',
};

export const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b', assigned: '#3b82f6', in_progress: '#8b5cf6', completed: '#10b981', cancelled: '#ef4444',
};

export const MOCK_TENANT: Tenant = {
  id: 't1', userId: 'tu1', name: 'Sarah Johnson', email: 'tenant@handygo.ae',
  phone: '+971551234567', propertyAddress: 'Marina Towers, Apt 1204, Dubai Marina', unit: '1204',
};

export const MOCK_REQUESTS: MaintenanceRequest[] = [
  { id: 'r1', tenantId: 't1', tenantName: 'Sarah Johnson', tenantPhone: '+971551234567', propertyAddress: 'Marina Towers, Apt 1204', category: 'plumbing', description: 'Kitchen sink is leaking under the cabinet. Water pooling on the floor.', images: [], priority: 'high', status: 'in_progress', createdAt: new Date(Date.now() - 3600000).toISOString(), assignedHandymanId: 'h1', assignedHandymanName: 'Mohammed Al-Rashid', handymanPhone: '+971501112233', lat: 25.0780, lng: 55.1350, estimatedCost: 250 },
  { id: 'r2', tenantId: 't1', tenantName: 'Sarah Johnson', tenantPhone: '+971551234567', propertyAddress: 'Marina Towers, Apt 1204', category: 'ac', description: 'AC unit in bedroom not cooling properly. Making unusual noise.', images: [], priority: 'medium', status: 'assigned', createdAt: new Date(Date.now() - 86400000).toISOString(), assignedHandymanId: 'h2', assignedHandymanName: 'Ahmed Hassan', handymanPhone: '+971501234567', lat: 25.0780, lng: 55.1350 },
  { id: 'r3', tenantId: 't1', tenantName: 'Sarah Johnson', tenantPhone: '+971551234567', propertyAddress: 'Marina Towers, Apt 1204', category: 'electrical', description: 'Power outlet in living room sparking when plugging in devices.', images: [], priority: 'urgent', status: 'pending', createdAt: new Date(Date.now() - 7200000).toISOString(), lat: 25.0780, lng: 55.1350 },
  { id: 'r4', tenantId: 't1', tenantName: 'Sarah Johnson', tenantPhone: '+971551234567', propertyAddress: 'Marina Towers, Apt 1204', category: 'painting', description: 'Wall paint peeling in bathroom due to moisture.', images: [], priority: 'low', status: 'completed', createdAt: new Date(Date.now() - 604800000).toISOString(), assignedHandymanId: 'h3', assignedHandymanName: 'Omar Farooq', lat: 25.0780, lng: 55.1350, completedAt: new Date(Date.now() - 259200000).toISOString() },
];

export const MOCK_REVIEWS: Review[] = [
  { id: 'rev1', requestId: 'r4', handymanId: 'h3', handymanName: 'Omar Farooq', tenantId: 't1', rating: 5, comment: 'Excellent work, very professional!', createdAt: new Date(Date.now() - 259200000).toISOString() },
];

export const MOCK_PAYMENTS: Payment[] = [
  { id: 'p1', requestId: 'r4', amount: 180, status: 'completed', createdAt: new Date(Date.now() - 259200000).toISOString(), description: 'Bathroom painting - completed' },
  { id: 'p2', requestId: 'r1', amount: 250, status: 'pending', createdAt: new Date(Date.now() - 3600000).toISOString(), description: 'Kitchen sink repair - estimated' },
];

