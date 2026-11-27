// 서버(Post·PostImage)의 규칙과 같은 값. 서버가 원본이고 여기서는 요청 전에 빠르게 안내하려고 둔다.
export const POST_TITLE_MAX = 100
export const POST_CONTENT_MAX = 5000
export const POST_IMAGE_MAX = 5
export const POST_IMAGE_MAX_BYTES = 5 * 1024 * 1024

const POST_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
export const POST_IMAGE_ACCEPT = POST_IMAGE_TYPES.join(',')

export function validatePost({ title, content }: { title: string; content: string }): string | null {
  if (title.trim().length < 1 || title.length > POST_TITLE_MAX) return `제목을 1~${POST_TITLE_MAX}자로 입력해주세요.`
  if (content.trim().length < 1 || content.length > POST_CONTENT_MAX) return `내용을 1~${POST_CONTENT_MAX}자로 입력해주세요.`
  return null
}

export function validatePostImage(file: File): string | null {
  if (!POST_IMAGE_TYPES.includes(file.type)) return 'PNG, JPEG, GIF, WEBP 이미지만 올릴 수 있습니다.'
  if (file.size === 0) return '비어 있는 파일은 올릴 수 없습니다.'
  if (file.size > POST_IMAGE_MAX_BYTES) return '이미지는 한 장당 5MB까지 올릴 수 있습니다.'
  return null
}

const pad = (n: number) => String(n).padStart(2, '0')

// 서버의 LocalDateTime 문자열(2026-11-27T09:05:30)을 그대로 잘라 쓴다. 오늘 글은 시각, 그 전 글은 날짜를 보여준다.
export function formatPostDate(createdAt: string, now: Date = new Date()): string {
  const day = createdAt.slice(0, 10)
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  return day === today ? createdAt.slice(11, 16) : day.replace(/-/g, '.')
}

export function formatPostDateTime(createdAt: string): string {
  return `${createdAt.slice(0, 10).replace(/-/g, '.')} ${createdAt.slice(11, 16)}`
}
