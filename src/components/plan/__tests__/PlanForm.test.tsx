import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Plan } from '@/api/types'
import PlanForm from '../PlanForm'

const mocks = vi.hoisted(() => ({ create: vi.fn(), revise: vi.fn() }))

vi.mock('@/hooks/usePlans', () => ({
  useCreatePlan: () => ({ mutateAsync: mocks.create, isPending: false }),
  useRevisePlan: () => ({ mutateAsync: mocks.revise, isPending: false }),
}))

const TODAY = '2026-11-25'

async function fillRequired(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('계획 내용'), '트랜잭션 정리')
  await user.type(screen.getByLabelText('완료 기준'), '격리 수준 표로 정리')
  await user.type(screen.getByLabelText('목표 시간(분)'), '90')
}

describe('PlanForm', () => {
  beforeEach(() => vi.clearAllMocks())

  it('필수 항목만 먼저 보이고 나머지는 접혀 있다', () => {
    render(<PlanForm today={TODAY} onDone={vi.fn()} />)

    expect(screen.getByLabelText('계획 내용')).toBeInTheDocument()
    expect(screen.queryByLabelText('시간대')).not.toBeInTheDocument()
    expect(screen.queryByRole('group', { name: '카테고리' })).not.toBeInTheDocument()
  })

  it('필수 항목을 채워 만들면 선택한 날짜와 함께 보내고 끝났음을 알린다', async () => {
    const user = userEvent.setup()
    const onDone = vi.fn()
    mocks.create.mockResolvedValue({})
    render(<PlanForm today={TODAY} defaultDate="2026-11-26" onDone={onDone} />)

    await fillRequired(user)
    await user.click(screen.getByRole('button', { name: '계획 추가' }))

    expect(mocks.create).toHaveBeenCalledWith({
      planDate: '2026-11-26', content: '트랜잭션 정리', category: null, doneCriteria: '격리 수준 표로 정리',
      estimatedMinutes: 90, timeSlot: undefined, place: undefined, firstAction: undefined,
    })
    expect(onDone).toHaveBeenCalled()
  })

  it('날짜는 오늘과 내일만 고를 수 있다', async () => {
    const user = userEvent.setup()
    mocks.create.mockResolvedValue({})
    render(<PlanForm today={TODAY} onDone={vi.fn()} />)

    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: /^내일/ }))
    await fillRequired(user)
    await user.click(screen.getByRole('button', { name: '계획 추가' }))

    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ planDate: '2026-11-26' }))
  })

  it('더 적기를 열고 카테고리를 고르면 함께 보낸다', async () => {
    const user = userEvent.setup()
    mocks.create.mockResolvedValue({})
    render(<PlanForm today={TODAY} onDone={vi.fn()} />)

    await fillRequired(user)
    await user.click(screen.getByRole('button', { name: '카테고리·시간대 더 적기' }))
    await user.click(screen.getByRole('button', { name: '기술' }))
    await user.type(screen.getByLabelText('장소'), '도서관')
    await user.click(screen.getByRole('button', { name: '계획 추가' }))

    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ category: 'SKILL', place: '도서관' }))
  })

  it('필수 항목이 비면 요청 없이 막는다', async () => {
    const user = userEvent.setup()
    render(<PlanForm today={TODAY} onDone={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: '계획 추가' }))

    expect(screen.getByRole('alert')).toHaveTextContent('계획 내용을 입력해 주세요.')
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it('계획 내용은 50자까지만 입력된다', async () => {
    const user = userEvent.setup()
    render(<PlanForm today={TODAY} onDone={vi.fn()} />)

    await user.type(screen.getByLabelText('계획 내용'), 'a'.repeat(60))

    expect(screen.getByLabelText('계획 내용')).toHaveValue('a'.repeat(50))
  })

  it('서버가 거절하면 메시지를 보여주고 끝났다고 알리지 않는다', async () => {
    const user = userEvent.setup()
    const onDone = vi.fn()
    mocks.create.mockRejectedValue({ isAxiosError: true, response: { data: { message: '계획 날짜는 오늘 또는 내일만 가능합니다.' } } })
    render(<PlanForm today={TODAY} onDone={onDone} />)

    await fillRequired(user)
    await user.click(screen.getByRole('button', { name: '계획 추가' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('계획 날짜는 오늘 또는 내일만 가능합니다.')
    expect(onDone).not.toHaveBeenCalled()
  })

  describe('수정', () => {
    const plan: Plan = {
      id: 5, planDate: TODAY, content: '기존 내용', category: 'SKILL', doneCriteria: '기존 기준', estimatedMinutes: 30,
      timeSlot: '오전', place: null, firstAction: null, status: 'PLANNED', actualMinutes: null, missReason: null,
      memo: null, completedAt: null, evidences: [],
    }

    it('기존 값을 채우고 날짜 선택은 보이지 않는다', () => {
      render(<PlanForm today={TODAY} plan={plan} onDone={vi.fn()} />)

      expect(screen.getByLabelText('계획 내용')).toHaveValue('기존 내용')
      expect(screen.getByLabelText('시간대')).toHaveValue('오전')
      expect(screen.queryByRole('group', { name: '계획 날짜' })).not.toBeInTheDocument()
    })

    it('고친 값으로 수정 API를 부른다', async () => {
      const user = userEvent.setup()
      mocks.revise.mockResolvedValue({})
      render(<PlanForm today={TODAY} plan={plan} onDone={vi.fn()} />)

      await user.clear(screen.getByLabelText('계획 내용'))
      await user.type(screen.getByLabelText('계획 내용'), '바뀐 내용')
      await user.click(screen.getByRole('button', { name: '수정 저장' }))

      expect(mocks.revise).toHaveBeenCalledWith({
        id: 5,
        data: {
          content: '바뀐 내용', category: 'SKILL', doneCriteria: '기존 기준', estimatedMinutes: 30,
          timeSlot: '오전', place: undefined, firstAction: undefined,
        },
      })
    })
  })
})
