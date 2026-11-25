import { describe, it, expect } from 'vitest'
import type { Plan } from '@/api/types'
import {
  MAX_EVIDENCES, canAddEvidence, canComplete, groupPlansByDate, isEditable, needsReflection, periodRange,
  planDateOptions, summarizePlans, validateEvidenceFile, validateLink, validatePlanDetail,
} from '../plan'

const TODAY = '2026-11-25'

function plan(overrides: Partial<Plan> = {}): Plan {
  return {
    id: 1, planDate: TODAY, content: '자료구조 복습', category: 'SKILL', doneCriteria: '문제 5개 풀기',
    estimatedMinutes: 60, timeSlot: null, place: null, firstAction: null, status: 'PLANNED',
    actualMinutes: null, missReason: null, memo: null, completedAt: null, evidences: [], ...overrides,
  }
}

const evidence = (id: number) => ({ id, type: 'URL' as const, url: 'https://a.b', fileName: null, sizeBytes: null })

describe('planDateOptions', () => {
  it('오늘과 내일만 고를 수 있다', () => {
    expect(planDateOptions('2026-11-30')).toEqual(['2026-11-30', '2026-12-01'])
  })
})

describe('상태 규칙', () => {
  it('수정·삭제는 예정 상태이고 날짜가 지나지 않았을 때만 된다', () => {
    expect(isEditable(plan({ planDate: TODAY }), TODAY)).toBe(true)
    expect(isEditable(plan({ planDate: '2026-11-26' }), TODAY)).toBe(true)
    expect(isEditable(plan({ planDate: '2026-11-24' }), TODAY)).toBe(false)
    expect(isEditable(plan({ status: 'DONE' }), TODAY)).toBe(false)
    expect(isEditable(plan({ status: 'FAILED' }), TODAY)).toBe(false)
  })

  it('완료는 예정 상태의 오늘 계획만 된다', () => {
    expect(canComplete(plan(), TODAY)).toBe(true)
    expect(canComplete(plan({ planDate: '2026-11-26' }), TODAY)).toBe(false)
    expect(canComplete(plan({ planDate: '2026-11-24' }), TODAY)).toBe(false)
    expect(canComplete(plan({ status: 'DONE' }), TODAY)).toBe(false)
  })

  it('결과물 추가는 못함 상태에서 막히고 최대 개수에서 멈춘다', () => {
    expect(canAddEvidence(plan())).toBe(true)
    expect(canAddEvidence(plan({ status: 'DONE' }))).toBe(true)
    expect(canAddEvidence(plan({ status: 'FAILED' }))).toBe(false)
    const full = Array.from({ length: MAX_EVIDENCES }, (_, i) => evidence(i + 1))
    expect(canAddEvidence(plan({ evidences: full }))).toBe(false)
  })

  it('회고가 필요한 건 못함 상태뿐이다', () => {
    expect(needsReflection(plan({ status: 'FAILED' }))).toBe(true)
    expect(needsReflection(plan({ status: 'DONE' }))).toBe(false)
  })
})

describe('summarizePlans', () => {
  it('상태별 개수와 목표·실제 시간을 합친다', () => {
    const summary = summarizePlans([
      plan({ id: 1, status: 'DONE', estimatedMinutes: 60, actualMinutes: 50 }),
      plan({ id: 2, status: 'FAILED', estimatedMinutes: 30, actualMinutes: null }),
      plan({ id: 3, status: 'FAILED', estimatedMinutes: 30, actualMinutes: 10 }),
      plan({ id: 4, status: 'PLANNED', estimatedMinutes: 90 }),
    ])

    expect(summary).toEqual({ total: 4, done: 1, failed: 2, planned: 1, estimatedMinutes: 210, actualMinutes: 60 })
  })

  it('계획이 없으면 모두 0이다', () => {
    expect(summarizePlans([])).toEqual({ total: 0, done: 0, failed: 0, planned: 0, estimatedMinutes: 0, actualMinutes: 0 })
  })
})

