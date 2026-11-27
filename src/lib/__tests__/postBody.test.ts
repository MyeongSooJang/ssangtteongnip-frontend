import { describe, it, expect } from 'vitest'
import { formatImageMarker, insertImageMarker, removeImageMarker, splitPostBody } from '../postBody'

describe('formatImageMarker', () => {
  it('[이미지 N] 형태로 만든다', () => {
    expect(formatImageMarker(3)).toBe('[이미지 3]')
  })
})

describe('insertImageMarker', () => {
  it('빈 내용에는 표시만 넣는다', () => {
    expect(insertImageMarker('', 0, 1)).toEqual({ content: '[이미지 1]', cursor: 7 })
  })

  it('맨 앞에 넣으면 뒤에 줄바꿈을 붙인다', () => {
    expect(insertImageMarker('안녕', 0, 1)).toEqual({ content: '[이미지 1]\n안녕', cursor: 8 })
  })

  it('중간에 넣으면 앞뒤로 줄바꿈을 붙여 한 줄을 차지한다', () => {
    expect(insertImageMarker('앞뒤', 1, 2)).toEqual({ content: '앞\n[이미지 2]\n뒤', cursor: 1 + 1 + 7 + 1 })
  })

  it('맨 끝에 넣으면 앞에만 줄바꿈을 붙인다', () => {
    expect(insertImageMarker('안녕', 2, 1)).toEqual({ content: '안녕\n[이미지 1]', cursor: 10 })
  })

  it('이미 줄 처음이면 앞에 줄바꿈을 더하지 않는다', () => {
    expect(insertImageMarker('앞\n뒤', 2, 1)).toEqual({ content: '앞\n[이미지 1]\n뒤', cursor: 2 + 7 + 1 })
  })

  it('바로 뒤가 줄바꿈이면 뒤에 줄바꿈을 더하지 않는다', () => {
    expect(insertImageMarker('앞\n뒤', 1, 1)).toEqual({ content: '앞\n[이미지 1]\n뒤', cursor: 1 + 1 + 7 })
  })

  it('범위를 벗어난 커서는 끝으로 맞춘다', () => {
    expect(insertImageMarker('안녕', 99, 1).content).toBe('안녕\n[이미지 1]')
    expect(insertImageMarker('안녕', -5, 1).content).toBe('[이미지 1]\n안녕')
  })
})

describe('removeImageMarker', () => {
  it('자기 줄을 차지한 표시는 빈 줄을 남기지 않는다', () => {
    expect(removeImageMarker('앞\n[이미지 1]\n뒤', 1)).toBe('앞\n뒤')
  })

  it('맨 앞의 표시는 뒤 줄바꿈 하나만 같이 지운다', () => {
    expect(removeImageMarker('[이미지 1]\n뒤', 1)).toBe('뒤')
  })

  it('맨 끝의 표시는 앞 줄바꿈 하나만 같이 지운다', () => {
    expect(removeImageMarker('앞\n[이미지 1]', 1)).toBe('앞')
  })

  it('줄 중간의 표시는 그 글자만 지운다', () => {
    expect(removeImageMarker('가[이미지 1]나', 1)).toBe('가나')
  })

  it('더 큰 번호는 하나씩 당긴다', () => {
    expect(removeImageMarker('[이미지 1]\n[이미지 2]\n[이미지 3]', 2)).toBe('[이미지 1]\n[이미지 2]')
  })

  it('작은 번호는 그대로 둔다', () => {
    expect(removeImageMarker('[이미지 1]\n글\n[이미지 2]', 2)).toBe('[이미지 1]\n글')
  })

  it('같은 번호가 여러 번 있으면 모두 지운다', () => {
    expect(removeImageMarker('a\n[이미지 1]\nb\n[이미지 1]\nc', 1)).toBe('a\nb\nc')
  })

  it('붙어 있는 표시를 지워도 줄이 남지 않는다', () => {
    expect(removeImageMarker('x\n[이미지 2]\n[이미지 1]\ny', 1)).toBe('x\n[이미지 1]\ny')
  })

  it('1~9가 아닌 번호는 건드리지 않는다', () => {
    expect(removeImageMarker('[이미지 0] [이미지 10] [이미지 1]', 1)).toBe('[이미지 0] [이미지 10] ')
    expect(removeImageMarker('[이미지 0]\n[이미지 10]\n[이미지 2]', 1)).toBe('[이미지 0]\n[이미지 10]\n[이미지 1]')
  })

  it('표시가 없으면 그대로 돌려준다', () => {
    expect(removeImageMarker('글만 있다', 1)).toBe('글만 있다')
  })
})

