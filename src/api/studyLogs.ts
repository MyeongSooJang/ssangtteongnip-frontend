import { apiClient } from '@/lib/axios'
import type { ApiResponse, HeatmapDay, StudyLog, StudyLogCreateRequest, StudyLogUpdateRequest, StudyStats } from './types'

const BASE = '/api/me/study-logs'

export const getStudyLog = (id: number) =>
  apiClient.get<ApiResponse<StudyLog>>(`${BASE}/${id}`).then(r => r.data.data)

export const getStudyLogs = (from: string, to: string) =>
  apiClient.get<ApiResponse<StudyLog[]>>(BASE, { params: { from, to } }).then(r => r.data.data)

export const getHeatmap = (from: string, to: string) =>
  apiClient.get<ApiResponse<HeatmapDay[]>>(`${BASE}/heatmap`, { params: { from, to } }).then(r => r.data.data)

export const getStudyStats = () =>
  apiClient.get<ApiResponse<StudyStats>>(`${BASE}/stats`).then(r => r.data.data)

export const createStudyLog = (data: StudyLogCreateRequest) =>
  apiClient.post<ApiResponse<StudyLog>>(BASE, data).then(r => r.data.data)

export const updateStudyLog = (id: number, data: StudyLogUpdateRequest) =>
  apiClient.put<ApiResponse<StudyLog>>(`${BASE}/${id}`, data).then(r => r.data.data)

export const deleteStudyLog = (id: number) =>
  apiClient.delete<ApiResponse<void>>(`${BASE}/${id}`).then(() => undefined)
