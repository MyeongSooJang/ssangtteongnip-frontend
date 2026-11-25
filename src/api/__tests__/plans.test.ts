import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '@/lib/axios'
import {
  addFileEvidence, addLinkEvidence, completePlan, createPlan, deletePlan, getEvidenceDownload, getPlans,
  reflectPlan, removeEvidence, revisePlan,
} from '@/api/plans'

vi.mock('@/lib/axios', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

const ok = <T,>(data: T) => ({ data: { success: true, data } })
const detail = { content: '자료구조 복습', category: 'SKILL' as const, doneCriteria: '문제 5개 풀기', estimatedMinutes: 90 }

describe('plans API', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getPlans: from, to 쿼리 파라미터로 호출한다', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(ok([]))

    const result = await getPlans('2026-11-19', '2026-11-26')

    expect(apiClient.get).toHaveBeenCalledWith('/api/me/plans', { params: { from: '2026-11-19', to: '2026-11-26' } })
    expect(result).toEqual([])
  })

  it('createPlan: POST /api/me/plans로 날짜와 내용을 보낸다', async () => {
    vi.mocked(apiClient.post).mockResolvedValue(ok({ id: 1 }))

    const result = await createPlan({ planDate: '2026-11-25', ...detail })

    expect(apiClient.post).toHaveBeenCalledWith('/api/me/plans', { planDate: '2026-11-25', ...detail })
    expect(result).toEqual({ id: 1 })
  })

  it('revisePlan: PATCH /api/me/plans/{id}', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue(ok({ id: 3 }))

    await revisePlan(3, detail)

    expect(apiClient.patch).toHaveBeenCalledWith('/api/me/plans/3', detail)
  })

  it('completePlan: POST /api/me/plans/{id}/complete', async () => {
    vi.mocked(apiClient.post).mockResolvedValue(ok({ id: 3 }))

    await completePlan(3, { actualMinutes: 80, memo: '끝' })

    expect(apiClient.post).toHaveBeenCalledWith('/api/me/plans/3/complete', { actualMinutes: 80, memo: '끝' })
  })

  it('reflectPlan: PATCH /api/me/plans/{id}/reflection', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue(ok({ id: 3 }))

    await reflectPlan(3, { missReason: 'TOO_BIG', memo: '범위가 컸다' })

    expect(apiClient.patch).toHaveBeenCalledWith('/api/me/plans/3/reflection', { missReason: 'TOO_BIG', memo: '범위가 컸다' })
  })

  it('deletePlan: DELETE 후 아무것도 돌려주지 않는다', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ data: { success: true } })

    const result = await deletePlan(3)

    expect(apiClient.delete).toHaveBeenCalledWith('/api/me/plans/3')
    expect(result).toBeUndefined()
  })

  it('addLinkEvidence: JSON 본문 { url }로 보낸다', async () => {
    vi.mocked(apiClient.post).mockResolvedValue(ok({ id: 9 }))

    await addLinkEvidence(3, 'https://github.com/a/b')

    expect(apiClient.post).toHaveBeenCalledWith('/api/me/plans/3/evidences', { url: 'https://github.com/a/b' })
  })

  it('addFileEvidence: file 이름의 FormData를 multipart로 명시해 보낸다', async () => {
    vi.mocked(apiClient.post).mockResolvedValue(ok({ id: 10 }))
    const file = new File(['x'], 'result.pdf', { type: 'application/pdf' })

    await addFileEvidence(3, file)

    const [url, body, config] = vi.mocked(apiClient.post).mock.calls[0]
    expect(url).toBe('/api/me/plans/3/evidences')
    expect((body as FormData).get('file')).toBe(file)
    expect(config).toEqual({ headers: { 'Content-Type': 'multipart/form-data' } })
  })

  it('removeEvidence: DELETE /api/me/plans/{id}/evidences/{evidenceId}', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ data: { success: true } })

    await removeEvidence(3, 9)

    expect(apiClient.delete).toHaveBeenCalledWith('/api/me/plans/3/evidences/9')
  })

  it('getEvidenceDownload: 임시 주소를 받아온다', async () => {
    const download = { url: 'https://s3/x', fileName: 'a.pdf', expiresAt: '2026-11-25T10:00:00Z' }
    vi.mocked(apiClient.get).mockResolvedValue(ok(download))

    const result = await getEvidenceDownload(3, 9)

    expect(apiClient.get).toHaveBeenCalledWith('/api/me/plans/3/evidences/9/download')
    expect(result).toEqual(download)
  })
})
