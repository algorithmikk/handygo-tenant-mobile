import * as SecureStore from 'expo-secure-store';
import { api } from '@/src/lib/api';
import type { Review } from '@/src/types';

export interface CreateReviewPayload {
  requestId: string;
  handymanId: string;
  rating: number;
  comment: string;
}

function mapReview(r: any): Review {
  return {
    id: r.reviewId || r.id || '',
    requestId: r.jobId || r.requestId || '',
    handymanId: r.handymanId || '',
    handymanName: r.handymanName || '',
    tenantId: r.tenantId || '',
    rating: r.rating || 0,
    comment: r.comment || '',
    createdAt: r.createdAt || new Date().toISOString(),
  };
}

export const reviewService = {
  getReviews: async (): Promise<Review[]> => {
    const userJson = await SecureStore.getItemAsync('user');
    if (!userJson) return [];
    const user = JSON.parse(userJson);
    const raw = await api.get<any[]>(`/reviews/tenant/${user.id}`);
    return (Array.isArray(raw) ? raw : []).map(mapReview);
  },

  createReview: async (payload: CreateReviewPayload): Promise<Review> => {
    const raw = await api.post<any>('/reviews', payload);
    return mapReview(raw);
  },
};
