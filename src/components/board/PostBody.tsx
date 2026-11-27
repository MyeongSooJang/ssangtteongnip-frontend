import type { PostImage } from '@/api/types'
import { toDisplayUrl } from '@/api/images'
import { splitPostBody } from '@/lib/postBody'
import PostGallery from './PostGallery'

// 글 속 `[이미지 N]` 자리에 N번째 이미지를 넣어 보여준다(서버는 이미지 위치를 저장하지 않는다).
// 어디에도 쓰이지 않은 이미지는 예전 글과 똑같이 맨 아래에 모아 둔다. 글은 항상 텍스트로만 그린다.
export default function PostBody({ content, images }: { content: string; images: PostImage[] }) {
  const { parts, unreferenced } = splitPostBody(content, images.length)
  return (
    <div className="space-y-4">
      {parts.map((part, i) => {
        if (part.type === 'text') {
          return <p key={i} className="whitespace-pre-wrap break-words leading-relaxed text-ink-900">{part.text}</p>
        }
        const src = toDisplayUrl(images[part.index].url)
        return (
          <figure key={i} className="overflow-hidden rounded-lg border border-line bg-surface">
            <a href={src} target="_blank" rel="noopener noreferrer">
              <img src={src} alt={`첨부 이미지 ${part.index + 1}`} loading="lazy" className="max-h-[28rem] w-full object-contain" />
            </a>
          </figure>
        )
      })}
      <PostGallery images={unreferenced.map(i => images[i])} numbers={unreferenced.map(i => i + 1)} />
    </div>
  )
}
