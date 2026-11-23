import { $prose } from '@milkdown/kit/utils'
import { imageBlockSchema } from '@milkdown/kit/component/image-block'
import { Plugin, PluginKey } from '@milkdown/kit/prose/state'
import { Decoration, DecorationSet } from '@milkdown/kit/prose/view'

// 이미지 블록의 너비(본문 폭에 대한 %)와 정렬을 다룬다.
// Crepe는 세로 높이 비율(ratio)만 저장하고 object-fit: cover로 잘라 보여 줘서, 크기를 줄이면 그림이 잘린다.
// 그래서 너비와 정렬을 속성으로 따로 두고, 높이는 그림 비율에 맞춰 자동으로 정한다.
export const IMAGE_NODE = 'image-block'

export type ImageAlign = 'left' | 'center' | 'right'

export interface ImageLayout {
  width: number
  align: ImageAlign
}

export const MIN_WIDTH = 10
export const MAX_WIDTH = 100
export const WIDTH_PRESETS = [25, 50, 75, 100] as const
const DEFAULT_LAYOUT: ImageLayout = { width: MAX_WIDTH, align: 'center' }

// 본문(마크다운)에는 alt 자리에 "50%,left"로 저장한다. 기본값(100%, 가운데)이면 Crepe와 같은 "1.00" 형식을 그대로 둬서
// 손대지 않은 이미지의 저장 결과가 달라지지 않게 한다.
const LAYOUT_PATTERN = /^(\d{1,3})%,(left|center|right)$/

export const clampWidth = (width: number): number => Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(width)))

export function parseImageLayout(alt: string | null | undefined): ImageLayout {
  const matched = LAYOUT_PATTERN.exec(alt ?? '')
  if (!matched) return { ...DEFAULT_LAYOUT }
  return { width: clampWidth(Number(matched[1])), align: matched[2] as ImageAlign }
}

export function formatImageLayout({ width, align }: ImageLayout, ratio: number): string {
  if (width === DEFAULT_LAYOUT.width && align === DEFAULT_LAYOUT.align) return ratio.toFixed(2)
  return `${width}%,${align}`
}

interface DragInput {
  startPx: number
  containerPx: number
  deltaPx: number
  centered: boolean
}

// 가운데 정렬은 양쪽이 함께 늘어나므로 한쪽 핸들을 움직인 거리의 두 배만큼 너비가 바뀐다.
export function widthFromDrag({ startPx, containerPx, deltaPx, centered }: DragInput): number {
  if (containerPx <= 0) return MAX_WIDTH
  const nextPx = startPx + deltaPx * (centered ? 2 : 1)
  return clampWidth((nextPx / containerPx) * 100)
}

// Crepe의 image-block 스키마에 너비·정렬 속성과 저장 형식을 얹는다. Crepe 기능 뒤에 등록해야 같은 이름을 덮어쓴다.
export const imageLayoutSchema = imageBlockSchema.extendSchema(previous => ctx => {
  const base = previous(ctx)
  return {
    ...base,
    attrs: {
      ...base.attrs,
      width: { default: DEFAULT_LAYOUT.width, validate: 'number' },
      align: { default: DEFAULT_LAYOUT.align, validate: 'string' },
    },
    parseMarkdown: {
      match: ({ type }) => type === IMAGE_NODE,
      runner: (state, node, type) => {
        const { url, alt, title } = node as unknown as { url: string; alt?: string; title?: string }
        let ratio = Number(alt || 1)
        if (Number.isNaN(ratio) || ratio === 0) ratio = 1
        state.addNode(type, { src: url, caption: title ?? '', ratio, ...parseImageLayout(alt) })
      },
    },
    toMarkdown: {
      match: node => node.type.name === IMAGE_NODE,
      runner: (state, node) => {
        const layout: ImageLayout = { width: node.attrs.width, align: node.attrs.align }
        state.openNode('paragraph')
        state.addNode('image', undefined, undefined, {
          title: node.attrs.caption,
          url: node.attrs.src,
          alt: formatImageLayout(layout, Number.parseFloat(node.attrs.ratio)),
        })
        state.closeNode()
      },
    },
  }
})

// 너비와 정렬을 이미지 블록 DOM의 속성으로 내보내 CSS가 쓰게 한다(노드 뷰는 Crepe 것을 그대로 쓴다).
export const imageLayoutDecorations = $prose(
  () =>
    new Plugin({
      key: new PluginKey('STUDY_IMAGE_LAYOUT'),
      props: {
        decorations: state => {
          const decorations: Decoration[] = []
          state.doc.descendants((node, pos) => {
            if (node.type.name !== IMAGE_NODE) return true
            decorations.push(
              Decoration.node(pos, pos + node.nodeSize, {
                'data-align': String(node.attrs.align),
                style: `--image-width: ${Number(node.attrs.width)}%`,
              }),
            )
            return false
          })
          return DecorationSet.create(state.doc, decorations)
        },
      },
    }),
)
