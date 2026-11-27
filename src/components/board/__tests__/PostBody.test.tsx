import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import type { PostImage } from '@/api/types'
import PostBody from '../PostBody'

const images: PostImage[] = [
  { id: 'img-1', url: '/api/post-images/img-1' },
  { id: 'img-2', url: '/api/post-images/img-2' },
  { id: 'img-3', url: '/api/post-images/img-3' },
]

const before = (a: Node, b: Node) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)

describe('PostBody', () => {
  it('표시 자리에 이미지를 넣어 글 - 이미지 - 글 순서로 보여준다', () => {
    render(<PostBody content={'앞 글\n[이미지 2]\n뒤 글'} images={images} />)

    const first = screen.getByText('앞 글', { exact: false })
    const image = screen.getByRole('img', { name: '첨부 이미지 2' })
    const last = screen.getByText('뒤 글', { exact: false })
    expect(before(first, image)).toBe(true)
    expect(before(image, last)).toBe(true)
  })

  it('표시하지 않은 이미지는 맨 아래에 원래 번호로 모아 보여준다', () => {
    render(<PostBody content={'앞 글\n[이미지 2]\n뒤 글'} images={images} />)

    const last = screen.getByText('뒤 글', { exact: false })
    const bottom1 = screen.getByRole('img', { name: '첨부 이미지 1' })
    const bottom3 = screen.getByRole('img', { name: '첨부 이미지 3' })
    expect(before(last, bottom1)).toBe(true)
    expect(before(bottom1, bottom3)).toBe(true)
    expect(screen.getAllByRole('img')).toHaveLength(3)
  })

  it('범위를 벗어난 표시는 글자 그대로 보여준다', () => {
    render(<PostBody content="사진 [이미지 7] 입니다" images={images} />)

    expect(screen.getByText('사진 [이미지 7] 입니다')).toBeInTheDocument()
  })

  it('HTML처럼 보이는 글도 글자로만 보여준다', () => {
    const { container } = render(<PostBody content="<script>alert(1)</script>" images={[]} />)

    expect(screen.getByText('<script>alert(1)</script>')).toBeInTheDocument()
    expect(container.querySelector('script')).toBeNull()
  })

  it('이미지를 새 탭에서 여는 링크로 감싼다', () => {
    render(<PostBody content="[이미지 1]" images={images} />)

    const link = screen.getByRole('img', { name: '첨부 이미지 1' }).closest('a')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })
})
