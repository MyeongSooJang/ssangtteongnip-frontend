import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function NicknameRequiredNotice() {
  return (
    <div className="rounded-xl border border-line bg-white p-8 text-center">
      <h2 className="text-base font-semibold text-ink-900">닉네임을 먼저 설정해주세요</h2>
      <p className="mt-2 text-sm text-slate-500">게시판에는 이름 대신 닉네임이 보여서, 닉네임을 정한 뒤에 글을 쓸 수 있습니다.</p>
      <Button asChild variant="brand" className="mt-5">
        <Link to="/mypage?tab=nickname">닉네임 설정하러 가기</Link>
      </Button>
    </div>
  )
}
