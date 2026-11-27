import { describe, it, expect } from 'vitest'
import {
  POST_CONTENT_MAX, POST_IMAGE_MAX_BYTES, POST_TITLE_MAX,
  formatPostDate, formatPostDateTime, validatePost, validatePostImage,
} from '../post'

describe('validatePost', () => {
  it('제목과 본문이 규칙 안이면 통과한다', () => {
    expect(validatePost({ title: '면접 후기', content: '내용' })).toBeNull()
  })

  it('제목이 비었거나 100자를 넘으면 거절한다', () => {
    expect(validatePost({ title: '   ', content: '내용' })).toBe('제목을 1~100자로 입력해주세요.')
    expect(validatePost({ title: 'a'.repeat(POST_TITLE_MAX + 1), content: '내용' })).toBe('제목을 1~100자로 입력해주세요.')
    expect(validatePost({ title: 'a'.repeat(POST_TITLE_MAX), content: '내용' })).toBeNull()
  })

  it('본문이 비었거나 5,000자를 넘으면 거절한다', () => {
    expect(validatePost({ title: '제목', content: '  ' })).toBe('내용을 1~5000자로 입력해주세요.')
    expect(validatePost({ title: '제목', content: 'a'.repeat(POST_CONTENT_MAX + 1) })).toBe('내용을 1~5000자로 입력해주세요.')
    expect(validatePost({ title: '제목', content: 'a'.repeat(POST_CONTENT_MAX) })).toBeNull()
  })
})

describe('validatePostImage', () => {
  const image = (type: string, size: number) => {
    const file = new File(['x'], 'a', { type })
    Object.defineProperty(file, 'size', { value: size })
    return file
  }

  it('허용된 형식과 크기는 통과한다', () => {
    expect(validatePostImage(image('image/png', 1024))).toBeNull()
    expect(validatePostImage(image('image/webp', POST_IMAGE_MAX_BYTES))).toBeNull()
  })

  it('허용되지 않은 형식은 거절한다', () => {
    expect(validatePostImage(image('application/pdf', 1024))).toBe('PNG, JPEG, GIF, WEBP 이미지만 올릴 수 있습니다.')
  })

  it('비었거나 5MB를 넘으면 거절한다', () => {
    expect(validatePostImage(image('image/png', 0))).toBe('비어 있는 파일은 올릴 수 없습니다.')
    expect(validatePostImage(image('image/png', POST_IMAGE_MAX_BYTES + 1))).toBe('이미지는 한 장당 5MB까지 올릴 수 있습니다.')
  })
})

describe('formatPostDate', () => {
  const now = new Date(2026, 10, 27, 15, 0)

  it('오늘 쓴 글은 시각만 보여준다', () => {
    expect(formatPostDate('2026-11-27T09:05:30', now)).toBe('09:05')
  })

  it('지난 글은 날짜를 보여준다', () => {
    expect(formatPostDate('2026-11-26T23:59:00', now)).toBe('2026.11.26')
  })
})

describe('formatPostDateTime', () => {
  it('날짜와 시각을 함께 보여준다', () => {
    expect(formatPostDateTime('2026-11-27T09:05:30')).toBe('2026.11.27 09:05')
  })
})