describe('groupPlansByDate', () => {
  it('날짜 내림차순으로 묶고 같은 날은 id 오름차순이다', () => {
    const groups = groupPlansByDate([
      plan({ id: 3, planDate: '2026-11-24' }),
      plan({ id: 2, planDate: '2026-11-25' }),
      plan({ id: 1, planDate: '2026-11-25' }),
    ])

    expect(groups.map(g => g.date)).toEqual(['2026-11-25', '2026-11-24'])
    expect(groups[0].plans.map(p => p.id)).toEqual([1, 2])
  })
})

describe('periodRange', () => {
  it('주는 오늘 포함 지난 7일부터 내일까지다', () => {
    expect(periodRange('week', TODAY)).toEqual({ from: '2026-11-19', to: '2026-11-26' })
  })

  it('월은 지난 30일부터 내일까지이고 서버 한도 62일 안이다', () => {
    const { from, to } = periodRange('month', TODAY)
    expect(from).toBe('2026-10-27')
    expect(to).toBe('2026-11-26')
  })
})

describe('validatePlanDetail', () => {
  const valid = { content: '자료구조 복습', doneCriteria: '문제 5개 풀기', estimatedMinutes: '60' }

  it('통과하면 null이다', () => {
    expect(validatePlanDetail(valid)).toBeNull()
  })

  it('필수 항목이 비면 메시지를 준다', () => {
    expect(validatePlanDetail({ ...valid, content: '  ' })).toBe('계획 내용을 입력해 주세요.')
    expect(validatePlanDetail({ ...valid, doneCriteria: '' })).toBe('완료 기준을 입력해 주세요.')
    expect(validatePlanDetail({ ...valid, estimatedMinutes: '' })).toBe('목표 시간을 1분 이상으로 입력해 주세요.')
    expect(validatePlanDetail({ ...valid, estimatedMinutes: '0' })).toBe('목표 시간을 1분 이상으로 입력해 주세요.')
  })

  it('길이 한도를 넘으면 막는다', () => {
    expect(validatePlanDetail({ ...valid, content: 'a'.repeat(51) })).toBe('계획 내용은 50자 이하여야 합니다.')
    expect(validatePlanDetail({ ...valid, doneCriteria: 'a'.repeat(201) })).toBe('완료 기준은 200자 이하여야 합니다.')
  })
})

describe('validateLink', () => {
  it('http, https 주소만 받는다', () => {
    expect(validateLink('https://github.com/a/b')).toBeNull()
    expect(validateLink('http://example.com')).toBeNull()
    expect(validateLink('javascript:alert(1)')).toBe('http 또는 https 링크만 붙일 수 있습니다.')
    expect(validateLink('github.com/a')).toBe('http 또는 https 링크만 붙일 수 있습니다.')
    expect(validateLink('')).toBe('링크를 입력해 주세요.')
  })

  it('500자를 넘으면 막는다', () => {
    expect(validateLink(`https://a.b/${'x'.repeat(500)}`)).toBe('링크는 500자 이하여야 합니다.')
  })
})

describe('validateEvidenceFile', () => {
  const file = (name: string, type: string, size = 10) => new File([new Uint8Array(size)], name, { type })

  it('PDF와 이미지를 받는다', () => {
    expect(validateEvidenceFile(file('a.pdf', 'application/pdf'))).toBeNull()
    expect(validateEvidenceFile(file('a.png', 'image/png'))).toBeNull()
    expect(validateEvidenceFile(file('a.webp', 'image/webp'))).toBeNull()
  })

  it('다른 형식, 빈 파일, 5MB 초과는 막는다', () => {
    expect(validateEvidenceFile(file('a.zip', 'application/zip'))).toBe('PDF 또는 이미지(PNG, JPEG, GIF, WEBP)만 올릴 수 있습니다.')
    expect(validateEvidenceFile(file('a.pdf', 'application/pdf', 0))).toBe('비어 있는 파일은 올릴 수 없습니다.')
    expect(validateEvidenceFile(file('a.pdf', 'application/pdf', 5 * 1024 * 1024 + 1))).toBe('파일 크기는 5MB 이하여야 합니다.')
  })
})
