import { useState } from 'react'
import type { Plan } from '@/api/types'
import { useCompletePlan } from '@/hooks/usePlans'
import { getErrorMessage } from '@/lib/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// 오늘 계획을 끝냈다고 표시한다. 결과물이 1개 이상 있어야 하므로 없으면 버튼을 막고 이유를 알려준다.
export default function CompletePanel({ plan }: { plan: Plan }) {
  const complete = useCompletePlan()
  const [minutes, setMinutes] = useState(String(plan.estimatedMinutes))
  const [memo, setMemo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const hasEvidence = plan.evidences.length > 0

  const submit = async () => {
    const actualMinutes = Number(minutes)
    if (minutes.trim() === '' || !Number.isInteger(actualMinutes) || actualMinutes < 0) {
      return setError('실제 걸린 시간을 0분 이상으로 입력해 주세요.')
    }
    setError(null)
    try {
      await complete.mutateAsync({ id: plan.id, data: { actualMinutes, memo: memo.trim() || undefined } })
    } catch (e) {
      setError(getErrorMessage(e, '완료하지 못했습니다.'))
    }
  }

  return (
    <section aria-label="완료하기" className="space-y-3 rounded-lg bg-surface p-3">
      <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
        <label className="space-y-1 text-sm font-medium text-ink-900">
          실제 걸린 시간(분)
          <Input type="number" min={0} inputMode="numeric" value={minutes} onChange={e => setMinutes(e.target.value)} className="tabular-nums" />
        </label>
        <label className="space-y-1 text-sm font-medium text-ink-900">
          메모 <span className="font-normal text-ink-600">(선택)</span>
          <Input maxLength={200} value={memo} onChange={e => setMemo(e.target.value)} />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="brand" disabled={!hasEvidence || complete.isPending} onClick={() => void submit()}>
          완료로 표시
        </Button>
        {!hasEvidence && <span className="text-sm text-ink-600">완료하려면 결과물이 1개 이상 필요합니다.</span>}
      </div>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </section>
  )
}
