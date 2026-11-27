import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { useDeletePost, usePost } from '@/hooks/usePosts'
import { formatPostDateTime } from '@/lib/post'
import { getErrorMessage } from '@/lib/errors'
import PostBody from '@/components/board/PostBody'
import PostLoadError from '@/components/board/PostLoadError'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function BoardDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: post, isLoading, isError, error } = usePost(Number(id))
  const { mutate: remove, isPending: deleting, error: deleteError, reset } = useDeletePost()
  const [confirming, setConfirming] = useState(false)

  if (isLoading) return <p className="text-ink-600">불러오는 중...</p>
  if (isError || !post) return <PostLoadError error={error} />

  const closeConfirm = () => {
    reset()
    setConfirming(false)
  }

  return (
    <article className="mx-auto max-w-3xl space-y-6 font-sans">
      <Link to="/board" className="inline-flex items-center gap-1 text-sm text-ink-600 hover:text-ink-900">
        <ArrowLeft size={14} aria-hidden />게시판
      </Link>

      <header className="space-y-3 border-b border-line pb-5">
        <h1 className="break-words text-2xl font-bold text-ink-900">{post.title}</h1>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-3 text-sm text-ink-600">
            <span className="font-medium text-ink-600">{post.nickname}</span>
            <time dateTime={post.createdAt}>{formatPostDateTime(post.createdAt)}</time>
          </p>
          {post.mine && (
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to={`/board/${post.id}/edit`}><Pencil aria-hidden />수정</Link>
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setConfirming(true)}>
                <Trash2 aria-hidden />삭제
              </Button>
            </div>
          )}
        </div>
      </header>

      <PostBody content={post.content} images={post.images} />

      <Dialog open={confirming} onOpenChange={open => !open && !deleting && closeConfirm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>글을 삭제할까요?</DialogTitle>
            <DialogDescription>삭제한 글과 첨부한 이미지는 되돌릴 수 없습니다.</DialogDescription>
          </DialogHeader>
          {deleteError && (
            <p role="alert" className="text-sm text-danger">
              {getErrorMessage(deleteError, '글을 삭제하지 못했습니다. 잠시 후 다시 시도해주세요.')}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeConfirm} disabled={deleting}>취소</Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={() => remove(post.id, { onSuccess: () => navigate('/board', { replace: true }) })}
            >
              {deleting ? '삭제 중...' : '삭제하기'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </article>
  )
}
