import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AxiosError } from 'axios'
import { createCompany, getCompanies, getCompanyCandidates } from '@/api/companies'
import { resolveCompanyId } from '../resolveCompany'

vi.mock('@/api/companies', () => ({
  createCompany: vi.fn(),
  getCompanies: vi.fn(),
  getCompanyCandidates: vi.fn(),
}))

const conflict = () =>
  new AxiosError('conflict', '409', undefined, undefined, { status: 409 } as never)

describe('resolveCompanyId', () => {
  beforeEach(() => vi.resetAllMocks())

  it('이미 등록된 회사는 등록 없이 companyId를 그대로 쓴다', async () => {
    expect(await resolveCompanyId({ name: '카카오', companyId: 7 })).toBe(7)
    expect(createCompany).not.toHaveBeenCalled()
  })

  it('등록 전 회사는 name만 보내 등록하고 응답 id를 쓴다', async () => {
    vi.mocked(createCompany).mockResolvedValue({ id: 11 } as never)

    expect(await resolveCompanyId({ name: '카카오뱅크', companyId: null })).toBe(11)
    expect(createCompany).toHaveBeenCalledWith({ name: '카카오뱅크' })
  })

  it('409면 후보를 다시 조회해 이미 등록된 회사의 id로 이어 간다', async () => {
    vi.mocked(createCompany).mockRejectedValue(conflict())
    vi.mocked(getCompanyCandidates).mockResolvedValue([
      { name: '카카오뱅크', listed: true, companyId: 12 },
    ])

    expect(await resolveCompanyId({ name: '카카오뱅크', companyId: null })).toBe(12)
    expect(getCompanyCandidates).toHaveBeenCalledWith('카카오뱅크')
  })

  it('409인데 후보에서 못 찾으면 회사 목록에서 이름으로 찾는다', async () => {
    vi.mocked(createCompany).mockRejectedValue(conflict())
    vi.mocked(getCompanyCandidates).mockResolvedValue([])
    vi.mocked(getCompanies).mockResolvedValue([{ id: 5, name: '내가만든회사' }] as never)

    expect(await resolveCompanyId({ name: '내가만든회사', companyId: null })).toBe(5)
  })

  it('409 외의 오류는 그대로 던진다', async () => {
    vi.mocked(createCompany).mockRejectedValue(new Error('boom'))

    await expect(resolveCompanyId({ name: 'x', companyId: null })).rejects.toThrow('boom')
  })
})
