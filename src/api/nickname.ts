import { apiClient } from '@/lib/axios'
import type { ApiResponse, NicknameResponse } from './types'

const BASE = '/api/me/nickname'

export const getMyNickname = () =>
  apiClient.get<ApiResponse<NicknameResponse>>(BASE).then(r => r.data.data)

export const changeMyNickname = (nickname: string) =>
  apiClient.patch<ApiResponse<void>>(BASE, { nickname }).then(() => undefined)
