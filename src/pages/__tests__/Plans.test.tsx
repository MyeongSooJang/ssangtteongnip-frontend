import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Plan } from '@/api/types'
import { addDays, toDateKey } from '@/lib/studyLog'
import Plans from '../Plans'

const state = vi.hoisted(() => ({
  result: {} as { data?: unknown; isLoading?: boolean; isError?: boolean; refetch?: () => void },
}))

vi.mock('@/hooks/usePlans', () => ({
  // 서버처럼 요청한 기간의 계획만 돌려준다. 오늘·내일 조회와 지난 계획 조회가 서로의 데이터를 보지 않게 한다.
  usePlans: (from: string, to: string) => ({
    ...state.result,
    data: (state.result.data as Array<{ planDate: string }> | undefined)?.filter(p => p.planDate >= from && p.planDate <= to),
  }),
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

const TODAY = toDateKey(new Date())
const TOMORROW = addDays(TODAY, 1)

function plan(overrides: Partial<Plan>): Plan {
  return {
    id: 1, planDate: TODAY, content: '자료구조 복습', category: null, doneCriteria: '문제 5개', estimatedMinutes: 60,
    timeSlot: null, place: null, firstAction: null, status: 'PLANNED', actualMinutes: null, missReason: null, memo: null,
    completedAt: null, evidences: [], ...overrides,
  }
}

describe('Plans 페이지', () => {
  beforeEach(() => {
    state.result = { data: [], isLoading: false, isError: false }
  })

  it('계획이 없으면 입력칸을 바로 펼쳐 둔다', () => {
    render(<Plans />)

    expect(screen.getByText('오늘 끝낼 일을 적어 보세요.')).toBeInTheDocument()
    expect(screen.getByRole('form', { name: '계획 추가' })).toBeInTheDocument()
  })

  it('오늘 계획과 진행 요약을 보여주고 입력칸은 접어 둔다', () => {
    state.result = {
      data: [
        plan({ id: 1, status: 'DONE', actualMinutes: 50 }),
        plan({ id: 2, content: '알고리즘 풀이', status: 'PLANNED' }),
      ],
      isLoading: false,
      isError: false,
    }
    render(<Plans />)

    expect(screen.getByText('2개 중 1개 완료 · 목표 2시간')).toBeInTheDocument()
    expect(screen.queryByRole('form', { name: '계획 추가' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '계획 추가' })).toBeInTheDocument()
  })

  it('계획 추가를 누르면 입력칸이 열리고 취소하면 접힌다', async () => {
    const user = userEvent.setup()
    state.result = { data: [plan({ id: 1 })], isLoading: false, isError: false }
    render(<Plans />)

    await user.click(screen.getByRole('button', { name: '계획 추가' }))
    expect(screen.getByRole('form', { name: '계획 추가' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '취소' }))

    expect(screen.queryByRole('form', { name: '계획 추가' })).not.toBeInTheDocument()
  })

  it('내일 탭으로 바꾸면 내일 계획만 보인다', async () => {
    const user = userEvent.setup()
    state.result = {
      data: [plan({ id: 1, content: '오늘 할 일' }), plan({ id: 2, content: '내일 할 일', planDate: TOMORROW })],
      isLoading: false,
      isError: false,
    }
    render(<Plans />)

    expect(screen.getByRole('tab', { name: /오늘/ })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('button', { name: /오늘 할 일/ })).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: /내일/ }))

    expect(screen.getByRole('button', { name: /내일 할 일/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /오늘 할 일/ })).not.toBeInTheDocument()
  })

  it('탭에 날짜별 계획 개수를 보여준다', () => {
    state.result = {
      data: [plan({ id: 1 }), plan({ id: 2 }), plan({ id: 3, planDate: TOMORROW })],
      isLoading: false,
      isError: false,
    }
    render(<Plans />)

    expect(screen.getByRole('tab', { name: /오늘\s*2/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /내일\s*1/ })).toBeInTheDocument()
  })

  it('불러오지 못하면 다시 시도 버튼을 보여준다', async () => {
    const user = userEvent.setup()
    const refetch = vi.fn()
    state.result = { isLoading: false, isError: true, refetch }
    render(<Plans />)

    expect(screen.getAllByRole('alert')[0]).toHaveTextContent('계획을 불러오지 못했습니다.')
    await user.click(screen.getAllByRole('button', { name: '다시 시도' })[0])

    expect(refetch).toHaveBeenCalled()
  })

  it('지난 계획 영역이 함께 있다', () => {
    render(<Plans />)

    expect(screen.getByRole('heading', { name: '지난 계획' })).toBeInTheDocument()
  })
})
