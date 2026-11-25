import { useRef, useState } from 'react'
import { FileText, Link2, X } from 'lucide-react'
import { getEvidenceDownload } from '@/api/plans'
import type { Plan, PlanEvidence } from '@/api/types'
import { useAddFileEvidence, useAddLinkEvidence, useRemoveEvidence } from '@/hooks/usePlans'
import { getErrorMessage } from '@/lib/errors'
import { MAX_EVIDENCES, canAddEvidence, validateEvidenceFile, validateLink } from '@/lib/plan'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)}MB` : `${Math.max(1, Math.round(bytes / 1024))}KB`

const evidenceName = (evidence: PlanEvidence) => (evidence.type === 'URL' ? evidence.url : evidence.fileName) ?? '결과물'

// 계획에 붙은 결과물(링크·파일). 못함 상태에서는 보기만 하고, 최대 개수에 닿으면 추가 입력을 숨긴다.
export default function EvidenceList({ plan }: { plan: Plan }) {
  const addLink = useAddLinkEvidence()
  const addFile = useAddFileEvidence()
  const remove = useRemoveEvidence()
  const fileInput = useRef<HTMLInputElement>(null)
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const editable = plan.status !== 'FAILED'
  const busy = addLink.isPending || addFile.isPending || remove.isPending

  const submitLink = async () => {
    const problem = validateLink(url)
    if (problem) return setError(problem)
    setError(null)
    try {
      await addLink.mutateAsync({ id: plan.id, url: url.trim() })
      setUrl('')
    } catch (e) {
      setError(getErrorMessage(e, '링크를 붙이지 못했습니다.'))
    }
  }

  const submitFile = async (file: File | undefined) => {
    if (!file) return
    const problem = validateEvidenceFile(file)
    if (problem) return setError(problem)
    setError(null)
    try {
      await addFile.mutateAsync({ id: plan.id, file })
    } catch (e) {
      setError(getErrorMessage(e, '파일을 올리지 못했습니다.'))
    } finally {
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  const removeOne = async (evidence: PlanEvidence) => {
    setError(null)
    try {
      await remove.mutateAsync({ id: plan.id, evidenceId: evidence.id })
    } catch (e) {
      setError(getErrorMessage(e, '결과물을 지우지 못했습니다.'))
    }
  }

  // 파일 주소는 짧게 유효한 임시 주소라 열 때마다 새로 받는다.
  const openFile = async (evidence: PlanEvidence) => {
    setError(null)
    try {
      const { url: downloadUrl } = await getEvidenceDownload(plan.id, evidence.id)
      window.open(downloadUrl, '_blank', 'noopener,noreferrer')
    } catch (e) {
      setError(getErrorMessage(e, '파일을 열지 못했습니다.'))
    }
  }

  const linkClass = 'min-w-0 flex-1 truncate text-left text-brand-600 underline underline-offset-2 hover:text-brand-700'

  return (
    <section aria-label="결과물" className="space-y-2">
      <h4 className="text-sm font-semibold text-ink-900">
        결과물 <span className="font-normal tabular-nums text-ink-600">{plan.evidences.length}/{MAX_EVIDENCES}</span>
      </h4>

      {plan.evidences.length === 0 ? (
        <p className="text-sm text-ink-600">{editable ? '링크나 파일을 붙여 두면 완료할 수 있습니다.' : '붙인 결과물이 없습니다.'}</p>
      ) : (
        <ul className="divide-y divide-line rounded-lg border border-line">
          {plan.evidences.map(evidence => (
            <li key={evidence.id} className="flex items-center gap-2 px-3 py-2 text-sm">
              {evidence.type === 'URL'
                ? <Link2 size={15} strokeWidth={1.75} aria-hidden className="shrink-0 text-ink-600" />
                : <FileText size={15} strokeWidth={1.75} aria-hidden className="shrink-0 text-ink-600" />}
              {evidence.type === 'URL' && evidence.url ? (
                <a href={evidence.url} target="_blank" rel="noopener noreferrer" className={linkClass}>{evidence.url}</a>
              ) : (
                <button type="button" onClick={() => void openFile(evidence)} className={linkClass}>
                  {evidence.fileName ?? '파일'}
                </button>
              )}
              {evidence.type === 'FILE' && evidence.sizeBytes !== null && (
                <span className="shrink-0 text-xs tabular-nums text-ink-600">{formatSize(evidence.sizeBytes)}</span>
              )}
              {editable && (
                <button
                  type="button"
                  aria-label={`${evidenceName(evidence)} 지우기`}
                  disabled={busy}
                  onClick={() => void removeOne(evidence)}
                  className="shrink-0 rounded p-1 text-ink-600 transition-colors hover:bg-surface hover:text-ink-900 disabled:opacity-50"
                >
                  <X size={14} aria-hidden />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canAddEvidence(plan) ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            type="url"
            inputMode="url"
            aria-label="결과물 링크"
            placeholder="https://github.com/..."
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void submitLink() } }}
            className="sm:flex-1"
          />
          <div className="flex gap-2">
            <Button type="button" variant="outline" disabled={busy} onClick={() => void submitLink()}>링크 붙이기</Button>
            <Button type="button" variant="outline" disabled={busy} onClick={() => fileInput.current?.click()}>파일 올리기</Button>
            <input
              ref={fileInput}
              type="file"
              hidden
              aria-label="결과물 파일"
              accept="application/pdf,image/png,image/jpeg,image/gif,image/webp"
              onChange={e => void submitFile(e.target.files?.[0])}
            />
          </div>
        </div>
      ) : (
        editable && <p className="text-xs text-ink-600">결과물은 {MAX_EVIDENCES}개까지 붙일 수 있습니다.</p>
      )}

      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </section>
  )
}
