import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, type AxiosResponse } from 'axios'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Post } from '@/api/types'
import BoardWrite from '../BoardWrite'

const createMutate = vi.fn()
const rewriteMutate = vi.fn()
const useNickname = vi.fn()
const usePost = vi.fn()

vi.mock('@/hooks/useNickname', () => ({ useNickname: () => useNickname() }))
vi.mock('@/hooks/usePosts', () => ({
  usePost: (id: number) => usePost(id),
  useCreatePost: () => ({ mutate: createMutate, isPending: false, error: null }),
  useRewritePost: () => ({ mutate: rewriteMutate, isPending: false, error: null }),
}))

const post: Post = {
  id: 7, title: '기존 제목', content: '기존 내용', nickname: '취준생1', mine: true,
  images: [{ id: 'img-1', url: '/api/post-images/img-1' }],
  createdAt: '2026-11-27T09:00:00', updatedAt: '2026-11-27T09:00:00',
}

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/board/new" element={<BoardWrite />} />
        <Route path="/board/:id/edit" element={<BoardWrite />} />
        <Route path="/board/:id" element={<div>상세 화면</div>} />
        <Route path="/board" element={<div>목록 화면</div>} />
      </Routes>
    </MemoryRouter>,
  )

describe('BoardWrite - 새 글', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    URL.createObjectURL = vi.fn(() => 'blob:preview')
    URL.revokeObjectURL = vi.fn()
    useNickname.mockReturnValue({ data: { nickname: '취준생1' }, isLoading: false, isError: false })
  })

  it('닉네임이 없으면 폼 대신 설정 안내와 마이페이지 링크를 보여준다', () => {
    useNickname.mockReturnValue({ data: { nickname: null }, isLoading: false, isError: false })
    renderAt('/board/new')

    expect(screen.getByText('닉네임을 먼저 설정해주세요')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '닉네임 설정하러 가기' })).toHaveAttribute('href', '/mypage?tab=nickname')
    expect(screen.queryByLabelText('제목')).not.toBeInTheDocument()
  })

  it('등록하면 글을 만들고 상세 화면으로 이동한다', async () => {
    const user = userEvent.setup()
    createMutate.mockImplementation((_input, options) => options.onSuccess({ ...post, id: 9 }))
    renderAt('/board/new')

    await user.type(screen.getByLabelText('제목'), '새 글')
    await user.type(screen.getByLabelText('내용'), '새 내용')
    await user.click(screen.getByRole('button', { name: '등록' }))

    expect(createMutate).toHaveBeenCalledWith({ title: '새 글', content: '새 내용', images: [] }, expect.anything())
    expect(screen.getByText('상세 화면')).toBeInTheDocument()
  })

  it('취소하면 목록으로 돌아간다', async () => {
    const user = userEvent.setup()
    renderAt('/board/new')

    await user.click(screen.getByRole('button', { name: '취소' }))

    expect(screen.getByText('목록 화면')).toBeInTheDocument()
  })
})

describe('BoardWrite - 수정', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    URL.createObjectURL = vi.fn(() => 'blob:preview')
    URL.revokeObjectURL = vi.fn()
    useNickname.mockReturnValue({ data: { nickname: '취준생1' }, isLoading: false, isError: false })
    usePost.mockReturnValue({ data: post, isLoading: false, isError: false, error: null })
  })

  it('기존 값을 채워 보여주고 저장하면 남긴 이미지와 함께 보낸다', async () => {
    const user = userEvent.setup()
    rewriteMutate.mockImplementation((_input, options) => options.onSuccess(post))
    renderAt('/board/7/edit')

    expect(screen.getByLabelText('제목')).toHaveValue('기존 제목')
    await user.clear(screen.getByLabelText('제목'))
    await user.type(screen.getByLabelText('제목'), '고친 제목')
    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(rewriteMutate).toHaveBeenCalledWith(
      { id: 7, data: { title: '고친 제목', content: '기존 내용', keepImageIds: ['img-1'], images: [] } },
      expect.anything(),
    )
    expect(screen.getByText('상세 화면')).toBeInTheDocument()
  })

  it('작성자가 아니면 수정 폼을 보여주지 않는다', () => {
    usePost.mockReturnValue({ data: { ...post, mine: false }, isLoading: false, isError: false, error: null })
    renderAt('/board/7/edit')

    expect(screen.getByRole('alert')).toHaveTextContent('작성자만 수정할 수 있습니다.')
    expect(screen.queryByLabelText('제목')).not.toBeInTheDocument()
  })

  it('없는 글이면 안내한다', () => {
    const error = new AxiosError('nf', '404', undefined, undefined, {
      status: 404, data: { success: false, code: 'POST_NOT_FOUND', message: '게시글을 찾을 수 없습니다.' },
    } as AxiosResponse)
    usePost.mockReturnValue({ data: undefined, isLoading: false, isError: true, error })
    renderAt('/board/7/edit')

    expect(screen.getByRole('alert')).toHaveTextContent('글을 찾을 수 없습니다.')
    expect(screen.getByRole('link', { name: '목록으로' })).toHaveAttribute('href', '/board')
  })
})
