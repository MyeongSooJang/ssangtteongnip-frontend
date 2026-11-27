import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PostImage } from '@/api/types'
import PostForm from '../PostForm'

const onSubmit = vi.fn()
const onCancel = vi.fn()

const png = (name = 'a.png') => new File(['x'], name, { type: 'image/png' })

const renderForm = (props: Partial<React.ComponentProps<typeof PostForm>> = {}) =>
  render(
    <PostForm submitLabel="등록" isPending={false} serverError={null} onSubmit={onSubmit} onCancel={onCancel} {...props} />,
  )

describe('PostForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    URL.createObjectURL = vi.fn(() => 'blob:preview')
    URL.revokeObjectURL = vi.fn()
  })

  it('제목과 내용을 입력해 제출하면 값을 넘긴다', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText('제목'), '  면접 후기  ')
    await user.type(screen.getByLabelText('내용'), '내용입니다')
    await user.click(screen.getByRole('button', { name: '등록' }))

    expect(onSubmit).toHaveBeenCalledWith({ title: '면접 후기', content: '내용입니다', keepImageIds: [], newImages: [] })
  })

  it('제목이 비어 있으면 제출하지 않고 안내한다', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText('내용'), '내용입니다')
    await user.click(screen.getByRole('button', { name: '등록' }))

    expect(screen.getByRole('alert')).toHaveTextContent('제목을 1~100자로 입력해주세요.')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('제목을 고치면 이전 검증 안내가 사라진다', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('button', { name: '등록' }))
    expect(screen.getByRole('alert')).toBeInTheDocument()
    await user.type(screen.getByLabelText('제목'), '제목')

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('미리보기 주소는 파일마다 한 번만 만들고, 제거한 파일 것만 해제한다', async () => {
    const user = userEvent.setup()
    let n = 0
    URL.createObjectURL = vi.fn(() => `blob:preview-${++n}`)
    renderForm()

    await user.upload(screen.getByLabelText('이미지 파일 선택'), [png('a.png'), png('b.png')])
    expect(URL.createObjectURL).toHaveBeenCalledTimes(2)

    await user.click(screen.getAllByRole('button', { name: '이미지 제거' })[0])

    expect(URL.createObjectURL).toHaveBeenCalledTimes(2)
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview-1')
    expect(screen.getByRole('img', { name: '새 이미지 1' })).toHaveAttribute('src', 'blob:preview-2')
  })

  it('글자 수를 보여준다', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText('내용'), '12345')

    expect(screen.getByText('5 / 5000')).toBeInTheDocument()
  })

  it('고른 이미지는 새 이미지로 넘기고 제거할 수 있다', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.type(screen.getByLabelText('제목'), '제목')
    await user.type(screen.getByLabelText('내용'), '내용')

    const a = png('a.png')
    const b = png('b.png')
    await user.upload(screen.getByLabelText('이미지 파일 선택'), [a, b])
    await user.click(screen.getAllByRole('button', { name: '이미지 제거' })[0])
    await user.click(screen.getByRole('button', { name: '등록' }))

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ newImages: [b] }))
  })

  it('수정할 때는 남긴 기존 이미지 id만 넘긴다', async () => {
    const user = userEvent.setup()
    const images: PostImage[] = [
      { id: 'img-1', url: '/api/post-images/img-1' },
      { id: 'img-2', url: '/api/post-images/img-2' },
    ]
    renderForm({ initialTitle: '제목', initialContent: '내용', initialImages: images, submitLabel: '저장' })

    await user.click(screen.getAllByRole('button', { name: '이미지 제거' })[0])
    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(onSubmit).toHaveBeenCalledWith({ title: '제목', content: '내용', keepImageIds: ['img-2'], newImages: [] })
  })

  it('이미지는 합쳐서 5장까지만 받고 넘치면 안내한다', async () => {
    const user = userEvent.setup()
    const images: PostImage[] = Array.from({ length: 4 }, (_, i) => ({ id: `img-${i}`, url: `/api/post-images/img-${i}` }))
    renderForm({ initialTitle: '제목', initialContent: '내용', initialImages: images })

    await user.upload(screen.getByLabelText('이미지 파일 선택'), [png('a.png'), png('b.png')])

    expect(screen.getAllByRole('button', { name: '이미지 제거' })).toHaveLength(5)
    expect(screen.getByRole('alert')).toHaveTextContent('이미지는 글당 5장까지 첨부할 수 있습니다.')
  })

  it('5MB를 넘는 이미지는 받지 않고 안내한다', async () => {
    const user = userEvent.setup()
    renderForm()

    const big = new File([new ArrayBuffer(5 * 1024 * 1024 + 1)], 'big.png', { type: 'image/png' })
    await user.upload(screen.getByLabelText('이미지 파일 선택'), big)

    expect(screen.queryByRole('button', { name: '이미지 제거' })).not.toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('이미지는 한 장당 5MB까지 올릴 수 있습니다.')
  })

  it('서버 오류를 보여주고 제출 중에는 버튼을 막는다', () => {
    renderForm({ serverError: '작성자만 수정하거나 삭제할 수 있습니다.', isPending: true })

    expect(screen.getByRole('alert')).toHaveTextContent('작성자만 수정하거나 삭제할 수 있습니다.')
    expect(screen.getByRole('button', { name: /등록/ })).toBeDisabled()
  })

  it('취소를 누르면 onCancel을 부른다', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('button', { name: '취소' }))

    expect(onCancel).toHaveBeenCalled()
  })
})
