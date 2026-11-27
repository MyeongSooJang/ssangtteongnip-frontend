import type { PostImage } from '@/api/types'
import { toDisplayUrl } from '@/api/images'

// 이미지는 GET이 공개라 <img>로 바로 불러온다. 누르면 원본을 새 탭에서 연다.
// 캡처 화면처럼 비율이 제각각인 이미지가 잘리지 않도록 자르지 않고 담는다.
// numbers는 본문에 쓰지 않은 이미지만 모아 보여줄 때, 각 이미지가 글 전체에서 몇 번째인지(1부터)를 알려 alt가 원래 번호를 말하게 한다.
export default function PostGallery({ images, numbers }: { images: PostImage[]; numbers?: number[] }) {
  if (images.length === 0) return null
  return (
    <ul className={images.length === 1 ? 'grid gap-3' : 'grid gap-3 sm:grid-cols-2'}>
      {images.map((image, i) => {
        const src = toDisplayUrl(image.url)
        return (
          <li key={image.id} className="overflow-hidden rounded-lg border border-line bg-surface">
            <a href={src} target="_blank" rel="noopener noreferrer">
              <img src={src} alt={`첨부 이미지 ${numbers?.[i] ?? i + 1}`} loading="lazy" className="max-h-[28rem] w-full object-contain" />
            </a>
          </li>
        )
      })}
    </ul>
  )
}
