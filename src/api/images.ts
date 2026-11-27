import { apiClient } from '@/lib/axios'
import type { ApiResponse } from './types'

const IMAGE_PATH_PREFIXES = ['/api/images/', '/api/post-images/']

// 이미지를 올리고 본문(마크다운)에 저장할 경로(/api/images/{id})를 돌려받는다.
// 기본 Content-Type(application/json)이면 axios가 FormData를 JSON으로 직렬화하므로 multipart를 명시한다.
export const uploadImage = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return apiClient
    .post<ApiResponse<{ url: string }>>('/api/me/images', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then(r => r.data.data.url)
}

// 본문에는 도메인 없는 경로만 저장하므로, 화면에 보여 줄 때 API 주소를 붙인다. 다른 주소(외부 링크 등)는 그대로 둔다.
export function toDisplayUrl(url: string): string {
  if (!IMAGE_PATH_PREFIXES.some(prefix => url.startsWith(prefix))) return url
  const base = String(apiClient.defaults.baseURL ?? '').replace(/\/+$/, '')
  return `${base}${url}`
}
