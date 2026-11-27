import { useState } from 'react'
import type { PostImage } from '@/api/types'
import {
  POST_CONTENT_MAX, POST_IMAGE_MAX, POST_TITLE_MAX, validatePost, validatePostImage,
} from '@/lib/post'
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
        <Textarea id="post-content" rows={12} value={content} onChange={e => { setContent(e.target.value); setFormError(null) }} />
        <p className="text-right text-xs text-slate-500">{content.length} / {POST_CONTENT_MAX}</p>
      </div>

      <ImagePicker
        existing={kept}
        added={added}
        max={POST_IMAGE_MAX}
        onAdd={addImages}
        onRemoveExisting={id => { setKept(prev => prev.filter(image => image.id !== id)); setImageError(null) }}
        onRemoveAdded={index => { setAdded(prev => prev.filter((_, i) => i !== index)); setImageError(null) }}
      />

      {message && <p role="alert" className="text-sm text-danger">{message}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>취소</Button>
        <Button type="submit" variant="brand" disabled={isPending}>{isPending ? `${submitLabel} 중...` : submitLabel}</Button>
      </div>
    </form>
  )
}
