import type { PlanStatus } from '@/api/types'

// 상태를 색만으로 나누지 않도록 모양을 다르게 한다. 예정은 빈 원, 완료는 채운 원과 체크, 못함은 빗금 친 원.
export default function StatusMark({ status }: { status: PlanStatus }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden className="mt-0.5 shrink-0">
      {status === 'DONE' ? (
        <>
          <circle cx="9" cy="9" r="8" className="fill-brand-500" />
          <path d="M5.5 9.2l2.4 2.4 4.6-4.9" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : status === 'FAILED' ? (
        <>
          <circle cx="9" cy="9" r="7.25" className="stroke-ink-600" strokeWidth="1.5" />
          <path d="M4.5 13.5l9-9" className="stroke-ink-600" strokeWidth="1.5" strokeLinecap="round" />
        </>
      ) : (
        <circle cx="9" cy="9" r="7.25" className="stroke-ink-400" strokeWidth="1.5" />
      )}
    </svg>
  )
}
