import { apiClient } from '@/lib/axios'
import type { ApiResponse, Review, WriteReviewRequest } from './types'

export const getReviews = () =>
  apiClient.get<ApiResponse<Review[]>>('/api/reviews').then(r => r.data.data)

export const writeReview = (id: number, data: WriteReviewRequest) =>
  apiClient.patch<ApiResponse<Review>>(`/api/reviews/${id}`, data).then(r => r.data.data)
