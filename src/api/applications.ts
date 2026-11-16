import { apiClient } from '@/lib/axios'
import type { ApiResponse, Application, ApplicationStatus, CreateApplicationRequest, JobSite, JobSiteStat, ResumeView } from './types'

export const getApplications = () =>
  apiClient.get<ApiResponse<Application[]>>('/api/applications').then(r => r.data.data)

export const getApplication = (id: number) =>
  apiClient.get<ApiResponse<Application>>(`/api/applications/${id}`).then(r => r.data.data)

export const getJobSiteStats = () =>
  apiClient.get<ApiResponse<JobSiteStat[]>>('/api/applications/stats/job-site').then(r => r.data.data)

export const createApplication = (data: CreateApplicationRequest) =>
  apiClient.post<ApiResponse<Application>>('/api/applications', data).then(r => r.data.data)

export const updateApplicationJobSite = (id: number, jobSite: JobSite) =>
  apiClient.patch<ApiResponse<Application>>(`/api/applications/${id}/job-site`, { jobSite }).then(r => r.data.data)

export const updateApplicationDeadline = (id: number, deadline: string) =>
  apiClient.patch<ApiResponse<Application>>(`/api/applications/${id}/deadline`, { deadline }).then(r => r.data.data)

export const updateApplicationResumeView = (id: number, resumeView: ResumeView) =>
  apiClient.patch<ApiResponse<Application>>(`/api/applications/${id}/resume-view`, { resumeView }).then(r => r.data.data)

export const updateApplicationStatus = (id: number, status: ApplicationStatus) =>
  apiClient.patch<ApiResponse<Application>>(`/api/applications/${id}/status`, { status }).then(r => r.data.data)
