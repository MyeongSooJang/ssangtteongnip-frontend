import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Plan } from '@/api/types'
import PlanPeriodView from '../PlanPeriodView'

const state = vi.hoisted(() => ({
  result: {} as { data?: unknown; isLoading?: boolean; isError?: boolean; refetch?: () => void },
  calls: [] as Array<[string, string]>,
}))

vi.mock('@/hooks/usePlans', () => ({
  usePlans: (from: string, to: string) => {
    state.calls.push([from, to])
    return state.result
  },
  useDeletePlan: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCreatePlan: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRevisePlan: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCompletePlan: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useReflectPlan: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAddLinkEvidence: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAddFileEvidence: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRemoveEvidence: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))
vi.mock('@/api/plans', () => ({ getEvidenceDownload: vi.fn() }))

const TODAY = '2026-11-25'

function plan(overrides: Partial<Plan>): Plan {
  return {
    id: 1, planDate: '2026-11-24', content: '자료구조 복습', category: null, doneCriteria: '문제 5개', estimatedMinutes: 60,
    timeSlot: null, place: null, firstAction: null, status: 'DONE', actualMinutes: 50, missReason: null, memo: null,
    completedAt: null, evidences: [], ...overrides,
  }
}

describe('PlanPeriodView', () => {
  beforeEach(() => {
    state.calls = []
    state.result = { data: [], isLoading: false, isError: false }
  })

  it('기본은 어제까지 지난 7일을 조회한다', () => {
    render(<PlanPeriodView today={TODAY} />)

    expect(state.calls.at(-1)).toEqual(['2026-11-18', '2026-11-24'])
  })

  it('30일로 바꾸면 그 기간을 조회한다', async () => {
    const user = userEvent.setup()
    render(<PlanPeriodView today={TODAY} />)

    await user.click(screen.getByRole('tab', { name: '지난 30일' }))

    expect(state.calls.at(-1)).toEqual(['2026-10-26', '2026-11-24'])
    expect(screen.getByRole('tab', { name: '지난 30일' })).toHaveAttribute('aria-selected', 'true')
  })

  it('계획이 없으면 빈 안내를 보여준다', () => {
    render(<PlanPeriodView today={TODAY} />)

    expect(screen.getByText('이 기간에 세운 계획이 없습니다.')).toBeInTheDocument()
  })

  it('요약 한 줄에 개수와 목표·실제 시간을 보여준다', () => {
    state.result = {
      data: [
        plan({ id: 1, status: 'DONE', estimatedMinutes: 60, actualMinutes: 50 }),
        plan({ id: 2, status: 'FAILED', estimatedMinutes: 30, actualMinutes: null, planDate: '2026-11-23' }),
      ],
      isLoading: false,
      isError: false,
    }
    render(<PlanPeriodView today={TODAY} />)

    expect(screen.getByText(/2개 중 완료 1 · 못함 1/)).toHaveTextContent('목표 1시간 30분')
    expect(screen.getByText(/2개 중 완료 1 · 못함 1/)).toHaveTextContent('실제 50분')
  })

  it('날짜별로 묶어 최근 날짜가 먼저 나온다', () => {
    state.result = {
      data: [
        plan({ id: 1, planDate: '2026-11-22', content: '옛 계획' }),
        plan({ id: 2, planDate: '2026-11-24', content: '어제 계획' }),
      ],
      isLoading: false,
      isError: false,
    }
    render(<PlanPeriodView today={TODAY} />)

    const headings = screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent)
    expect(headings).toEqual(['11월 24일 화요일', '11월 22일 일요일'])
    expect(within(screen.getByRole('region', { name: '11월 24일 화요일' })).getByText('어제 계획')).toBeInTheDocument()
  })

  it('불러오지 못하면 다시 시도 버튼을 보여준다', async () => {
    const user = userEvent.setup()
    const refetch = vi.fn()
    state.result = { isLoading: false, isError: true, refetch }
    render(<PlanPeriodView today={TODAY} />)

    expect(screen.getByRole('alert')).toHaveTextContent('지난 계획을 불러오지 못했습니다.')
    await user.click(screen.getByRole('button', { name: '다시 시도' }))

    expect(refetch).toHaveBeenCalled()
  })

  it('불러오는 동안 자리 표시를 보여준다', () => {
    state.result = { isLoading: true }
    render(<PlanPeriodView today={TODAY} />)

    expect(screen.getByRole('status', { name: '지난 계획 불러오는 중' })).toBeInTheDocument()
  })
})
