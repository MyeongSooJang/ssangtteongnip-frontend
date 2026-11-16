import { apiClient } from '@/lib/axios'
import type {
  ApiResponse,
  EmailVerificationConfirmRequest,
  EmailVerificationRequest,
  LoginRequest,
  SignupRequest,
  TokenResponse,
} from './types'

export const sendEmailVerification = (data: EmailVerificationRequest) =>
  apiClient.post<ApiResponse<void>>('/api/auth/email-verifications', data).then(() => undefined)

export const confirmEmailVerification = (data: EmailVerificationConfirmRequest) =>
  apiClient.post<ApiResponse<void>>('/api/auth/email-verifications/confirm', data).then(() => undefined)

export const signup = (data: SignupRequest) =>
  apiClient.post<ApiResponse<TokenResponse>>('/api/auth/signup', data).then(r => r.data.data)

export const login = (data: LoginRequest) =>
  apiClient.post<ApiResponse<TokenResponse>>('/api/auth/login', data).then(r => r.data.data)
