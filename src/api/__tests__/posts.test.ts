import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '@/lib/axios'
import { createPost, deletePost, getPost, getPosts, rewritePost } from '@/api/posts'

vi.mock('@/lib/axios', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

const MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' } }

describe('posts API', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getPosts: page를 쿼리로 보낸다', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { success: true, data: { posts: [], page: 2, pageSize: 20, totalCount: 0 } },
    })

    const result = await getPosts(2)

    expect(apiClient.get).toHaveBeenCalledWith('/api/posts', { params: { page: 2 } })
    expect(result.page).toBe(2)
  })

  it('getPost: GET /api/posts/{id}를 호출한다', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { success: true, data: { id: 7, title: '제목' } } })

    const result = await getPost(7)

    expect(apiClient.get).toHaveBeenCalledWith('/api/posts/7')
    expect(result.id).toBe(7)
  })

  it('createPost: 제목·내용·이미지 파트를 multipart로 POST한다', async () => {
    const a = new File(['a'], 'a.png', { type: 'image/png' })
    const b = new File(['b'], 'b.png', { type: 'image/png' })
    vi.mocked(apiClient.post).mockResolvedValue({ data: { success: true, data: { id: 1 } } })

    const result = await createPost({ title: '제목', content: '내용', images: [a, b] })

    const [url, body, config] = vi.mocked(apiClient.post).mock.calls[0]
    expect(url).toBe('/api/posts')
    expect((body as FormData).get('title')).toBe('제목')
    expect((body as FormData).get('content')).toBe('내용')
    expect((body as FormData).getAll('images')).toEqual([a, b])
    expect((body as FormData).has('keepImageIds')).toBe(false)
    expect(config).toEqual(MULTIPART)
    expect(result.id).toBe(1)
  })

  it('createPost: 이미지가 없으면 images 파트를 만들지 않는다', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { success: true, data: { id: 1 } } })

    await createPost({ title: '제목', content: '내용', images: [] })

    const [, body] = vi.mocked(apiClient.post).mock.calls[0]
    expect((body as FormData).has('images')).toBe(false)
  })

  it('rewritePost: 남길 이미지 id를 항목마다 파트로 붙여 PUT한다', async () => {
    const added = new File(['c'], 'c.png', { type: 'image/png' })
    vi.mocked(apiClient.put).mockResolvedValue({ data: { success: true, data: { id: 7 } } })

    await rewritePost(7, { title: '새 제목', content: '새 내용', keepImageIds: ['id-1', 'id-2'], images: [added] })

    const [url, body, config] = vi.mocked(apiClient.put).mock.calls[0]
    expect(url).toBe('/api/posts/7')
    expect((body as FormData).get('title')).toBe('새 제목')
    expect((body as FormData).getAll('keepImageIds')).toEqual(['id-1', 'id-2'])
    expect((body as FormData).getAll('images')).toEqual([added])
    expect(config).toEqual(MULTIPART)
  })

  it('rewritePost: 새 이미지가 없으면 빈 파일 파트를 보내지 않는다', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({ data: { success: true, data: { id: 7 } } })

    await rewritePost(7, { title: '제목', content: '내용', keepImageIds: ['id-1'], images: [] })

    const [, body] = vi.mocked(apiClient.put).mock.calls[0]
    expect((body as FormData).has('images')).toBe(false)
  })

  it('deletePost: DELETE /api/posts/{id}를 호출한다', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ status: 200, data: { success: true } })

    await deletePost(7)

    expect(apiClient.delete).toHaveBeenCalledWith('/api/posts/7')
  })
})
