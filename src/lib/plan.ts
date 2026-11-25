import type { MissReason, Plan, PlanCategory, PlanStatus } from '@/api/types'
import { addDays } from '@/lib/studyLog'

export const CATEGORY_LABELS: Record<PlanCategory, string> = {
  APPLY: '지원',
  SKILL: '기술',
  OUTPUT: '산출물',
  LIFE: '생활',
}

export const MISS_REASON_LABELS: Record<MissReason, string> = {
  TOO_BIG: '계획이 컸다',
  NOT_STARTED: '시작하지 못했다',
  SCHEDULE: '일정이 밀렸다',
  CONDITION: '몸·컨디션',
  ETC: '기타',
}

export const STATUS_LABELS: Record<PlanStatus, string> = {
  PLANNED: '예정',
  DONE: '완료',
  FAILED: '못함',
}

// 결과물 개수·기간 한도는 서버 규칙이다. 화면에서 미리 막아 불필요한 요청을 줄일 뿐, 최종 판단은 서버가 한다.
export const MAX_EVIDENCES = 5
export const MAX_RANGE_DAYS = 62
export const MAX_MINUTES = 24 * 60
const MAX_FILE_BYTES = 5 * 1024 * 1024
const EVIDENCE_FILE_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/gif', 'image/webp']

// 계획은 오늘과 내일만 만들 수 있다.
export const planDateOptions = (today: string): [string, string] => [today, addDays(today, 1)]

// 수정·삭제: 예정 상태이고 날짜가 지나지 않았을 때만
export const isEditable = (plan: Plan, today: string) => plan.status === 'PLANNED' && plan.planDate >= today

// 완료: 예정 상태의 오늘 계획만. 자정 이후에 끝낸 일은 이미 지난 날짜라 완료할 수 없다(서버의 의도된 제약).
export const canComplete = (plan: Plan, today: string) => plan.status === 'PLANNED' && plan.planDate === today

// 서버 규칙: 완료이거나, 날짜가 지나지 않은 예정일 때만 추가할 수 있고 개수 한도가 있다.
export const canAddEvidence = (plan: Plan, today: string) =>
  (plan.status === 'DONE' || (plan.status === 'PLANNED' && plan.planDate >= today)) && plan.evidences.length < MAX_EVIDENCES

// 서버 규칙: 완료 계획은 결과물이 1개 이상 남아야 하므로 마지막 하나는 지울 수 없고, 못함·지난 예정은 아예 지울 수 없다.
export const canRemoveEvidence = (plan: Plan, today: string) =>
  plan.status === 'DONE' ? plan.evidences.length > 1 : plan.status === 'PLANNED' && plan.planDate >= today

export function monthDayLabel(dateKey: string): string {
  const [, month, day] = dateKey.split('-').map(Number)
  return `${month}월 ${day}일`
}

// 실제 걸린 시간 입력(문자열)이 0분 이상 1440분 이하의 정수인지. 상한은 서버 규칙이다.
export const ACTUAL_MINUTES_ERROR = `실제 걸린 시간을 0분 이상 ${MAX_MINUTES}분 이하로 입력해 주세요.`
export function isValidActualMinutes(text: string): boolean {
  const minutes = Number(text)
  return text.trim() !== '' && Number.isInteger(minutes) && minutes >= 0 && minutes <= MAX_MINUTES
}

export interface PlanSummary {
  total: number
  done: number
  failed: number
  planned: number
  estimatedMinutes: number
  actualMinutes: number
}

export function summarizePlans(plans: Plan[]): PlanSummary {
  const summary: PlanSummary = { total: plans.length, done: 0, failed: 0, planned: 0, estimatedMinutes: 0, actualMinutes: 0 }
  for (const plan of plans) {
    summary.estimatedMinutes += plan.estimatedMinutes
    summary.actualMinutes += plan.actualMinutes ?? 0
    if (plan.status === 'DONE') summary.done += 1
    else if (plan.status === 'FAILED') summary.failed += 1
    else summary.planned += 1
  }
  return summary
}

export function groupPlansByDate(plans: Plan[]): Array<{ date: string; plans: Plan[] }> {
  const byDate = new Map<string, Plan[]>()
  for (const plan of plans) byDate.set(plan.planDate, [...(byDate.get(plan.planDate) ?? []), plan])
  return [...byDate.entries()]
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([date, group]) => ({ date, plans: [...group].sort((a, b) => a.id - b.id) }))
}

// 어제까지 지난 7일(주) 또는 30일(월). 오늘·내일은 위쪽 작업 영역에서 다루므로 겹치지 않게 뺀다. 둘 다 서버 한도(62일) 안이다.
export function periodRange(kind: 'week' | 'month', today: string): { from: string; to: string } {
  const days = kind === 'week' ? 7 : 30
  return { from: addDays(today, -days), to: addDays(today, -1) }
}

export function validatePlanDetail(input: { content: string; doneCriteria: string; estimatedMinutes: string }): string | null {
  const content = input.content.trim()
  const doneCriteria = input.doneCriteria.trim()
  if (content.length === 0) return '계획 내용을 입력해 주세요.'
  if (content.length > 50) return '계획 내용은 50자 이하여야 합니다.'
  if (doneCriteria.length === 0) return '완료 기준을 입력해 주세요.'
  if (doneCriteria.length > 200) return '완료 기준은 200자 이하여야 합니다.'
  const minutes = Number(input.estimatedMinutes)
  if (input.estimatedMinutes.trim() === '' || !Number.isInteger(minutes) || minutes < 1 || minutes > MAX_MINUTES) {
    return `목표 시간을 1분 이상 ${MAX_MINUTES}분 이하로 입력해 주세요.`
  }
  return null
}

export function validateLink(url: string): string | null {
  const trimmed = url.trim()
  if (trimmed.length === 0) return '링크를 입력해 주세요.'
  if (trimmed.length > 500) return '링크는 500자 이하여야 합니다.'
  try {
    const { protocol } = new URL(trimmed)
    if (protocol !== 'http:' && protocol !== 'https:') return 'http 또는 https 링크만 붙일 수 있습니다.'
  } catch {
    return 'http 또는 https 링크만 붙일 수 있습니다.'
  }
  return null
}

export function validateEvidenceFile(file: File): string | null {
  if (!EVIDENCE_FILE_TYPES.includes(file.type)) return 'PDF 또는 이미지(PNG, JPEG, GIF, WEBP)만 올릴 수 있습니다.'
  if (file.size === 0) return '비어 있는 파일은 올릴 수 없습니다.'
  if (file.size > MAX_FILE_BYTES) return '파일 크기는 5MB 이하여야 합니다.'
  return null
}
