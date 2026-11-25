import { useState } from 'react'
import type { Plan, PlanCategory, PlanDetailInput } from '@/api/types'
import { useCreatePlan, useRevisePlan } from '@/hooks/usePlans'
import { formatDayHeading } from '@/lib/studyLog'
import { getErrorMessage } from '@/lib/errors'
import { CATEGORY_LABELS, planDateOptions, validatePlanDetail } from '@/lib/plan'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const CATEGORIES = Object.keys(CATEGORY_LABELS) as PlanCategory[]

interface PlanFormProps {
  today: string
  // 있으면 이 계획을 고친다(날짜는 바꿀 수 없다). 없으면 새로 만든다.
  plan?: Plan
  defaultDate?: string
  onDone: () => void
  onCancel?: () => void
}

// 필수 항목(내용·완료 기준·목표 시간)만 먼저 보이고 나머지는 접어 둔다. 적는 마찰을 줄이기 위해서다.
export default function PlanForm({ today, plan, defaultDate, onDone, onCancel }: PlanFormProps) {
  const create = useCreatePlan()
  const revise = useRevisePlan()
  const [planDate, setPlanDate] = useState(defaultDate ?? today)
  const [content, setContent] = useState(plan?.content ?? '')
  const [doneCriteria, setDoneCriteria] = useState(plan?.doneCriteria ?? '')
  const [minutes, setMinutes] = useState(plan ? String(plan.estimatedMinutes) : '')
  const [category, setCategory] = useState<PlanCategory | null>(plan?.category ?? null)
  const [timeSlot, setTimeSlot] = useState(plan?.timeSlot ?? '')
  const [place, setPlace] = useState(plan?.place ?? '')
  const [firstAction, setFirstAction] = useState(plan?.firstAction ?? '')
  const [moreOpen, setMoreOpen] = useState(Boolean(plan?.timeSlot || plan?.place || plan?.firstAction))
  const [error, setError] = useState<string | null>(null)
  const pending = create.isPending || revise.isPending

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const problem = validatePlanDetail({ content, doneCriteria, estimatedMinutes: minutes })
    if (problem) return setError(problem)
    setError(null)
    const detail: PlanDetailInput = {
      content: content.trim(),
      category,
      doneCriteria: doneCriteria.trim(),
      estimatedMinutes: Number(minutes),
      timeSlot: timeSlot.trim() || undefined,
      place: place.trim() || undefined,
      firstAction: firstAction.trim() || undefined,
    }
    try {
      if (plan) await revise.mutateAsync({ id: plan.id, data: detail })
      else await create.mutateAsync({ planDate, ...detail })
      onDone()
    } catch (e) {
      setError(getErrorMessage(e, '계획을 저장하지 못했습니다.'))
    }
  }

  const labelClass = 'block space-y-1 text-sm font-medium text-ink-900'

  return (
    <form onSubmit={e => void submit(e)} aria-label={plan ? '계획 수정' : '계획 추가'} className="space-y-3">
      {!plan && (
        <div role="group" aria-label="계획 날짜" className="flex gap-2">
          {planDateOptions(today).map((date, index) => (
            <button
              key={date}
              type="button"
              aria-pressed={planDate === date}
              onClick={() => setPlanDate(date)}
              className={cn(
                'rounded-md border px-3 py-1.5 text-sm transition-colors duration-150',
                planDate === date ? 'border-brand-500 bg-brand-50 font-medium text-brand-700' : 'border-line text-ink-600 hover:bg-surface',
              )}
            >
              {index === 0 ? '오늘' : '내일'} <span className="text-xs text-ink-600">{formatDayHeading(date).replace(/ .요일$/, '')}</span>
            </button>
          ))}
        </div>
      )}

      <label className={labelClass}>
        계획 내용
        <Input value={content} maxLength={50} onChange={e => setContent(e.target.value)} placeholder="예: 트랜잭션 격리 수준 정리" />
      </label>
      <label className={labelClass}>
        완료 기준
        <Input value={doneCriteria} maxLength={200} onChange={e => setDoneCriteria(e.target.value)} placeholder="예: 격리 수준 4가지와 발생 현상을 표로 정리" />
      </label>
      <label className={cn(labelClass, 'max-w-[10rem]')}>
        목표 시간(분)
        <Input type="number" min={1} inputMode="numeric" value={minutes} onChange={e => setMinutes(e.target.value)} className="tabular-nums" />
      </label>

      <div>
        <button
          type="button"
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen(open => !open)}
          className="text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          {moreOpen ? '접기' : '카테고리·시간대 더 적기'}
        </button>
      </div>

      {moreOpen && (
        <div className="space-y-3">
          <div role="group" aria-label="카테고리" className="flex flex-wrap gap-2">
            {CATEGORIES.map(value => (
              <button
                key={value}
                type="button"
                aria-pressed={category === value}
                onClick={() => setCategory(category === value ? null : value)}
                className={cn(
                  'rounded-md border px-3 py-1.5 text-sm transition-colors duration-150',
                  category === value ? 'border-brand-500 bg-brand-50 font-medium text-brand-700' : 'border-line text-ink-600 hover:bg-surface',
                )}
              >
                {CATEGORY_LABELS[value]}
              </button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              시간대
              <Input value={timeSlot} maxLength={100} onChange={e => setTimeSlot(e.target.value)} placeholder="예: 오전 10시~12시" />
            </label>
            <label className={labelClass}>
              장소
              <Input value={place} maxLength={100} onChange={e => setPlace(e.target.value)} placeholder="예: 도서관" />
            </label>
          </div>
          <label className={labelClass}>
            첫 행동
            <Input value={firstAction} maxLength={100} onChange={e => setFirstAction(e.target.value)} placeholder="예: 노트북을 열고 교재 3장 펴기" />
          </label>
        </div>
      )}

      {error && <p role="alert" className="text-sm text-danger">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" variant="brand" disabled={pending}>{plan ? '수정 저장' : '계획 추가'}</Button>
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>취소</Button>}
      </div>
    </form>
  )
}
