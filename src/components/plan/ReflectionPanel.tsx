import { useState } from 'react'
import type { MissReason, Plan } from '@/api/types'
import { useReflectPlan } from '@/hooks/usePlans'
import { getErrorMessage } from '@/lib/errors'
import { ACTUAL_MINUTES_ERROR, MAX_MINUTES, MISS_REASON_LABELS, isValidActualMinutes } from '@/lib/plan'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const MISS_REASONS = Object.keys(MISS_REASON_LABELS) as MissReason[]

// 지난 계획의 회고. 못함은 실제 시간·못한 이유·메모를, 완료는 메모만 남긴다(서버 규칙).
export default function ReflectionPanel({ plan }: { plan: Plan }) {
  const reflect = useReflectPlan()
  const failed = plan.status === 'FAILED'
  const [minutes, setMinutes] = useState(plan.actualMinutes === null ? '' : String(plan.actualMinutes))
  const [reason, setReason] = useState<MissReason | null>(plan.missReason)
  const [memo, setMemo] = useState(plan.memo ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const submit = async () => {
    const actualMinutes = Number(minutes)
    if (failed && minutes.trim() !== '' && !isValidActualMinutes(minutes)) return setError(ACTUAL_MINUTES_ERROR)
    setError(null)
    setSaved(false)
    try {
      await reflect.mutateAsync({
        id: plan.id,
        data: failed
          ? { actualMinutes: minutes.trim() === '' ? undefined : actualMinutes, missReason: reason ?? undefined, memo: memo.trim() }
          : { memo: memo.trim() },
      })
      setSaved(true)
    } catch (e) {
      setError(getErrorMessage(e, '회고를 저장하지 못했습니다.'))
    }
  }

  return (
    <section aria-label="회고" className="space-y-3">
      <h4 className="text-sm font-semibold text-ink-900">회고</h4>

      {failed && (
        <>
          <div role="group" aria-label="못한 이유" className="flex flex-wrap gap-2">
            {MISS_REASONS.map(value => (
              <button
                key={value}
                type="button"
                aria-pressed={reason === value}
                // 서버는 값이 없으면 "바꾸지 않음"으로 보므로 한 번 고른 이유는 지울 수 없고 다른 이유로 바꾸기만 한다.
                onClick={() => setReason(value)}
                className={cn(
                  'rounded-md border px-3 py-1.5 text-sm transition-colors duration-150',
                  reason === value ? 'border-brand-500 bg-brand-50 font-medium text-brand-700' : 'border-line text-ink-600 hover:bg-surface',
                )}
              >
                {MISS_REASON_LABELS[value]}
              </button>
            ))}
          </div>
          <label className="block max-w-[8rem] space-y-1 text-sm font-medium text-ink-900">
            실제 시간(분)
            <Input type="number" min={0} max={MAX_MINUTES} inputMode="numeric" value={minutes} onChange={e => setMinutes(e.target.value)} className="tabular-nums" />
          </label>
        </>
      )}

      <label className="block space-y-1 text-sm font-medium text-ink-900">
        메모 <span className="font-normal text-ink-600">(선택)</span>
        <Input maxLength={200} value={memo} onChange={e => setMemo(e.target.value)} />
      </label>

      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" disabled={reflect.isPending} onClick={() => void submit()}>회고 저장</Button>
        {saved && <span role="status" className="text-sm text-ink-600">저장했습니다.</span>}
      </div>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </section>
  )
}
