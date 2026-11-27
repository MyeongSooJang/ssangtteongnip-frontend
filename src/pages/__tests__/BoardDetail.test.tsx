import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, type AxiosResponse } from 'axios'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Post } from '@/api/types'
import BoardDetail from '../BoardDetail'

const deleteMutate = vi.fn()
const usePost = vi.fn()
let deleteError: unknown = null
let deletePending = false

vi.mock('@/hooks/usePosts', () => ({
  usePost: (id: number) => usePost(id),
  useDeletePost: () => ({ mutate: deleteMutate, isPending: deletePending, error: deleteError, reset: vi.fn() }),
}))

const post: Post = {
  id: 7, title: '면접 후기', content: '첫 줄\n둘째 줄', nickname: '취준생1', mine: true,
  images: [{ id: 'img-1', url: '/api/post-images/img-1' }],
  createdAt: '2026-11-27T09:05:00', updatedAt: '2026-11-27T09:05:00',
}

const renderDetail = () =>
  render(
    <MemoryRouter initialEntries={['/board/7']}>
      <Routes>
        <Route path="/board/:id" element={<BoardDetail />} />
        <Route path="/board" element={<div>목록 화면</div>} />
        <Route path="/board/:id/edit" element={<div>수정 화면</div>} />
      </Routes>
    </MemoryRouter>,
  )

describe('BoardDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deleteError = null
    deletePending = false
    usePost.mockReturnValue({ data: post, isLoading: false, isError: false, error: null })
  })

  it('제목·내용·닉네임·작성일·이미지를 보여준다', () => {
    renderDetail()

    expect(screen.getByRole('heading', { name: '면접 후기' })).toBeInTheDocument()
    expect(screen.getByText(/첫 줄/)).toBeInTheDocument()
    expect(screen.getByText('취준생1')).toBeInTheDocument()
    expect(screen.getByText('2026.11.27 09:05')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '첨부 이미지 1' })).toHaveAttribute('src', expect.stringContaining('/api/post-images/img-1'))
  })

  it('본문은 입력한 줄바꿈을 유지하고 태그를 글자 그대로 보여준다', () => {
    usePost.mockReturnValue({ data: { ...post, content: '<b>굵게</b>' }, isLoading: false, isError: false, error: null })
    renderDetail()

    expect(screen.getByText('<b>굵게</b>')).toBeInTheDocument()
  })

  it('내 글이면 수정·삭제 버튼을 보여주고 수정은 수정 화면으로 이동한다', async () => {
    const user = userEvent.setup()
    renderDetail()

    await user.click(screen.getByRole('link', { name: '수정' }))

    expect(screen.getByText('수정 화면')).toBeInTheDocument()
  })

  it('남의 글이면 수정·삭제 버튼이 없다', () => {
    usePost.mockReturnValue({ data: { ...post, mine: false }, isLoading: false, isError: false, error: null })
    renderDetail()

    expect(screen.queryByRole('link', { name: '수정' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '삭제' })).not.toBeInTheDocument()
  })

  it('삭제는 확인을 거치고 성공하면 목록으로 이동한다', async () => {
    const user = userEvent.setup()
    deleteMutate.mockImplementation((_id, options) => options.onSuccess())
    renderDetail()

    await user.click(screen.getByRole('button', { name: '삭제' }))
    expect(deleteMutate).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: '삭제하기' }))

    expect(deleteMutate).toHaveBeenCalledWith(7, expect.anything())
    expect(screen.getByText('목록 화면')).toBeInTheDocument()
  })

  it('삭제 확인에서 취소하면 삭제하지 않는다', async () => {
    const user = userEvent.setup()
    renderDetail()

    await user.click(screen.getByRole('button', { name: '삭제' }))
    await user.click(screen.getByRole('button', { name: '취소' }))

    expect(deleteMutate).not.toHaveBeenCalled()
  })

  it('삭제 실패 시 서버 메시지를 확인창에 보여준다', async () => {
    const user = userEvent.setup()
    deleteError = new AxiosError('forbidden', '403', undefined, undefined, {
      status: 403, data: { success: false, code: 'POST_FORBIDDEN', message: '작성자만 수정하거나 삭제할 수 있습니다.' },
    } as AxiosResponse)
    renderDetail()

    await user.click(screen.getByRole('button', { name: '삭제' }))

    expect(screen.getByRole('alert')).toHaveTextContent('작성자만 수정하거나 삭제할 수 있습니다.')
  })

  it('삭제 중에는 확인창의 버튼을 막는다', async () => {
    const user = userEvent.setup()
    deletePending = true
    renderDetail()

    await user.click(screen.getByRole('button', { name: '삭제' }))

    expect(screen.getByRole('button', { name: '삭제 중...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '취소' })).toBeDisabled()
  })

  it('삭제 중에는 Esc로 확인창을 닫지 못한다', async () => {
    const user = userEvent.setup()
    deletePending = true
    renderDetail()
    await user.click(screen.getByRole('button', { name: '삭제' }))

    await user.keyboard('{Escape}')

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('불러오는 중에는 안내를 보여준다', () => {
    usePost.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null })
    renderDetail()

    expect(screen.getByText('불러오는 중...')).toBeInTheDocument()
  })

  it('불러오지 못하면 목록으로 돌아가는 링크와 안내를 보여준다', () => {
    usePost.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error('x') })
    renderDetail()

    expect(screen.getByRole('alert')).toHaveTextContent('글을 불러오지 못했습니다.')
    expect(screen.getByRole('link', { name: '목록으로' })).toHaveAttribute('href', '/board')
  })
})
