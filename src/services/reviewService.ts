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

export const reviewService = {
  getReviews: async (): Promise<Review[]> => {
    try {
      // Backend requires tenantId: GET /reviews/tenant/{tenantId}
      const userJson = await SecureStore.getItemAsync('user');
      if (userJson) {
        const user = JSON.parse(userJson);
        if (user?.id) return await api.get<Review[]>(`/reviews/tenant/${user.id}`);
      }
      return await api.get<Review[]>('/reviews');
    } catch {
      return MOCK_REVIEWS;
    }
  },

  createReview: async (payload: CreateReviewPayload): Promise<Review> => {
    try {
      return await api.post<Review>('/reviews', payload);
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

