import { afterEach, describe, it, expect } from 'vitest'
import { Editor, defaultValueCtx, rootCtx, editorViewCtx, serializerCtx } from '@milkdown/kit/core'
import { commonmark } from '@milkdown/kit/preset/commonmark'
import { imageBlockComponent } from '@milkdown/kit/component/image-block'
import type { EditorView } from '@milkdown/kit/prose/view'
import {
  clampWidth,
  formatImageLayout,
  imageLayoutDecorations,
  imageLayoutSchema,
  parseImageLayout,
  widthFromDrag,
} from '../imageLayout'

async function createEditor(markdown: string) {
  const root = document.createElement('div')
  document.body.appendChild(root)
  const editor = await Editor.make()
    .config(ctx => {
      ctx.set(rootCtx, root)
      ctx.set(defaultValueCtx, markdown)
    })
    .use(commonmark)
    .use(imageBlockComponent)
    .use(imageLayoutSchema)
    .use(imageLayoutDecorations)
    .create()
  let view!: EditorView
  let serialize!: () => string
  editor.action(ctx => {
    view = ctx.get(editorViewCtx)
    serialize = () => ctx.get(serializerCtx)(view.state.doc)
  })
  return { view, serialize, root }
}

const firstImage = (view: EditorView) => {
  let found: { attrs: Record<string, unknown> } | undefined
  view.state.doc.descendants(node => {
    if (node.type.name === 'image-block' && !found) found = node
  })
  if (!found) throw new Error('이미지 블록이 없습니다')
  return found
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('parseImageLayout', () => {
  it('너비와 정렬을 읽는다', () => {
    expect(parseImageLayout('50%,left')).toEqual({ width: 50, align: 'left' })
  })

  it('Crepe가 저장한 비율 형식이나 빈 값은 기본값(100%, 가운데)으로 본다', () => {
    expect(parseImageLayout('0.50')).toEqual({ width: 100, align: 'center' })
    expect(parseImageLayout('')).toEqual({ width: 100, align: 'center' })
    expect(parseImageLayout(undefined)).toEqual({ width: 100, align: 'center' })
  })

  it('범위를 벗어난 너비는 10~100으로 맞춘다', () => {
    expect(parseImageLayout('5%,center').width).toBe(10)
    expect(parseImageLayout('300%,center').width).toBe(100)
  })

  it('형식이 어긋나면 기본값이다', () => {
    expect(parseImageLayout('50%,top')).toEqual({ width: 100, align: 'center' })
  })
})

describe('formatImageLayout', () => {
  it('기본값이면 Crepe와 같은 비율 형식을 그대로 쓴다', () => {
    expect(formatImageLayout({ width: 100, align: 'center' }, 1)).toBe('1.00')
    expect(formatImageLayout({ width: 100, align: 'center' }, 0.5)).toBe('0.50')
  })

  it('기본값이 아니면 너비와 정렬을 쓴다', () => {
    expect(formatImageLayout({ width: 50, align: 'right' }, 1)).toBe('50%,right')
    expect(formatImageLayout({ width: 100, align: 'left' }, 1)).toBe('100%,left')
  })

  it('쓴 값을 다시 읽으면 같다', () => {
    const layout = { width: 75, align: 'left' as const }
    expect(parseImageLayout(formatImageLayout(layout, 1))).toEqual(layout)
  })
})

describe('widthFromDrag', () => {
  it('한쪽 정렬은 움직인 만큼 너비가 바뀐다', () => {
    expect(widthFromDrag({ startPx: 400, containerPx: 800, deltaPx: 80, centered: false })).toBe(60)
  })

  it('가운데 정렬은 양쪽이 함께 바뀌어 두 배로 반영한다', () => {
    expect(widthFromDrag({ startPx: 400, containerPx: 800, deltaPx: 80, centered: true })).toBe(70)
  })

  it('최소·최대 너비를 넘지 않는다', () => {
    expect(widthFromDrag({ startPx: 400, containerPx: 800, deltaPx: -1000, centered: false })).toBe(10)
    expect(widthFromDrag({ startPx: 400, containerPx: 800, deltaPx: 1000, centered: false })).toBe(100)
  })

  it('본문 폭을 알 수 없으면 100%로 둔다', () => {
    expect(widthFromDrag({ startPx: 400, containerPx: 0, deltaPx: 10, centered: false })).toBe(100)
  })
})

describe('clampWidth', () => {
  it('반올림해 정수로 맞춘다', () => {
    expect(clampWidth(49.6)).toBe(50)
  })
})

describe('이미지 블록 저장 형식', () => {
  it('저장된 너비와 정렬을 불러온다', async () => {
    const { view } = await createEditor('![50%,right](/api/images/abc "설명")\n')

    expect(firstImage(view).attrs).toMatchObject({ src: '/api/images/abc', caption: '설명', width: 50, align: 'right' })
  })

  it('이전 형식(비율)의 글은 100% 가운데로 열리고 다시 저장해도 그대로다', async () => {
    const { view, serialize } = await createEditor('![0.50](/api/images/abc)\n')

    expect(firstImage(view).attrs).toMatchObject({ width: 100, align: 'center', ratio: 0.5 })
    expect(serialize()).toContain('![0.50](/api/images/abc)')
  })

  it('너비와 정렬을 바꾸면 마크다운에 담긴다', async () => {
    const { view, serialize } = await createEditor('![1.00](/api/images/abc)\n')
    let pos = -1
    view.state.doc.descendants((node, at) => {
      if (node.type.name === 'image-block') pos = at
    })

    view.dispatch(view.state.tr.setNodeMarkup(pos, undefined, { ...firstImage(view).attrs, width: 50, align: 'left' }))

    expect(serialize()).toContain('![50%,left](/api/images/abc)')
  })

  it('너비와 정렬을 이미지 블록 DOM의 속성으로 내보낸다', async () => {
    const { root } = await createEditor('![50%,right](/api/images/abc)\n')

    const block = root.querySelector('.milkdown-image-block')
    expect(block?.getAttribute('data-align')).toBe('right')
    expect(block?.getAttribute('style')).toContain('--image-width: 50%')
  })
})
