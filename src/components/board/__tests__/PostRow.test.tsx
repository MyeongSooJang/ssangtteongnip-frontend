import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import type { PostSummary } from '@/api/types'
import PostRow from '../PostRow'

const post: PostSummary = { id: 7, title: '면접 후기', nickname: '취준생1', imageCount: 2, createdAt: '2020-01-02T09:05:00' }

const renderRow = (value: PostSummary) =>
  render(<MemoryRouter><ul><PostRow post={value} /></ul></MemoryRouter>)

describe('PostRow', () => {
  it('제목·닉네임·날짜를 보여주고 상세로 연결한다', () => {
    renderRow(post)

    expect(screen.getByRole('link', { name: /면접 후기/ })).toHaveAttribute('href', '/board/7')
    expect(screen.getByText('취준생1')).toBeInTheDocument()
    expect(screen.getByText('2020.01.02')).toBeInTheDocument()
  })

  it('이미지가 있으면 장수를 보여준다', () => {
    renderRow(post)

    expect(screen.getByLabelText('이미지 2장')).toBeInTheDocument()
  })

  it('이미지가 없으면 장수를 보여주지 않는다', () => {
    renderRow({ ...post, imageCount: 0 })

    expect(screen.queryByLabelText(/이미지 \d+장/)).not.toBeInTheDocument()
  })
})
