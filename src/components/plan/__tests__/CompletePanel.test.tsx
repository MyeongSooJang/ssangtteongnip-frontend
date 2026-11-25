import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Plan } from '@/api/types'
import CompletePanel from '../CompletePanel'

const complete = vi.hoisted(() => vi.fn())

vi.mock('@/hooks/usePlans', () => ({
  useCompletePlan: () => ({ mutateAsync: complete, isPending: false }),
}))

const evidence = { id: 1, type: 'URL' as const, url: 'https://a.b', fileName: null, sizeBytes: null }

function plan(overrides: Partial<Plan> = {}): Plan {
  return {
    id: 7, planDate: '2026-11-25', content: '자료구조 복습', category: null, doneCriteria: '문제 5개', estimatedMinutes: 60,
    timeSlot: null, place: null, firstAction: null, status: 'PLANNED', actualMinutes: null, missReason: null, memo: null,
    completedAt: null, evidences: [evidence], ...overrides,
  }
}

describe('CompletePanel', () => {
  beforeEach(() => vi.clearAllMocks())

  it('결과물이 없으면 완료 버튼을 막고 이유를 알려준다', () => {
    render(<CompletePanel plan={plan({ evidences: [] })} />)

    expect(screen.getByRole('button', { name: '완료로 표시' })).toBeDisabled()
    expect(screen.getByText('완료하려면 결과물이 1개 이상 필요합니다.')).toBeInTheDocument()
  })

  it('실제 시간 기본값은 목표 시간이다', () => {
    render(<CompletePanel plan={plan()} />)

    expect(screen.getByLabelText('실제 걸린 시간(분)')).toHaveValue(60)
  })

  it('실제 시간과 메모로 완료한다', async () => {
    const user = userEvent.setup()
    complete.mockResolvedValue({})
    render(<CompletePanel plan={plan()} />)

    await user.clear(screen.getByLabelText('실제 걸린 시간(분)'))
    await user.type(screen.getByLabelText('실제 걸린 시간(분)'), '75')
    await user.type(screen.getByLabelText(/메모/), '표로 정리함')
    await user.click(screen.getByRole('button', { name: '완료로 표시' }))

    expect(complete).toHaveBeenCalledWith({ id: 7, data: { actualMinutes: 75, memo: '표로 정리함' } })
  })

  it('메모를 비워 두면 메모 없이 보낸다', async () => {
    const user = userEvent.setup()
    complete.mockResolvedValue({})
    render(<CompletePanel plan={plan()} />)

    await user.click(screen.getByRole('button', { name: '완료로 표시' }))

    expect(complete).toHaveBeenCalledWith({ id: 7, data: { actualMinutes: 60, memo: undefined } })
  })

  it('실제 시간이 비었거나 음수면 요청 없이 막는다', async () => {
    const user = userEvent.setup()
    render(<CompletePanel plan={plan()} />)

    await user.clear(screen.getByLabelText('실제 걸린 시간(분)'))
    await user.click(screen.getByRole('button', { name: '완료로 표시' }))

    expect(screen.getByRole('alert')).toHaveTextContent('실제 걸린 시간을 0분 이상 1440분 이하로 입력해 주세요.')
    expect(complete).not.toHaveBeenCalled()
  })

  it('서버가 거절하면 그 메시지를 보여준다', async () => {
    const user = userEvent.setup()
    complete.mockRejectedValue({ isAxiosError: true, response: { data: { message: '오늘 계획만 완료할 수 있습니다.' } } })
    render(<CompletePanel plan={plan()} />)

    await user.click(screen.getByRole('button', { name: '완료로 표시' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('오늘 계획만 완료할 수 있습니다.')
  })
})
