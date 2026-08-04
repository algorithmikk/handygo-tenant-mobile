import type { RequestPriority, ServiceCategory } from '@/src/types';

/** Map mobile category keys to request-api enum-style values. */
export function toApiCategory(category: ServiceCategory): string {
  const map: Record<ServiceCategory, string> = {
    plumbing: 'PLUMBING',
    electrical: 'ELECTRICAL',
    ac: 'AC_HVAC',
    painting: 'PAINTING',
    carpentry: 'CARPENTRY',
    cleaning: 'CLEANING',
    general: 'GENERAL',
  };
  return map[category] || 'GENERAL';
}

export function toApiPriority(priority: RequestPriority): string {
  return priority.toUpperCase();
}
