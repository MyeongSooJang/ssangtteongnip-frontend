import { useLayoutEffect, useRef, useState } from 'react'
import type { PostImage } from '@/api/types'
import {
  POST_CONTENT_MAX, POST_IMAGE_MAX, POST_TITLE_MAX, validatePost, validatePostImage,
} from '@/lib/post'
import { insertImageMarker, removeImageMarker } from '@/lib/postBody'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import ImagePicker from './ImagePicker'

export interface PostFormValue {
  title: string
  content: string
  keepImageIds: string[]
  newImages: File[]
}

interface PostFormProps {
  initialTitle?: string
  initialContent?: string
  initialImages?: PostImage[]
  submitLabel: string
  isPending: boolean
  serverError: string | null
  onSubmit: (value: PostFormValue) => void
  onCancel: () => void
}

export default function PostForm({
  initialTitle = '', initialContent = '', initialImages = [], submitLabel, isPending, serverError, onSubmit, onCancel,
}: PostFormProps) {
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [kept, setKept] = useState(initialImages)
  const [added, setAdded] = useState<File[]>([])
  const [formError, setFormError] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)
  // 표시를 넣은 뒤 커서를 둘 위치. 글이 다시 그려진 다음에야 값이 바뀌어 있으므로 레이아웃 효과에서 옮긴다.
  const pendingCaret = useRef<number | null>(null)

  useLayoutEffect(() => {
    const caret = pendingCaret.current
    const textarea = contentRef.current
    if (caret === null || !textarea) return
    pendingCaret.current = null
    textarea.focus()
    textarea.setSelectionRange(caret, caret)
  }, [content])

  // 사용자가 내용 칸에 커서를 둔 적이 있는지. 브라우저는 포커스 전에도 selectionStart를 0으로 돌려줘서(수정 화면이면 맨 앞이 된다) 이것으로 구분한다.
  const caretPlaced = useRef(false)
  const markCaret = () => { caretPlaced.current = true }

  // 커서 위치에 [이미지 N] 표시를 넣는다. 커서를 둔 적이 없으면 맨 끝에 넣는다.
  const insertImage = (n: number) => {
    const cursor = caretPlaced.current ? contentRef.current?.selectionStart ?? content.length : content.length
    const next = insertImageMarker(content, cursor, n)
    pendingCaret.current = next.cursor
    setContent(next.content)
    setFormError(null)
  }

  // 이미지를 빼면 본문의 표시도 함께 지우고 뒤 번호를 당겨, 번호와 이미지가 어긋나지 않게 한다.
  const removeExisting = (id: string) => {
    const number = kept.findIndex(image => image.id === id) + 1
    setKept(prev => prev.filter(image => image.id !== id))
    if (number > 0) setContent(prev => removeImageMarker(prev, number))
    setImageError(null)
  }

  const removeAdded = (index: number) => {
    const number = kept.length + index + 1
    setAdded(prev => prev.filter((_, i) => i !== index))
    setContent(prev => removeImageMarker(prev, number))
    setImageError(null)
  }

  // 고른 파일 중 규칙에 맞는 것만, 남은 자리만큼 받는다. 거른 이유는 안내한다.
  const addImages = (selected: File[]) => {
    const problem = selected.map(validatePostImage).find((message): message is string => message !== null) ?? null
    const valid = selected.filter(file => validatePostImage(file) === null)
    const room = POST_IMAGE_MAX - kept.length - added.length
    setAdded(prev => [...prev, ...valid.slice(0, room)])
    setImageError(problem ?? (valid.length > room ? `이미지는 글당 ${POST_IMAGE_MAX}장까지 첨부할 수 있습니다.` : null))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const problem = validatePost({ title, content })
    if (problem) {
      setFormError(problem)
      return
    }
    setFormError(null)
    onSubmit({ title: title.trim(), content, keepImageIds: kept.map(image => image.id), newImages: added })
  }

  const message = formError ?? imageError ?? serverError

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="post-title" className="text-ink-900">제목</Label>
        <Input id="post-title" value={title} onChange={e => { setTitle(e.target.value); setFormError(null) }} maxLength={POST_TITLE_MAX} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="post-content" className="text-ink-900">내용</Label>
        <Textarea ref={contentRef} id="post-content" rows={12} value={content} onFocus={markCaret} onSelect={markCaret} onClick={markCaret} onKeyUp={markCaret}onChange={e => { setContent(e.target.value); setFormError(null) }} />
        <p className="text-right text-xs text-ink-600">{content.length} / {POST_CONTENT_MAX}</p>
      </div>

      <ImagePicker
        existing={kept}
        added={added}
        max={POST_IMAGE_MAX}
        onAdd={addImages}
        onRemoveExisting={removeExisting}
        onRemoveAdded={removeAdded}
        onInsert={insertImage}
      />

      {message && <p role="alert" className="text-sm text-danger">{message}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>취소</Button>
        <Button type="submit" variant="brand" disabled={isPending}>{isPending ? `${submitLabel} 중...` : submitLabel}</Button>
      </div>
    </form>
  )
}
