import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import { usePosts } from '@/hooks/usePosts'
import { clampPage, totalPages } from '@/lib/pagination'
import PostRow from '@/components/board/PostRow'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/ui/pagination'

// 주소의 page는 1부터이고 서버의 page는 0부터다. 잘못된 값은 1페이지로 본다.
function readPage(value: string | null): number {
  const page = Number(value)
  return Number.isInteger(page) && page >= 1 ? page : 1
}

export default function Board() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = readPage(searchParams.get('page'))
  const { data, isLoading, isError } = usePosts(page - 1)

  const pageCount = data ? totalPages(data.totalCount, data.pageSize) : 1
  // 서버는 범위를 벗어난 페이지에 posts=[]와 totalCount>0을 준다. 마지막 페이지로 옮긴다.
  const outOfRange = !!data && data.posts.length === 0 && data.totalCount > 0 && page > pageCount

  useEffect(() => {
    if (outOfRange) setSearchParams(pageCount === 1 ? {} : { page: String(pageCount) }, { replace: true })
  }, [outOfRange, pageCount, setSearchParams])

  return (
    <div className="space-y-6 font-sans">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink-900">게시판</h1>
          <p className="mt-1 text-sm text-slate-500">취준생끼리 정보와 후기를 나누는 곳입니다.</p>
        </div>
        <Button asChild variant="brand">
          <Link to="/board/new"><Pencil aria-hidden />글쓰기</Link>
        </Button>
      </header>

      {isLoading || outOfRange ? (
        <p className="text-slate-500">불러오는 중...</p>
      ) : isError || !data ? (
        <p role="alert" className="p-4 text-danger">글 목록을 불러오지 못했습니다.</p>
      ) : data.posts.length === 0 ? (
        <p className="rounded-xl border border-line bg-white p-10 text-center text-slate-500">아직 글이 없어요. 첫 글을 남겨보세요.</p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
          {data.posts.map(post => <PostRow key={post.id} post={post} />)}
        </ul>
      )}

      {data && (
        <Pagination
          page={clampPage(page, pageCount)}
          totalPages={pageCount}
          onChange={next => setSearchParams(next === 1 ? {} : { page: String(next) })}
        />
      )}
    </div>
  )
}
