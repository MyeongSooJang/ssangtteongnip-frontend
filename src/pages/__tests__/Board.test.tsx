import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PostPage } from '@/api/types'
import Board from '../Board'

const usePosts = vi.fn()
vi.mock('@/hooks/usePosts', () => ({ usePosts: (page: number) => usePosts(page) }))

const page = (overrides: Partial<PostPage> = {}): PostPage => ({
  posts: [
    { id: 2, title: '두 번째 글', nickname: '취준생2', imageCount: 0, createdAt: '2020-01-02T10:00:00' },
    { id: 1, title: '첫 글', nickname: '취준생1', imageCount: 1, createdAt: '2020-01-01T10:00:00' },
  ],
  page: 0,
  pageSize: 20,
  totalCount: 2,
  ...overrides,
})

const renderBoard = (initial = '/board') =>
  render(<MemoryRouter initialEntries={[initial]}><Board /></MemoryRouter>)

describe('Board', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    usePosts.mockReturnValue({ data: page(), isLoading: false, isError: false })
  })

  it('글 목록과 글쓰기 링크를 보여준다', () => {
    renderBoard()

    expect(screen.getByRole('link', { name: /두 번째 글/ })).toHaveAttribute('href', '/board/2')
    expect(screen.getByRole('link', { name: /첫 글/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '글쓰기' })).toHaveAttribute('href', '/board/new')
  })

  it('첫 화면은 서버의 0페이지를 요청한다', () => {
    renderBoard()

    expect(usePosts).toHaveBeenLastCalledWith(0)
  })

  it('글이 없으면 빈 상태를 보여준다', () => {
    usePosts.mockReturnValue({ data: page({ posts: [], totalCount: 0 }), isLoading: false, isError: false })
    renderBoard()

    expect(screen.getByText('아직 글이 없어요. 첫 글을 남겨보세요.')).toBeInTheDocument()
  })

  it('페이지 번호는 1부터 보여주고 서버에는 0부터 요청한다', async () => {
    const user = userEvent.setup()
    usePosts.mockReturnValue({ data: page({ totalCount: 45 }), isLoading: false, isError: false })
    renderBoard()

    await user.click(screen.getByRole('button', { name: '2페이지' }))

    expect(usePosts).toHaveBeenLastCalledWith(1)
  })

  it('주소의 page를 따라 해당 페이지를 요청한다', () => {
    usePosts.mockReturnValue({ data: page({ totalCount: 45 }), isLoading: false, isError: false })
    renderBoard('/board?page=3')

    expect(usePosts).toHaveBeenLastCalledWith(2)
  })

  it('잘못된 page 값은 1페이지로 본다', () => {
    renderBoard('/board?page=abc')

    expect(usePosts).toHaveBeenLastCalledWith(0)
  })

  it('불러오지 못하면 안내한다', () => {
    usePosts.mockReturnValue({ data: undefined, isLoading: false, isError: true })
    renderBoard()

    expect(screen.getByRole('alert')).toHaveTextContent('글 목록을 불러오지 못했습니다.')
  })

  it('범위를 벗어난 page는 마지막 페이지로 옮기고 빈 상태를 보이지 않는다', () => {
    // 서버처럼 마지막 페이지(0부터 2)를 넘으면 빈 목록을 돌려준다.
    usePosts.mockImplementation((p: number) => ({
      data: p > 2 ? page({ posts: [], totalCount: 45 }) : page({ totalCount: 45 }),
      isLoading: false,
      isError: false,
    }))
    renderBoard('/board?page=99')

    expect(screen.queryByText('아직 글이 없어요. 첫 글을 남겨보세요.')).not.toBeInTheDocument()
    expect(usePosts).toHaveBeenLastCalledWith(2)
  })
})
