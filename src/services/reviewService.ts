import * as SecureStore from 'expo-secure-store';
import { api } from '@/src/lib/api';
import { MOCK_REVIEWS } from '@/src/lib/mockData';
import type { Review } from '@/src/types';

export interface CreateReviewPayload {
  requestId: string;
  handymanId: string;
  rating: number;
  comment: string;
}

// Map backend Review to frontend format
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
    try {
      // Backend requires tenantId: GET /reviews/tenant/{tenantId}
      const userJson = await SecureStore.getItemAsync('user');
      if (userJson) {
        const user = JSON.parse(userJson);
        if (user?.id) {
          const raw = await api.get<any[]>(`/reviews/tenant/${user.id}`);
          return (Array.isArray(raw) ? raw : []).map(mapReview);
        }
      }
      const raw = await api.get<any[]>('/reviews');
      return (Array.isArray(raw) ? raw : []).map(mapReview);
    } catch {
      return MOCK_REVIEWS;
    }
  },

  createReview: async (payload: CreateReviewPayload): Promise<Review> => {
    try {
      const raw = await api.post<any>('/reviews', payload);
      return mapReview(raw);
    } catch {
      const newReview: Review = {
        id: 'rev' + Date.now(),
        requestId: payload.requestId,
        handymanId: payload.handymanId,
        handymanName: 'Handyman',
        tenantId: 't1',
        rating: payload.rating,
        comment: payload.comment,
        createdAt: new Date().toISOString(),
      };
      return newReview;
    }
  },
};

