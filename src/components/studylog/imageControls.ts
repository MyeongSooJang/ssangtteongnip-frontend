import { $prose } from '@milkdown/kit/utils'
import { Plugin, PluginKey } from '@milkdown/kit/prose/state'
import type { EditorView } from '@milkdown/kit/prose/view'
import { IMAGE_NODE, WIDTH_PRESETS, widthFromDrag, type ImageAlign } from './imageLayout'

// 이미지에 마우스를 올리면 위에 크기(25·50·75·100%)와 정렬 툴바가, 양옆에 너비를 끄는 핸들이 뜬다.
// Crepe 기본 핸들은 아래쪽에 얇게 숨어 있고 높이만 바꿔서 쓰기 어렵다.
const BLOCK_SELECTOR = '.milkdown-image-block'
const WRAPPER_SELECTOR = '.image-wrapper'
const HIDE_DELAY_MS = 200
const TOOLBAR_CLASS = 'study-image-toolbar'
const HANDLE_CLASS = 'study-image-handle'

const ALIGN_ITEMS: { align: ImageAlign; label: string; icon: string }[] = [
  { align: 'left', label: '왼쪽 정렬', icon: 'M4 6h16M4 10h10M4 14h16M4 18h10' },
  { align: 'center', label: '가운데 정렬', icon: 'M4 6h16M7 10h10M4 14h16M7 18h10' },
  { align: 'right', label: '오른쪽 정렬', icon: 'M4 6h16M10 10h10M4 14h16M10 18h10' },
]

const alignIcon = (path: string) =>
  `<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="${path}"/></svg>`

interface Located {
  pos: number
  attrs: { width: number; align: ImageAlign }
}

// 이미지는 내용이 없는 최상위 블록이라 posAtDOM이 노드 바로 앞 위치를 돌려준다.
function locate(view: EditorView, block: Element): Located | null {
  let pos: number
  try {
    pos = view.posAtDOM(block, 0)
  } catch {
    return null
  }
  const node = view.state.doc.nodeAt(pos)
  if (!node || node.type.name !== IMAGE_NODE) return null
  return { pos, attrs: { width: Number(node.attrs.width), align: node.attrs.align as ImageAlign } }
}

function createButton(className: string, label: string, content: string): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = className
  button.title = label
  button.setAttribute('aria-label', label)
  button.innerHTML = content
  // 눌러도 에디터 선택이 풀리지 않게 한다.
  button.addEventListener('mousedown', event => event.preventDefault())
  return button
}

