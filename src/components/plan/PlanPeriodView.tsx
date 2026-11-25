import { useMemo, useState } from 'react'
import { usePlans } from '@/hooks/usePlans'
import { formatDayHeading, formatMinutes } from '@/lib/studyLog'
import { groupPlansByDate, periodRange, summarizePlans } from '@/lib/plan'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { cardClass } from '@/components/studylog/cardClass'
import PlanRow from './PlanRow'

const KINDS = [
  { value: 'week', label: '지난 7일' },
  { value: 'month', label: '지난 30일' },
] as const

// 어제까지의 지난 계획을 날짜별로 모아 본다. 못함으로 바뀐 계획의 회고와 완료한 계획의 결과물을 여기서 다시 연다.
export default function PlanPeriodView({ today }: { today: string }) {
  const [kind, setKind] = useState<'week' | 'month'>('week')
  const { from, to } = periodRange(kind, today)
  const { data, isLoading, isError, refetch } = usePlans(from, to)
  const plans = useMemo(() => data ?? [], [data])
  const summary = summarizePlans(plans)
  const days = groupPlansByDate(plans)

  return (
    <section aria-labelledby="plan-period-heading" className={cn(cardClass, 'sm:p-5')}>
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="plan-period-heading" className="text-base font-semibold text-ink-900">지난 계획</h2>
        <div role="group" aria-label="기간" className="flex rounded-md bg-surface p-0.5">
          {KINDS.map(item => (
            <button
              key={item.value}
              type="button"
              aria-pressed={kind === item.value}
              onClick={() => setKind(item.value)}
              className={cn(
                'rounded px-3 py-1.5 text-sm transition-colors duration-150',
                kind === item.value ? 'bg-white font-medium text-ink-900 shadow-[0_1px_2px_rgba(16,24,40,0.08)]' : 'text-ink-600 hover:text-ink-900',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {isLoading ? (
        <div role="status" aria-label="지난 계획 불러오는 중" className="space-y-3">
          {[0, 1, 2].map(i => <div key={i} className="h-12 animate-pulse rounded-lg bg-surface" />)}
        </div>
      ) : isError ? (
        <div role="alert" className="flex items-center justify-between gap-3 text-sm text-danger">
          <span>지난 계획을 불러오지 못했습니다.</span>
          <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>다시 시도</Button>
        </div>
      ) : plans.length === 0 ? (
        <p className="text-sm text-ink-600">이 기간에 세운 계획이 없습니다.</p>
      ) : (
        <>
          <p className="mb-4 text-sm tabular-nums text-ink-600">
            {summary.total}개 중 완료 {summary.done} · 못함 {summary.failed}
            {summary.planned > 0 && ` · 예정 ${summary.planned}`}
            <span aria-hidden> · </span>
            목표 {formatMinutes(summary.estimatedMinutes)}
            <span aria-hidden> · </span>
            실제 {formatMinutes(summary.actualMinutes)}
          </p>
          <div className="divide-y divide-line">
            {days.map(day => (
              <section key={day.date} aria-labelledby={`plan-day-${day.date}`} className="py-4 first:pt-0 last:pb-0">
                <h3 id={`plan-day-${day.date}`} className="mb-2 text-sm font-semibold text-ink-900">{formatDayHeading(day.date)}</h3>
                <ul className="divide-y divide-line/60">
                  {day.plans.map(plan => <PlanRow key={plan.id} plan={plan} today={today} />)}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
