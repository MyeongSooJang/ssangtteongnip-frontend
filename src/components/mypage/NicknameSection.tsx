import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { useChangeNickname, useNickname } from '@/hooks/useNickname'
import { validateNickname } from '@/lib/nickname'
import { getErrorMessage } from '@/lib/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function NicknameSection() {
  const { data, isLoading, isError } = useNickname()
  const { mutate, isPending, error, reset } = useChangeNickname()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  if (isLoading) return <div className="text-slate-500">불러오는 중...</div>
  if (isError || !data) return <p role="alert" className="p-4 text-danger">닉네임을 불러오지 못했습니다.</p>

  const nickname = data.nickname

  const startEdit = () => {
    setDraft(nickname ?? '')
    setFormError(null)
    reset()
    setEditing(true)
  }

  const cancel = () => {
    setFormError(null)
    reset()
    setEditing(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const problem = validateNickname(draft)
    if (problem) {
      setFormError(problem)
      return
    }
    setFormError(null)
    mutate(draft.trim(), { onSuccess: () => setEditing(false) })
  }

  const message = formError ?? (error ? getErrorMessage(error, '닉네임을 바꾸지 못했습니다. 잠시 후 다시 시도해주세요.') : null)

  return (
    <section className="rounded-xl border border-line bg-white p-6">
      <h2 className="text-base font-semibold text-ink-900">닉네임</h2>
      <p className="mt-1 text-sm text-slate-500">게시판에서 이름 대신 보이는 이름입니다. 한글, 영문, 숫자 2~10자로 정할 수 있습니다.</p>

      {editing ? (
        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="nickname" className="text-ink-900">닉네임</Label>
            <Input
              id="nickname"
              autoComplete="nickname"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              aria-invalid={message ? true : undefined}
            />
            {message && <p role="alert" className="text-sm text-danger">{message}</p>}
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="brand" size="sm" disabled={isPending}>{isPending ? '저장 중...' : '저장'}</Button>
            <Button type="button" variant="outline" size="sm" onClick={cancel} disabled={isPending}>취소</Button>
          </div>
        </form>
      ) : (
        <div className="mt-5 flex items-center justify-between gap-3">
          {nickname ? (
            <p className="text-lg font-semibold text-ink-900">{nickname}</p>
          ) : (
            <p className="text-sm text-ink-600">아직 닉네임이 없어요. 닉네임을 정하면 게시판에 글을 쓸 수 있습니다.</p>
          )}
          <Button type="button" variant="outline" size="sm" onClick={startEdit}>
            <Pencil aria-hidden />
            {nickname ? '변경' : '설정'}
          </Button>
        </div>
      )}
    </section>
  )
}
