import { Link } from 'react-router-dom'
import { Image as ImageIcon } from 'lucide-react'
import type { PostSummary } from '@/api/types'
import { formatPostDate } from '@/lib/post'

export default function PostRow({ post }: { post: PostSummary }) {
  return (
    <li>
      <Link
        to={`/board/${post.id}`}
        className="flex flex-col gap-1 px-4 py-3.5 transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:flex-row sm:items-center sm:gap-4"
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate font-medium text-ink-900">{post.title}</span>
          {post.imageCount > 0 && (
            <span className="flex shrink-0 items-center gap-1 text-xs text-ink-600" aria-label={`이미지 ${post.imageCount}장`}>
              <ImageIcon size={13} aria-hidden />
              {post.imageCount}
            </span>
          )}
        </span>
        <span className="flex shrink-0 items-center gap-3 text-sm text-ink-600">
          <span>{post.nickname}</span>
          <time dateTime={post.createdAt} className="tabular-nums">{formatPostDate(post.createdAt)}</time>
        </span>
      </Link>
    </li>
  )
}
