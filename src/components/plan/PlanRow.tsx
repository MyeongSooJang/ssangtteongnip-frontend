import { useState } from 'react'
import { ChevronDown, Pencil, Trash2 } from 'lucide-react'
import type { Plan } from '@/api/types'
import { useDeletePlan } from '@/hooks/usePlans'
import { getErrorMessage } from '@/lib/errors'
import { CATEGORY_LABELS, MISS_REASON_LABELS, STATUS_LABELS, canComplete, isEditable } from '@/lib/plan'
import { formatMinutes } from '@/lib/studyLog'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import CompletePanel from './CompletePanel'
import EvidenceList from './EvidenceList'
import PlanForm from './PlanForm'
import ReflectionPanel from './ReflectionPanel'
import StatusMark from './StatusMark'

interface PlanRowProps {
  plan: Plan
  today: string
  // 처음부터 펼쳐 둘지. 오늘 날짜의 예정 계획처럼 바로 손댈 일이 있을 때 쓴다.
  defaultOpen?: boolean
}

// 계획 한 줄. 눌러서 펼치면 세부 항목, 결과물, 상태에 맞는 패널(완료·회고)과 수정·삭제가 나온다.
export default function PlanRow({ plan, today, defaultOpen = false }: PlanRowProps) {
  const remove = useDeletePlan()
  const [open, setOpen] = useState(defaultOpen)
  const [editing, setEditing] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bodyId = `plan-body-${plan.id}`
  const failed = plan.status === 'FAILED'
  const done = plan.status === 'DONE'

  const timeText = plan.status !== 'PLANNED' && plan.actualMinutes !== null
    ? formatMinutes(plan.actualMinutes)
    : `목표 ${formatMinutes(plan.estimatedMinutes)}`

  const details = [
    ['완료 기준', plan.doneCriteria],
    ['시간대', plan.timeSlot],
    ['장소', plan.place],
    ['첫 행동', plan.firstAction],
  ].filter((row): row is [string, string] => Boolean(row[1]))

  const deletePlan = async () => {
    setError(null)
    try {
      await remove.mutateAsync(plan.id)
    } catch (e) {
      setError(getErrorMessage(e, '계획을 지우지 못했습니다.'))
      setConfirmingDelete(false)
    }
  }

  return (
    <li className="py-3 first:pt-0 last:pb-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen(value => !value)}
        className="group grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <StatusMark status={plan.status} />
        <span className="min-w-0">
          <span className={cn('block text-sm font-semibold', failed ? 'text-ink-600' : 'text-ink-900')}>
            <span className="sr-only">{STATUS_LABELS[plan.status]}: </span>
            {plan.content}
          </span>
          {failed ? (
            <span className="mt-0.5 block text-sm text-ink-600">
              {plan.missReason ? `못한 이유: ${MISS_REASON_LABELS[plan.missReason]}` : '못한 이유를 남겨 두면 다음 계획에 도움이 됩니다.'}
            </span>
          ) : (
            <span className="mt-0.5 block truncate text-sm text-ink-600">{plan.doneCriteria}</span>
          )}
        </span>
        <span className="flex items-center gap-3 pt-0.5 text-xs text-ink-600">
          {plan.category && <span className="hidden sm:inline">{CATEGORY_LABELS[plan.category]}</span>}
          <span className="tabular-nums">{timeText}</span>
          {(done || failed) && <span className="hidden font-medium text-ink-900 sm:inline">{STATUS_LABELS[plan.status]}</span>}
          <ChevronDown size={16} strokeWidth={1.75} aria-hidden className={cn('transition-transform duration-150', open && 'rotate-180')} />
        </span>
      </button>

      {open && (
        <div id={bodyId} className="mt-3 space-y-4 pl-[30px]">
          {editing ? (
            <PlanForm today={today} plan={plan} onDone={() => setEditing(false)} onCancel={() => setEditing(false)} />
          ) : (
            <>
              <dl className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-4 gap-y-1 text-sm sm:grid-cols-[5rem_minmax(0,1fr)]">
                {details.map(([label, value]) => (
                  <div key={label} className="contents">
                    <dt className="text-ink-600">{label}</dt>
                    <dd className="break-words text-ink-900">{value}</dd>
                  </div>
                ))}
              </dl>

              <EvidenceList plan={plan} today={today} />
              {canComplete(plan, today) && <CompletePanel plan={plan} />}
              {(done || failed) && <ReflectionPanel plan={plan} />}

              {isEditable(plan, today) && (
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
                    <Pencil size={14} aria-hidden />
                    수정
                  </Button>
                  {confirmingDelete ? (
                    <>
                      <span className="text-sm text-ink-600">이 계획과 붙인 결과물을 지웁니다.</span>
                      <Button type="button" variant="destructive" size="sm" disabled={remove.isPending} onClick={() => void deletePlan()}>삭제</Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmingDelete(false)}>취소</Button>
                    </>
                  ) : (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmingDelete(true)}>
                      <Trash2 size={14} aria-hidden />
                      삭제
                    </Button>
                  )}
                </div>
              )}
              {error && <p role="alert" className="text-sm text-danger">{error}</p>}
            </>
          )}
        </div>
      )}
    </li>
  )
}
