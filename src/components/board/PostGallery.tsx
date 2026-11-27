import type { PostImage } from '@/api/types'
import { toDisplayUrl } from '@/api/images'

// 이미지는 GET이 공개라 <img>로 바로 불러온다. 누르면 원본을 새 탭에서 연다.
export default function PostGallery({ images }: { images: PostImage[] }) {
  if (images.length === 0) return null
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {images.map((image, i) => {
        const src = toDisplayUrl(image.url)
        return (
          <li key={image.id} className="overflow-hidden rounded-lg border border-line bg-surface">
            <a href={src} target="_blank" rel="noopener noreferrer">
              <img src={src} alt={`첨부 이미지 ${i + 1}`} loading="lazy" className="h-full w-full object-cover" />
            </a>
          </li>
        )
      })}
    </ul>
  )
}
