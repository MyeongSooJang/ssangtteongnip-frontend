import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Plan } from '@/api/types'
import PlanRow from '../PlanRow'

const mocks = vi.hoisted(() => ({ remove: vi.fn() }))

vi.mock('@/hooks/usePlans', () => ({
  useDeletePlan: () => ({ mutateAsync: mocks.remove, isPending: false }),
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
const evidence = { id: 1, type: 'URL' as const, url: 'https://a.b', fileName: null, sizeBytes: null }

function plan(overrides: Partial<Plan> = {}): Plan {
  return {
    id: 7, planDate: TODAY, content: '자료구조 복습', category: 'SKILL', doneCriteria: '문제 5개 풀기', estimatedMinutes: 60,
    timeSlot: null, place: null, firstAction: null, status: 'PLANNED', actualMinutes: null, missReason: null, memo: null,
    completedAt: null, evidences: [], ...overrides,
  }
}

function renderRow(p: Plan) {
  render(<ul><PlanRow plan={p} today={TODAY} /></ul>)
}

describe('PlanRow', () => {
  beforeEach(() => vi.clearAllMocks())

  it('접힌 상태에서 내용, 완료 기준, 목표 시간을 보여준다', () => {
    renderRow(plan())

    const row = screen.getByRole('button', { name: /자료구조 복습/ })
    expect(row).toHaveTextContent('문제 5개 풀기')
    expect(row).toHaveTextContent('목표 1시간')
    expect(row).toHaveAttribute('aria-expanded', 'false')
  })

  it('상태를 색이 아니라 글자로도 알 수 있다', () => {
    renderRow(plan({ status: 'DONE', actualMinutes: 50 }))

    expect(screen.getByRole('button', { name: /완료:s*자료구조 복습/ })).toHaveTextContent('50분')
  })

  it('오늘 예정 계획을 펼치면 완료 패널과 수정·삭제가 있다', async () => {
    const user = userEvent.setup()
    renderRow(plan())

    await user.click(screen.getByRole('button', { name: /자료구조 복습/ }))

    expect(screen.getByRole('button', { name: '완료로 표시' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '수정' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument()
  })

  it('내일 계획은 완료 패널이 없고 수정·삭제는 있으며 결과물은 미리 붙일 수 있다', async () => {
    const user = userEvent.setup()
    renderRow(plan({ planDate: '2026-11-26' }))

    await user.click(screen.getByRole('button', { name: /자료구조 복습/ }))

    expect(screen.queryByRole('button', { name: '완료로 표시' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '수정' })).toBeInTheDocument()
    expect(screen.getByLabelText('결과물 링크')).toBeInTheDocument()
  })

  it('지난 날짜의 예정 계획은 수정·삭제·완료를 모두 막는다', async () => {
    const user = userEvent.setup()
    renderRow(plan({ planDate: '2026-11-24' }))

    await user.click(screen.getByRole('button', { name: /자료구조 복습/ }))

    expect(screen.queryByRole('button', { name: '수정' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '삭제' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '완료로 표시' })).not.toBeInTheDocument()
  })

  it('못함 계획은 이유를 접힌 줄에서 보여주고 펼치면 회고만 있고 결과물 추가는 없다', async () => {
    const user = userEvent.setup()
    renderRow(plan({ planDate: '2026-11-24', status: 'FAILED', missReason: 'TOO_BIG' }))

    const row = screen.getByRole('button', { name: /못함:s*자료구조 복습/ })
    expect(row).toHaveTextContent('못한 이유: 계획이 컸다')
    await user.click(row)

    expect(screen.getByRole('group', { name: '못한 이유' })).toBeInTheDocument()
    expect(screen.queryByLabelText('결과물 링크')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '수정' })).not.toBeInTheDocument()
  })

  it('못한 이유가 없으면 회고를 남기도록 중립적으로 안내한다', () => {
    renderRow(plan({ status: 'FAILED' }))

    expect(screen.getByRole('button', { name: /자료구조 복습/ })).toHaveTextContent('못한 이유를 남겨 두면 다음 계획에 도움이 됩니다.')
  })

  it('삭제는 한 번 더 확인한 뒤에 요청한다', async () => {
    const user = userEvent.setup()
    mocks.remove.mockResolvedValue(undefined)
    renderRow(plan())

    await user.click(screen.getByRole('button', { name: /자료구조 복습/ }))
    await user.click(screen.getByRole('button', { name: '삭제' }))
    expect(mocks.remove).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: '삭제' }))

    expect(mocks.remove).toHaveBeenCalledWith(7)
  })

  it('수정을 누르면 폼으로 바뀌고 취소하면 돌아온다', async () => {
    const user = userEvent.setup()
    renderRow(plan({ evidences: [evidence] }))

    await user.click(screen.getByRole('button', { name: /자료구조 복습/ }))
    await user.click(screen.getByRole('button', { name: '수정' }))
    expect(screen.getByRole('form', { name: '계획 수정' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '취소' }))

    expect(screen.queryByRole('form', { name: '계획 수정' })).not.toBeInTheDocument()
  })
})
