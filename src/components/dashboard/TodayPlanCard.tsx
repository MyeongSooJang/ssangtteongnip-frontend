import { Link } from 'react-router-dom'
import type { Plan } from '@/api/types'
import { STATUS_LABELS } from '@/lib/plan'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import StatusMark from '@/components/plan/StatusMark'

const VISIBLE = 3

// 오늘 계획의 진행. 통계 API 없이 오늘 목록만으로 계산하므로 개수와 앞의 몇 개만 보여준다.
export default function TodayPlanCard({ plans }: { plans: Plan[] }) {
  const sorted = [...plans].sort((a, b) => a.id - b.id)
  const done = sorted.filter(plan => plan.status === 'DONE').length
  const rest = sorted.length - VISIBLE

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="flex-row items-baseline justify-between space-y-0">
        <CardTitle className="text-base font-semibold text-slate-700">오늘 계획</CardTitle>
        <Link to="/plans" className="text-sm font-medium text-brand-600 hover:text-brand-700">
          {sorted.length === 0 ? '계획 세우기' : '전체 보기'}
        </Link>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="py-2 text-sm text-slate-400">오늘 세운 계획이 없습니다.</p>
        ) : (
          <>
            <p className="mb-3 text-sm tabular-nums text-slate-500">{sorted.length}개 중 {done}개 완료</p>
            <ul className="space-y-2">
              {sorted.slice(0, VISIBLE).map(plan => (
                <li key={plan.id} className="flex items-start gap-3 text-sm">
                  <StatusMark status={plan.status} />
                  <span className="min-w-0 truncate font-medium text-slate-700">
                    <span className="sr-only">{STATUS_LABELS[plan.status]}: </span>
                    {plan.content}
                  </span>
                </li>
              ))}
            </ul>
            {rest > 0 && <p className="mt-2 text-sm text-slate-400">외 {rest}개</p>}
          </>
        )}
      </CardContent>
    </Card>
  )
}
