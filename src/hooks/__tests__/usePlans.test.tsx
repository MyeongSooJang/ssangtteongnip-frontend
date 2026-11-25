import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { addFileEvidence, completePlan, createPlan, deletePlan, removeEvidence } from '@/api/plans'
import { useAddFileEvidence, useCompletePlan, useCreatePlan, useDeletePlan, useRemoveEvidence } from '../usePlans'

vi.mock('@/api/plans', () => ({
  getPlans: vi.fn(),
  createPlan: vi.fn(),
  revisePlan: vi.fn(),
  completePlan: vi.fn(),
  reflectPlan: vi.fn(),
  deletePlan: vi.fn(),
  addLinkEvidence: vi.fn(),
  addFileEvidence: vi.fn(),
  removeEvidence: vi.fn(),
}))

function setup() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { invalidate, wrapper }
}

describe('usePlans 변경 훅', () => {
  beforeEach(() => vi.clearAllMocks())

  it('계획을 만들면 계획 쿼리를 모두 갱신한다(모아보기와 대시보드 카드가 함께 바뀌도록)', async () => {
    vi.mocked(createPlan).mockResolvedValue({ id: 1 } as never)
    const { invalidate, wrapper } = setup()
    const { result } = renderHook(() => useCreatePlan(), { wrapper })

    await act(() => result.current.mutateAsync({
      planDate: '2026-11-25', content: 'a', category: null, doneCriteria: 'b', estimatedMinutes: 30,
    }))

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['plans'] })
  })

  it('완료하면 id와 본문으로 API를 부르고 갱신한다', async () => {
    vi.mocked(completePlan).mockResolvedValue({ id: 4 } as never)
    const { invalidate, wrapper } = setup()
    const { result } = renderHook(() => useCompletePlan(), { wrapper })

    await act(() => result.current.mutateAsync({ id: 4, data: { actualMinutes: 50 } }))

    expect(completePlan).toHaveBeenCalledWith(4, { actualMinutes: 50 })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['plans'] })
  })

  it('삭제하면 갱신한다', async () => {
    vi.mocked(deletePlan).mockResolvedValue(undefined)
    const { invalidate, wrapper } = setup()
    const { result } = renderHook(() => useDeletePlan(), { wrapper })

    await act(() => result.current.mutateAsync(4))

    expect(deletePlan).toHaveBeenCalledWith(4)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['plans'] })
  })

  it('파일을 올리고 지우면 갱신한다', async () => {
    vi.mocked(addFileEvidence).mockResolvedValue({ id: 9 } as never)
    vi.mocked(removeEvidence).mockResolvedValue(undefined)
    const { invalidate, wrapper } = setup()
    const upload = renderHook(() => useAddFileEvidence(), { wrapper })
    const remove = renderHook(() => useRemoveEvidence(), { wrapper })
    const file = new File(['x'], 'a.pdf', { type: 'application/pdf' })

    await act(() => upload.result.current.mutateAsync({ id: 4, file }))
    await act(() => remove.result.current.mutateAsync({ id: 4, evidenceId: 9 }))

    expect(addFileEvidence).toHaveBeenCalledWith(4, file)
    expect(removeEvidence).toHaveBeenCalledWith(4, 9)
    expect(invalidate).toHaveBeenCalledTimes(2)
  })
})
