// 서버는 글 내용(content)과 이미지(images)를 따로 저장하고 이미지의 위치는 모른다.
// 그래서 본문 속 위치는 글자 `[이미지 N]`(N = 그 글 이미지 목록의 1부터 센 순번)으로 적어 둔다.

export type BodyPart = { type: 'text'; text: string } | { type: 'image'; index: number }

export function formatImageMarker(n: number): string {
  return `[이미지 ${n}]`
}

// 번호는 1~9만 다룬다(글당 이미지는 5장). 앞자리가 0이거나 두 자리인 표시는 그냥 글자로 남는다.
const MARKER = /\[이미지 ([1-9])\]/g
const BODY_MARKER = /\[이미지 ([1-9]\d*)\]/g

// 표시가 자기 줄을 차지하도록 커서 위치에 넣는다. 커서는 표시(와 덧붙인 줄바꿈) 바로 뒤로 옮겨, 이어서 다음 줄에 쓸 수 있게 한다.
export function insertImageMarker(content: string, cursor: number, n: number): { content: string; cursor: number } {
  const at = Math.min(Math.max(cursor, 0), content.length)
  const prefix = at > 0 && content[at - 1] !== '\n' ? '\n' : ''
  const suffix = at < content.length && content[at] !== '\n' ? '\n' : ''
  const inserted = prefix + formatImageMarker(n) + suffix
  return { content: content.slice(0, at) + inserted + content.slice(at), cursor: at + inserted.length }
}

// 이미지를 지우면 그 표시를 없애고, 더 큰 번호는 하나씩 당긴다. 한 번에 훑어야 당긴 번호를 다시 지우는 일이 없다.
export function removeImageMarker(content: string, n: number): string {
  let out = ''
  let pos = 0
  for (const match of content.matchAll(MARKER)) {
    const start = match.index
    const end = start + match[0].length
    const num = Number(match[1])
    out += content.slice(pos, start)
    pos = end
    if (num < n) {
      out += match[0]
    } else if (num > n) {
      out += formatImageMarker(num - 1)
    } else {
      // 자기 줄을 차지한 표시는 줄바꿈 하나를 같이 지워 빈 줄이 남지 않게 한다.
      const prevNewline = out.endsWith('\n')
      const nextNewline = content[end] === '\n'
      if (prevNewline && nextNewline) pos = end + 1
      else if (prevNewline && end === content.length) out = out.slice(0, -1)
      else if (out === '' && nextNewline) pos = end + 1
    }
  }
  return out + content.slice(pos)
}

// 상세 화면용. 범위 안의 표시만 이미지 자리가 되고, 범위 밖 표시는 글자로 남는다.
export function splitPostBody(content: string, imageCount: number): { parts: BodyPart[]; unreferenced: number[] } {
  const parts: BodyPart[] = []
  const referenced = new Set<number>()
  let text = ''
  const flush = () => {
    if (text) parts.push({ type: 'text', text })
    text = ''
  }
  let pos = 0
  for (const match of content.matchAll(BODY_MARKER)) {
    const num = Number(match[1])
    if (num > imageCount) continue
    text += content.slice(pos, match.index)
    pos = match.index + match[0].length
    flush()
    parts.push({ type: 'image', index: num - 1 })
    referenced.add(num - 1)
  }
  text += content.slice(pos)
  flush()
  const unreferenced = Array.from({ length: imageCount }, (_, i) => i).filter(i => !referenced.has(i))
  return { parts, unreferenced }
}
