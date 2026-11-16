import { apiClient } from '@/lib/axios'
import type { ApiResponse, Company, CompanyReview, CompanyWithStats, CreateCompanyRequest } from './types'

export const getCompanies = () =>
  apiClient.get<ApiResponse<CompanyWithStats[]>>('/api/companies').then(r => r.data.data)

export const getCompany = (id: number) =>
  apiClient.get<ApiResponse<CompanyWithStats>>(`/api/companies/${id}`).then(r => r.data.data)

export const getCompanyReviews = (id: number) =>
  apiClient.get<ApiResponse<CompanyReview[]>>(`/api/companies/${id}/reviews`).then(r => r.data.data)

export const createCompany = (data: CreateCompanyRequest) =>
  apiClient.post<ApiResponse<Company>>('/api/companies', data).then(r => r.data.data)
