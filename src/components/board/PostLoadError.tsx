import { Link } from 'react-router-dom'
import { getErrorCode } from '@/lib/errors'

// 글을 불러오지 못했을 때의 안내. 없는 글(404)과 그 밖의 오류를 구분한다.
export default function PostLoadError({ error }: { error: unknown }) {
  const notFound = getErrorCode(error) === 'POST_NOT_FOUND'
  return (
    <div className="space-y-3 p-4">
      <p role="alert" className="text-danger">
        {notFound ? '글을 찾을 수 없습니다. 지워졌거나 잘못된 주소일 수 있어요.' : '글을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'}
      </p>
      <Link to="/board" className="text-sm font-semibold text-brand-600 hover:underline">목록으로</Link>
    </div>
  )
}
