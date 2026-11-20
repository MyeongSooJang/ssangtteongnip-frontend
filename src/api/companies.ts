import { apiClient } from '@/lib/axios'
import type { ApiResponse, Company, CompanyCandidate, CompanyReview, CompanyWithStats, CreateCompanyRequest } from './types'

export const getCompanies = () =>
  apiClient.get<ApiResponse<CompanyWithStats[]>>('/api/companies').then(r => r.data.data)

export const getCompany = (id: number) =>
  apiClient.get<ApiResponse<CompanyWithStats>>(`/api/companies/${id}`).then(r => r.data.data)

export const getCompanyReviews = (id: number) =>
  apiClient.get<ApiResponse<CompanyReview[]>>(`/api/companies/${id}/reviews`).then(r => r.data.data)

export const createCompany = (data: CreateCompanyRequest) =>
  apiClient.post<ApiResponse<Company>>('/api/companies', data).then(r => r.data.data)

// 서버가 입력과 가까운 순으로 최대 10건을 정렬해 주므로 순서를 바꾸지 않는다. signal로 이전 요청을 취소한다.
export const getCompanyCandidates = (keyword: string, signal?: AbortSignal) =>
  apiClient
    .get<ApiResponse<CompanyCandidate[]>>('/api/companies/candidates', { params: { keyword }, signal })
    .then(r => r.data.data)
