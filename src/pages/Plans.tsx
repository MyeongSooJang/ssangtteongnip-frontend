import { useState } from 'react'
import { Plus } from 'lucide-react'
import { usePlans } from '@/hooks/usePlans'
import { formatDayHeading, formatMinutes, toDateKey } from '@/lib/studyLog'
import { planDateOptions, summarizePlans } from '@/lib/plan'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { cardClass } from '@/components/studylog/cardClass'
import PlanForm from '@/components/plan/PlanForm'
import PlanPeriodView from '@/components/plan/PlanPeriodView'
import PlanRow from '@/components/plan/PlanRow'

// 오늘과 내일의 계획을 세우고 끝내는 화면. 어제까지의 계획은 아래 "지난 계획"에서 다시 연다.
export default function Plans() {
  const today = toDateKey(new Date())
  const [todayKey, tomorrowKey] = planDateOptions(today)
  // 날짜 문자열이 아니라 위치로 기억한다. 자정이 지나 오늘이 바뀌어도 선택이 어느 탭도 가리키지 않는 상태가 되지 않는다.
  const [dayIndex, setDayIndex] = useState<0 | 1>(0)
  const selected = dayIndex === 0 ? todayKey : tomorrowKey
  const [adding, setAdding] = useState(false)
  const { data, isLoading, isError, refetch } = usePlans(todayKey, tomorrowKey)

  const all = data ?? []
  const dayPlans = all.filter(plan => plan.planDate === selected).sort((a, b) => a.id - b.id)
  const summary = summarizePlans(dayPlans)
  // 계획이 하나도 없으면 입력칸을 바로 펼쳐 둔다. 쓰기 시작하기까지 클릭을 줄이기 위해서다.
  const showForm = adding || (!isLoading && !isError && dayPlans.length === 0)

  const tabs = [
    { date: todayKey, label: '오늘' },
    { date: tomorrowKey, label: '내일' },
  ]

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">계획</h1>
          <p className="mt-1 text-sm text-ink-600">{formatDayHeading(selected)}</p>
        </div>
        <div role="group" aria-label="계획 날짜" className="flex rounded-md bg-white p-0.5 ring-1 ring-line">
          {tabs.map(tab => (
            <button
              key={tab.date}
              type="button"
              aria-pressed={selected === tab.date}
              onClick={() => { setDayIndex(tab.date === todayKey ? 0 : 1); setAdding(false) }}
              className={cn(
                'rounded px-4 py-2 text-sm transition-colors duration-150',
                selected === tab.date ? 'bg-brand-500 font-medium text-white' : 'text-ink-600 hover:text-ink-900',
              )}
            >
              {tab.label}
              <span className="ml-1.5 text-xs tabular-nums opacity-80">{all.filter(plan => plan.planDate === tab.date).length}</span>
            </button>
          ))}
        </div>
      </div>

      <section aria-label={`${selected === todayKey ? '오늘' : '내일'} 계획`} className={cn(cardClass, 'sm:p-5')}>
        {isLoading ? (
          <div role="status" aria-label="계획 불러오는 중" className="space-y-3">
            {[0, 1].map(i => <div key={i} className="h-12 animate-pulse rounded-lg bg-surface" />)}
          </div>
        ) : isError ? (
          <div role="alert" className="flex items-center justify-between gap-3 text-sm text-danger">
            <span>계획을 불러오지 못했습니다.</span>
            <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>다시 시도</Button>
          </div>
        ) : (
          <>
            {dayPlans.length > 0 && (
              <>
                <p className="mb-4 text-sm tabular-nums text-ink-600">
                  {summary.total}개 중 {summary.done}개 완료 · 목표 {formatMinutes(summary.estimatedMinutes)}
                </p>
                <ul className="divide-y divide-line">
                  {dayPlans.map(plan => (
                    <PlanRow key={plan.id} plan={plan} today={today} defaultOpen={plan.planDate === todayKey && plan.status === 'PLANNED' && plan.evidences.length === 0 && dayPlans.length === 1} />
                  ))}
                </ul>
              </>
            )}

            {showForm ? (
              <div className={cn(dayPlans.length > 0 && 'mt-4 border-t border-line pt-4')}>
                {dayPlans.length === 0 && (
                  <p className="mb-3 text-sm text-ink-600">
                    {selected === todayKey ? '오늘 끝낼 일을 적어 보세요.' : '내일 할 일을 미리 적어 두세요.'}
                  </p>
                )}
                <PlanForm
                  key={selected}
                  today={today}
                  defaultDate={selected}
                  onDone={() => setAdding(false)}
                  onCancel={dayPlans.length > 0 ? () => setAdding(false) : undefined}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-brand-100 py-2 text-sm font-medium text-brand-600 transition-colors duration-150 hover:bg-brand-50"
              >
                <Plus size={15} aria-hidden />
                계획 추가
              </button>
            )}
          </>
        )}
      </section>

      <PlanPeriodView today={today} />
    </div>
  )
}
