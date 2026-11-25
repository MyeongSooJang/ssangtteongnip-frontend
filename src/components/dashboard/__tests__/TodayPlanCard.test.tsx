import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import type { Plan } from '@/api/types'
import TodayPlanCard from '../TodayPlanCard'

function plan(id: number, overrides: Partial<Plan> = {}): Plan {
  return {
    id, planDate: '2026-11-25', content: `계획 ${id}`, category: null, doneCriteria: '기준', estimatedMinutes: 30,
    timeSlot: null, place: null, firstAction: null, status: 'PLANNED', actualMinutes: null, missReason: null, memo: null,
    completedAt: null, evidences: [], ...overrides,
  }
}

const renderCard = (plans: Plan[]) => render(<MemoryRouter><TodayPlanCard plans={plans} /></MemoryRouter>)

describe('TodayPlanCard', () => {
  it('계획이 없으면 빈 안내와 계획 세우기 링크를 보여준다', () => {
    renderCard([])

    expect(screen.getByText('오늘 세운 계획이 없습니다.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '계획 세우기' })).toHaveAttribute('href', '/plans')
  })

  it('전체 개수 중 완료 개수와 항목을 상태 글자와 함께 보여준다', () => {
    renderCard([plan(1, { status: 'DONE' }), plan(2)])

    expect(screen.getByText('2개 중 1개 완료')).toBeInTheDocument()
    expect(screen.getByText(/완료:/)).toBeInTheDocument()
    expect(screen.getByText('계획 2')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '전체 보기' })).toHaveAttribute('href', '/plans')
  })

  it('세 개를 넘으면 앞의 세 개만 보여주고 나머지 개수를 알려준다', () => {
    renderCard([plan(1), plan(2), plan(3), plan(4), plan(5)])

    expect(screen.getByText('계획 3')).toBeInTheDocument()
    expect(screen.queryByText('계획 4')).not.toBeInTheDocument()
    expect(screen.getByText('외 2개')).toBeInTheDocument()
  })
})
