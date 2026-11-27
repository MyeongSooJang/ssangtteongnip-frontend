import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useNickname } from '@/hooks/useNickname'
import { useCreatePost, usePost, useRewritePost } from '@/hooks/usePosts'
import { getErrorMessage } from '@/lib/errors'
import PostForm from '@/components/board/PostForm'
import PostLoadError from '@/components/board/PostLoadError'
import NicknameRequiredNotice from '@/components/board/NicknameRequiredNotice'

function Frame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl space-y-6 font-sans">
      <div>
        <Link to="/board" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-ink-900">
          <ArrowLeft size={14} aria-hidden />게시판
        </Link>
        <h1 className="mt-2 text-xl font-bold text-ink-900">{title}</h1>
      </div>
      {children}
    </div>
  )
}

function CreatePost() {
  const navigate = useNavigate()
  const { data, isLoading, isError } = useNickname()
  const { mutate, isPending, error } = useCreatePost()

  if (isLoading) return <p className="text-slate-500">불러오는 중...</p>
  if (isError || !data) return <p role="alert" className="p-4 text-danger">닉네임 정보를 불러오지 못했습니다.</p>

  return (
    <Frame title="글쓰기">
      {data.nickname === null ? (
        <NicknameRequiredNotice />
      ) : (
        <PostForm
          submitLabel="등록"
          isPending={isPending}
          serverError={error ? getErrorMessage(error, '글을 등록하지 못했습니다. 잠시 후 다시 시도해주세요.') : null}
          onCancel={() => navigate('/board')}
          onSubmit={value =>
            mutate(
              { title: value.title, content: value.content, images: value.newImages },
              { onSuccess: post => navigate(`/board/${post.id}`, { replace: true }) },
            )
          }
        />
      )}
    </Frame>
  )
}

function EditPost({ postId }: { postId: number }) {
  const navigate = useNavigate()
  const { data: post, isLoading, isError, error: loadError } = usePost(postId)
  const { mutate, isPending, error } = useRewritePost()

  if (isLoading) return <p className="text-slate-500">불러오는 중...</p>
  if (isError || !post) return <PostLoadError error={loadError} />
  if (!post.mine) {
    return (
      <div className="space-y-3 p-4">
        <p role="alert" className="text-danger">작성자만 수정할 수 있습니다.</p>
        <Link to={`/board/${post.id}`} className="text-sm font-semibold text-brand-600 hover:underline">글로 돌아가기</Link>
      </div>
    )
  }

  return (
    <Frame title="글 수정">
      <PostForm
        key={post.id}
        initialTitle={post.title}
        initialContent={post.content}
        initialImages={post.images}
        submitLabel="저장"
        isPending={isPending}
        serverError={error ? getErrorMessage(error, '글을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.') : null}
        onCancel={() => navigate(`/board/${post.id}`)}
        onSubmit={value =>
          mutate(
            { id: post.id, data: { title: value.title, content: value.content, keepImageIds: value.keepImageIds, images: value.newImages } },
            { onSuccess: () => navigate(`/board/${post.id}`, { replace: true }) },
          )
        }
      />
    </Frame>
  )
}

// 경로에 id가 있으면 수정, 없으면 새 글이다. 훅을 조건부로 부르지 않도록 화면을 나눈다.
export default function BoardWrite() {
  const { id } = useParams()
  return id === undefined ? <CreatePost /> : <EditPost postId={Number(id)} />
}
