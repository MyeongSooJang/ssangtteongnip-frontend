import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '@/lib/axios'
import { getCompanies, createCompany, getCompanyCandidates } from '@/api/companies'

vi.mock('@/lib/axios', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}))

describe('companies API', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getCompanies: GET /api/companies를 호출한다', async () => {
    const mockData = [{ id: 1, name: '카카오', industry: 'IT', website: 'https://kakao.com', createdAt: '' }]
    vi.mocked(apiClient.get).mockResolvedValue({ data: { success: true, data: mockData } })

    const result = await getCompanies()

    expect(apiClient.get).toHaveBeenCalledWith('/api/companies')
    expect(result).toEqual(mockData)
  })

  it('createCompany: POST /api/companies를 호출한다', async () => {
    const req = { name: '카카오', industry: 'IT', website: 'https://kakao.com' }
    const mockData = { id: 1, ...req, createdAt: '' }
    vi.mocked(apiClient.post).mockResolvedValue({ data: { success: true, data: mockData } })

    const result = await createCompany(req)

    expect(apiClient.post).toHaveBeenCalledWith('/api/companies', req)
    expect(result.name).toBe('카카오')
  })

  it('getCompanyCandidates: keyword와 signal을 실어 후보를 조회하고 서버 순서를 유지한다', async () => {
    const candidates = [
      { name: '카카오', listed: true, companyId: 7 },
      { name: '카카오뱅크', listed: true, companyId: null },
    ]
    vi.mocked(apiClient.get).mockResolvedValue({ data: { success: true, data: candidates } })
    const signal = new AbortController().signal

    const result = await getCompanyCandidates('카카오', signal)

    expect(apiClient.get).toHaveBeenCalledWith('/api/companies/candidates', { params: { keyword: '카카오' }, signal })
    expect(result).toEqual(candidates)
  })
})
