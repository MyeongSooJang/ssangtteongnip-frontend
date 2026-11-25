import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Plan } from '@/api/types'
import ReflectionPanel from '../ReflectionPanel'

const reflect = vi.hoisted(() => vi.fn())

vi.mock('@/hooks/usePlans', () => ({
  useReflectPlan: () => ({ mutateAsync: reflect, isPending: false }),
}))

function plan(overrides: Partial<Plan> = {}): Plan {
  return {
    id: 7, planDate: '2026-11-24', content: '자료구조 복습', category: null, doneCriteria: '문제 5개', estimatedMinutes: 60,
    timeSlot: null, place: null, firstAction: null, status: 'FAILED', actualMinutes: null, missReason: null, memo: null,
    completedAt: null, evidences: [], ...overrides,
  }
}

describe('ReflectionPanel', () => {
  beforeEach(() => vi.clearAllMocks())

  it('못함은 못한 이유와 실제 시간과 메모를 남긴다', async () => {
    const user = userEvent.setup()
    reflect.mockResolvedValue({})
    render(<ReflectionPanel plan={plan()} />)

    await user.click(screen.getByRole('button', { name: '계획이 컸다' }))
    await user.type(screen.getByLabelText('실제 시간(분)'), '20')
    await user.type(screen.getByLabelText(/메모/), '범위를 줄였어야 함')
    await user.click(screen.getByRole('button', { name: '회고 저장' }))

    expect(reflect).toHaveBeenCalledWith({
      id: 7, data: { actualMinutes: 20, missReason: 'TOO_BIG', memo: '범위를 줄였어야 함' },
    })
    expect(await screen.findByRole('status')).toHaveTextContent('저장했습니다.')
  })

  it('고른 이유를 다시 누르면 선택이 풀린다', async () => {
    const user = userEvent.setup()
    render(<ReflectionPanel plan={plan({ missReason: 'ETC' })} />)

    const button = screen.getByRole('button', { name: '기타' })
    expect(button).toHaveAttribute('aria-pressed', 'true')
    await user.click(button)

    expect(button).toHaveAttribute('aria-pressed', 'false')
  })

  it('완료한 계획은 메모만 남기며 못한 이유 입력이 없다(서버 규칙)', async () => {
    const user = userEvent.setup()
    reflect.mockResolvedValue({})
    render(<ReflectionPanel plan={plan({ status: 'DONE', actualMinutes: 50 })} />)

    expect(screen.queryByRole('group', { name: '못한 이유' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('실제 시간(분)')).not.toBeInTheDocument()
    await user.type(screen.getByLabelText(/메모/), '다음엔 더 빨리')
    await user.click(screen.getByRole('button', { name: '회고 저장' }))

    expect(reflect).toHaveBeenCalledWith({ id: 7, data: { memo: '다음엔 더 빨리' } })
  })

  it('실제 시간이 음수면 요청 없이 막는다', async () => {
    const user = userEvent.setup()
    render(<ReflectionPanel plan={plan()} />)

    await user.type(screen.getByLabelText('실제 시간(분)'), '-5')
    await user.click(screen.getByRole('button', { name: '회고 저장' }))

    expect(screen.getByRole('alert')).toHaveTextContent('실제 걸린 시간을 0분 이상으로 입력해 주세요.')
    expect(reflect).not.toHaveBeenCalled()
  })
})
