import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '@/lib/axios'
import { changeMyNickname, getMyNickname } from '@/api/nickname'

vi.mock('@/lib/axios', () => ({
  apiClient: { get: vi.fn(), patch: vi.fn() },
}))

describe('nickname API', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getMyNickname: GET /api/me/nickname을 호출하고 미설정이면 null을 돌려준다', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { success: true, data: { nickname: null } } })

    const result = await getMyNickname()

    expect(apiClient.get).toHaveBeenCalledWith('/api/me/nickname')
    expect(result.nickname).toBeNull()
  })

  it('changeMyNickname: PATCH /api/me/nickname에 닉네임을 보낸다', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({ status: 200, data: { success: true } })

    await changeMyNickname('취준생1')

    expect(apiClient.patch).toHaveBeenCalledWith('/api/me/nickname', { nickname: '취준생1' })
  })
})
