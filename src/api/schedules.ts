import { apiClient } from '@/lib/axios'
import type { ApiResponse, Schedule, CreateScheduleRequest } from './types'

export const getSchedules = (params?: { from?: string; to?: string }) =>
  apiClient.get<ApiResponse<Schedule[]>>('/api/schedules', { params }).then(r => r.data.data)

export const createSchedule = (data: CreateScheduleRequest) =>
  apiClient.post<ApiResponse<Schedule>>('/api/schedules', data).then(r => r.data.data)
