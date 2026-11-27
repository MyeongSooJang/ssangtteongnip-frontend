import { useEffect, useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import type { PostImage } from '@/api/types'
import { toDisplayUrl } from '@/api/images'
import { POST_IMAGE_ACCEPT } from '@/lib/post'
import { Button } from '@/components/ui/button'

interface ImagePickerProps {
  existing: PostImage[]
  added: File[]
  max: number
  onAdd: (files: File[]) => void
  onRemoveExisting: (id: string) => void
  onRemoveAdded: (index: number) => void
}

// 고른 파일의 미리보기 주소. 개발 모드에서 효과가 두 번 실행돼도 주소가 깨지지 않도록 효과 안에서 만들고 정리한다.
function useObjectUrls(files: File[]): string[] {
  const [urls, setUrls] = useState<string[]>([])
  useEffect(() => {
    const next = files.map(file => URL.createObjectURL(file))
    setUrls(next)
    return () => next.forEach(url => URL.revokeObjectURL(url))
  }, [files])
  return urls
}

function Thumbnail({ src, alt, onRemove }: { src?: string; alt: string; onRemove: () => void }) {
  return (
    <li className="relative h-24 w-24 overflow-hidden rounded-lg border border-line bg-surface">
      {src && <img src={src} alt={alt} className="h-full w-full object-cover" />}
      <button
        type="button"
        aria-label="이미지 제거"
        onClick={onRemove}
        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink-900/70 text-white transition-colors hover:bg-ink-900"
      >
        <X size={14} aria-hidden />
      </button>
    </li>
  )
}

export default function ImagePicker({ existing, added, max, onAdd, onRemoveExisting, onRemoveAdded }: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const addedUrls = useObjectUrls(added)
  const count = existing.length + added.length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ink-900">이미지 <span className="font-normal text-slate-500">{count} / {max}</span></span>
        <Button type="button" variant="outline" size="sm" disabled={count >= max} onClick={() => inputRef.current?.click()}>
          <ImagePlus aria-hidden />이미지 추가
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={POST_IMAGE_ACCEPT}
          aria-label="이미지 파일 선택"
          className="hidden"
          onChange={e => {
            onAdd(Array.from(e.target.files ?? []))
            // 같은 파일을 지웠다가 다시 고를 수 있도록 선택값을 비운다.
            e.target.value = ''
          }}
        />
      </div>
      {count > 0 && (
        <ul className="flex flex-wrap gap-3">
          {existing.map((image, i) => (
            <Thumbnail key={image.id} src={toDisplayUrl(image.url)} alt={`기존 이미지 ${i + 1}`} onRemove={() => onRemoveExisting(image.id)} />
          ))}
          {added.map((file, i) => (
            <Thumbnail key={`${file.name}-${i}`} src={addedUrls[i]} alt={`새 이미지 ${i + 1}`} onRemove={() => onRemoveAdded(i)} />
          ))}
        </ul>
      )}
    </div>
  )
}