export const imageControlsPlugin = $prose(
  () =>
    new Plugin({
      key: new PluginKey('STUDY_IMAGE_CONTROLS'),
      view: view => {
        const toolbar = document.createElement('div')
        toolbar.className = TOOLBAR_CLASS
        toolbar.setAttribute('role', 'toolbar')
        toolbar.setAttribute('aria-label', '이미지 크기와 정렬')
        toolbar.hidden = true

        const presetButtons = WIDTH_PRESETS.map(width => {
          const button = createButton('study-image-toolbar__item', `너비 ${width}%`, `${width}%`)
          button.dataset.width = String(width)
          return button
        })
        const divider = document.createElement('span')
        divider.className = 'study-image-toolbar__divider'
        const alignButtons = ALIGN_ITEMS.map(item => {
          const button = createButton('study-image-toolbar__item', item.label, alignIcon(item.icon))
          button.dataset.align = item.align
          return button
        })
        toolbar.append(...presetButtons, divider, ...alignButtons)

        const leftHandle = createButton(`${HANDLE_CLASS} ${HANDLE_CLASS}--left`, '끌어서 너비 조절', '')
        const rightHandle = createButton(`${HANDLE_CLASS} ${HANDLE_CLASS}--right`, '끌어서 너비 조절', '')
        leftHandle.hidden = true
        rightHandle.hidden = true
        document.body.append(toolbar, leftHandle, rightHandle)

        let hideTimer: ReturnType<typeof setTimeout> | undefined
        let block: Element | null = null
        let dragging = false

        const hide = () => {
          clearTimeout(hideTimer)
          toolbar.hidden = true
          leftHandle.hidden = true
          rightHandle.hidden = true
          block = null
        }
        const scheduleHide = () => {
          if (dragging) return
          clearTimeout(hideTimer)
          hideTimer = setTimeout(hide, HIDE_DELAY_MS)
        }
        const cancelHide = () => clearTimeout(hideTimer)

        const place = () => {
          if (!block || !block.isConnected) return hide()
          const found = locate(view, block)
          const wrapper = block.querySelector(WRAPPER_SELECTOR)
          if (!found || !wrapper) return hide()
          const blockRect = block.getBoundingClientRect()
          const imageRect = wrapper.getBoundingClientRect()

          toolbar.hidden = false
          toolbar.style.top = `${Math.max(4, blockRect.top - toolbar.offsetHeight - 4)}px`
          toolbar.style.left = `${Math.max(4, blockRect.left)}px`
          for (const button of presetButtons) button.setAttribute('aria-pressed', String(Number(button.dataset.width) === found.attrs.width))
          for (const button of alignButtons) button.setAttribute('aria-pressed', String(button.dataset.align === found.attrs.align))

          // 정렬로 붙어 있는 쪽 가장자리는 움직일 수 없으므로 핸들을 두지 않는다.
          const top = `${imageRect.top + imageRect.height / 2 - 18}px`
          leftHandle.hidden = found.attrs.align === 'left'
          rightHandle.hidden = found.attrs.align === 'right'
          leftHandle.style.top = top
          leftHandle.style.left = `${imageRect.left + 6}px`
          rightHandle.style.top = top
          rightHandle.style.left = `${imageRect.right - 6 - rightHandle.offsetWidth}px`
        }

        const update = (patch: { width?: number; align?: ImageAlign }) => {
          if (!block) return
          const found = locate(view, block)
          if (!found) return
          const node = view.state.doc.nodeAt(found.pos)
          if (!node) return
          view.dispatch(view.state.tr.setNodeMarkup(found.pos, undefined, { ...node.attrs, ...patch }))
          // 새 크기가 그려진 뒤에 위치를 다시 잡는다.
          requestAnimationFrame(place)
        }

        const onOver = (event: MouseEvent) => {
          if (dragging) return
          const element = (event.target as Element | null)?.closest?.(BLOCK_SELECTOR)
          if (!element || !view.dom.contains(element)) return
          cancelHide()
          block = element
          place()
        }

        const onToolbarClick = (event: MouseEvent) => {
          const button = (event.target as Element).closest('button')
          if (!button) return
          if (button.dataset.width) update({ width: Number(button.dataset.width) })
          if (button.dataset.align) update({ align: button.dataset.align as ImageAlign })
        }

        const startDrag = (side: 'left' | 'right') => (event: PointerEvent) => {
          if (!block) return
          const wrapper = block.querySelector(WRAPPER_SELECTOR)
          const found = locate(view, block)
          if (!wrapper || !found) return
          event.preventDefault()
          const target = block as HTMLElement
          const startX = event.clientX
          const startPx = wrapper.getBoundingClientRect().width
          const containerPx = target.getBoundingClientRect().width
          const centered = found.attrs.align === 'center'
          let width = found.attrs.width
          dragging = true
          cancelHide()

          const onMove = (move: PointerEvent) => {
            const dx = move.clientX - startX
            width = widthFromDrag({ startPx, containerPx, deltaPx: side === 'right' ? dx : -dx, centered })
            target.style.setProperty('--image-width', `${width}%`)
            place()
          }
          const onUp = () => {
            window.removeEventListener('pointermove', onMove)
            window.removeEventListener('pointerup', onUp)
            dragging = false
            update({ width })
          }
          window.addEventListener('pointermove', onMove)
          window.addEventListener('pointerup', onUp)
        }

        const onLeftDown = startDrag('left')
        const onRightDown = startDrag('right')

        view.dom.addEventListener('mouseover', onOver)
        view.dom.addEventListener('mouseleave', scheduleHide)
        for (const element of [toolbar, leftHandle, rightHandle]) {
          element.addEventListener('mouseenter', cancelHide)
          element.addEventListener('mouseleave', scheduleHide)
        }
        toolbar.addEventListener('click', onToolbarClick)
        leftHandle.addEventListener('pointerdown', onLeftDown)
        rightHandle.addEventListener('pointerdown', onRightDown)
        window.addEventListener('scroll', hide, true)

        return {
          update: () => {
            if (block && !dragging) place()
          },
          destroy() {
            clearTimeout(hideTimer)
            view.dom.removeEventListener('mouseover', onOver)
            view.dom.removeEventListener('mouseleave', scheduleHide)
            window.removeEventListener('scroll', hide, true)
            toolbar.remove()
            leftHandle.remove()
            rightHandle.remove()
          },
        }
      },
    }),
)
