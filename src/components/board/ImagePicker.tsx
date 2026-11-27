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
  // 본문 커서 위치에 [이미지 N] 표시를 넣는다. N은 기존 이미지 뒤에 새 이미지를 이어 붙인 목록에서의 1부터 센 순번이다.
  onInsert: (n: number) => void
}

// File마다 바뀌지 않는 key. 배열 위치를 key로 쓰면 하나를 지울 때 나머지의 미리보기 주소가 다시 만들어진다.
const fileIds = new WeakMap<File, number>()
let nextFileId = 0
function fileKey(file: File): number {
  let id = fileIds.get(file)
  if (id === undefined) {
    id = nextFileId++
    fileIds.set(file, id)
  }
  return id
}

// 파일 하나의 미리보기 주소. 개발 모드에서 효과가 두 번 실행돼도 주소가 깨지지 않도록 효과 안에서 만들고 정리한다.
function AddedThumbnail({ file, number, onRemove, onInsert }: ThumbnailActions & { file: File }) {
  const [src, setSrc] = useState<string>()
  useEffect(() => {
    const url = URL.createObjectURL(file)
    setSrc(url)
    return () => URL.revokeObjectURL(url)
  }, [file])
  return <Thumbnail src={src} number={number} onRemove={onRemove} onInsert={onInsert} />
}

interface ThumbnailActions {
  number: number
  onRemove: () => void
  onInsert: () => void
}

function Thumbnail({ src, number, onRemove, onInsert }: ThumbnailActions & { src?: string }) {
  return (
    <li className="w-24 space-y-1.5">
      <div className="relative h-24 w-24 overflow-hidden rounded-lg border border-line bg-surface">
        {src && <img src={src} alt={`이미지 ${number}`} className="h-full w-full object-cover" />}
        <span aria-hidden className="absolute bottom-1 left-1 rounded bg-ink-900/70 px-1.5 text-xs font-medium tabular-nums text-white">{number}</span>
        <button
          type="button"
          aria-label="이미지 제거"
          onClick={onRemove}
          className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-ink-900/70 text-white transition-colors hover:bg-ink-900"
        >
          <X size={14} aria-hidden />
        </button>
      </div>
      <Button type="button" variant="outline" size="sm" aria-label={`이미지 ${number} 본문에 넣기`} onClick={onInsert} className="h-8 w-full px-0 text-xs">
        본문에 넣기
      </Button>
    </li>
  )
}

export default function ImagePicker({ existing, added, max, onAdd, onRemoveExisting, onRemoveAdded, onInsert }: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const count = existing.length + added.length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ink-900">이미지 <span className="font-normal text-ink-600">{count} / {max}</span></span>
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
        <>
          <p className="text-xs text-ink-600">본문에서 넣고 싶은 위치에 커서를 두고 '본문에 넣기'를 누르세요. 넣지 않은 이미지는 글 맨 아래에 나옵니다.</p>
          <ul className="flex flex-wrap gap-3">
            {existing.map((image, i) => (
              <Thumbnail key={image.id} src={toDisplayUrl(image.url)} number={i + 1} onRemove={() => onRemoveExisting(image.id)} onInsert={() => onInsert(i + 1)} />
            ))}
            {added.map((file, i) => (
              <AddedThumbnail key={fileKey(file)} file={file} number={existing.length + i + 1} onRemove={() => onRemoveAdded(i)} onInsert={() => onInsert(existing.length + i + 1)} />
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
