import { apiClient } from '@/lib/axios'
import type { ApiResponse, Post, PostCreateInput, PostPage, PostRewriteInput } from './types'

const BASE = '/api/posts'

// 기본 Content-Type(application/json)이면 axios가 FormData를 JSON으로 직렬화하므로 multipart를 명시한다.
const MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' } }

// 서버는 빈 파일 파트를 EMPTY_FILE(400)로 거절하므로 고른 파일이 있을 때만 images 파트를 붙인다.
function toFormData({ title, content, images }: PostCreateInput, keepImageIds: string[] = []) {
  const formData = new FormData()
  formData.append('title', title)
  formData.append('content', content)
  keepImageIds.forEach(id => formData.append('keepImageIds', id))
  images.forEach(file => formData.append('images', file))
  return formData
}

export const getPosts = (page: number) =>
  apiClient.get<ApiResponse<PostPage>>(BASE, { params: { page } }).then(r => r.data.data)

export const getPost = (id: number) =>
  apiClient.get<ApiResponse<Post>>(`${BASE}/${id}`).then(r => r.data.data)

export const createPost = (input: PostCreateInput) =>
  apiClient.post<ApiResponse<Post>>(BASE, toFormData(input), MULTIPART).then(r => r.data.data)

// keepImageIds를 보내지 않으면 서버가 기존 이미지를 모두 지우므로, 남길 이미지는 반드시 모두 넘긴다.
export const rewritePost = (id: number, input: PostRewriteInput) =>
  apiClient.put<ApiResponse<Post>>(`${BASE}/${id}`, toFormData(input, input.keepImageIds), MULTIPART).then(r => r.data.data)

export const deletePost = (id: number) =>
  apiClient.delete<ApiResponse<void>>(`${BASE}/${id}`).then(() => undefined)
