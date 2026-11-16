import { apiClient } from '@/lib/axios'
import type { ApiResponse, Interview, CreateInterviewRequest, CreateQuestionRequest } from './types'

export const getInterviews = (applicationId: number) =>
  apiClient.get<ApiResponse<Interview[]>>(`/api/applications/${applicationId}/interviews`).then(r => r.data.data)

export const createInterview = (applicationId: number, data: CreateInterviewRequest) =>
  apiClient.post<ApiResponse<Interview>>(`/api/applications/${applicationId}/interviews`, data).then(r => r.data.data)

export const addQuestion = (applicationId: number, interviewId: number, data: CreateQuestionRequest) =>
  apiClient
    .post<ApiResponse<Interview>>(`/api/applications/${applicationId}/interviews/${interviewId}/questions`, data)
    .then(r => r.data.data)

export const evaluateInterview = (applicationId: number, interviewId: number, score: number) =>
  apiClient
    .patch<ApiResponse<Interview>>(`/api/applications/${applicationId}/interviews/${interviewId}/score`, { score })
    .then(r => r.data.data)