describe('splitPostBody', () => {
  it('표시가 없으면 글 하나이고 이미지는 모두 미참조다', () => {
    expect(splitPostBody('안녕\n하세요', 2)).toEqual({
      parts: [{ type: 'text', text: '안녕\n하세요' }],
      unreferenced: [0, 1],
    })
  })

  it('범위 안의 표시는 이미지 자리가 된다', () => {
    expect(splitPostBody('앞\n[이미지 2]\n뒤', 2)).toEqual({
      parts: [
        { type: 'text', text: '앞' },
        { type: 'image', index: 1 },
        { type: 'text', text: '뒤' },
      ],
      unreferenced: [0],
    })
  })

  it('범위를 벗어난 표시는 글자 그대로 둔다', () => {
    expect(splitPostBody('가 [이미지 3] 나 [이미지 0]', 2)).toEqual({
      parts: [{ type: 'text', text: '가 [이미지 3] 나 [이미지 0]' }],
      unreferenced: [0, 1],
    })
  })

  it('같은 표시가 두 번이면 이미지도 두 번 나온다', () => {
    const { parts, unreferenced } = splitPostBody('[이미지 1][이미지 1]', 1)
    expect(parts).toEqual([{ type: 'image', index: 0 }, { type: 'image', index: 0 }])
    expect(unreferenced).toEqual([])
  })

  it('표시 앞뒤의 빈 줄은 모두 걷어낸다', () => {
    expect(splitPostBody('앞\n\n\n[이미지 1]\n\n뒤\n', 1).parts).toEqual([
      { type: 'text', text: '앞' },
      { type: 'image', index: 0 },
      { type: 'text', text: '뒤\n' },
    ])
  })

  it('붙어 있는 표시 사이의 줄바꿈은 글 조각이 되지 않는다', () => {
    expect(splitPostBody('[이미지 1]\n[이미지 2]\n\n[이미지 3]', 3).parts).toEqual([
      { type: 'image', index: 0 },
      { type: 'image', index: 1 },
      { type: 'image', index: 2 },
    ])
  })

  it('맨 앞과 맨 끝의 표시 옆 줄바꿈도 걷어낸다', () => {
    expect(splitPostBody('[이미지 1]\n글\n[이미지 2]', 2).parts).toEqual([
      { type: 'image', index: 0 },
      { type: 'text', text: '글' },
      { type: 'image', index: 1 },
    ])
  })

  it('글 안쪽의 빈 줄은 그대로 둔다', () => {
    expect(splitPostBody('첫 줄\n\n둘째 줄\n[이미지 1]\n끝', 1).parts[0]).toEqual({ type: 'text', text: '첫 줄\n\n둘째 줄' })
  })

  it('빈 글 조각은 만들지 않는다', () => {
    expect(splitPostBody('[이미지 1][이미지 2]', 2).parts).toHaveLength(2)
  })

  it('이미지가 없으면 표시는 모두 글자다', () => {
    expect(splitPostBody('[이미지 1]', 0)).toEqual({ parts: [{ type: 'text', text: '[이미지 1]' }], unreferenced: [] })
  })

  it('빈 내용이면 조각이 없다', () => {
    expect(splitPostBody('', 1)).toEqual({ parts: [], unreferenced: [0] })
  })
})
