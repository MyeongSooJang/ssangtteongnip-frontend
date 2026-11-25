import { apiClient } from '@/lib/axios'
import type {
  ApiResponse, EvidenceDownload, Plan, PlanCompleteRequest, PlanCreateRequest, PlanDetailInput, PlanEvidence,
  PlanReflectionRequest,
} from './types'

const BASE = '/api/me/plans'

export const getPlans = (from: string, to: string) =>
  apiClient.get<ApiResponse<Plan[]>>(BASE, { params: { from, to } }).then(r => r.data.data)

export const createPlan = (data: PlanCreateRequest) =>
  apiClient.post<ApiResponse<Plan>>(BASE, data).then(r => r.data.data)

export const revisePlan = (id: number, data: PlanDetailInput) =>
  apiClient.patch<ApiResponse<Plan>>(`${BASE}/${id}`, data).then(r => r.data.data)

export const completePlan = (id: number, data: PlanCompleteRequest) =>
  apiClient.post<ApiResponse<Plan>>(`${BASE}/${id}/complete`, data).then(r => r.data.data)

export const reflectPlan = (id: number, data: PlanReflectionRequest) =>
  apiClient.patch<ApiResponse<Plan>>(`${BASE}/${id}/reflection`, data).then(r => r.data.data)

export const deletePlan = (id: number) =>
  apiClient.delete<ApiResponse<void>>(`${BASE}/${id}`).then(() => undefined)

export const addLinkEvidence = (id: number, url: string) =>
  apiClient.post<ApiResponse<PlanEvidence>>(`${BASE}/${id}/evidences`, { url }).then(r => r.data.data)

// 기본 Content-Type(application/json)이면 axios가 FormData를 JSON으로 직렬화하므로 multipart를 명시한다.
export const addFileEvidence = (id: number, file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return apiClient
    .post<ApiResponse<PlanEvidence>>(`${BASE}/${id}/evidences`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then(r => r.data.data)
}

export const removeEvidence = (id: number, evidenceId: number) =>
  apiClient.delete<ApiResponse<void>>(`${BASE}/${id}/evidences/${evidenceId}`).then(() => undefined)

// 서버는 파일을 직접 주지 않고 짧게 유효한 주소를 준다. 만료되므로 열 때마다 요청한다.
export const getEvidenceDownload = (id: number, evidenceId: number) =>
  apiClient.get<ApiResponse<EvidenceDownload>>(`${BASE}/${id}/evidences/${evidenceId}/download`).then(r => r.data.data)
