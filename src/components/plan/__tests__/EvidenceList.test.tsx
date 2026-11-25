import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getEvidenceDownload } from '@/api/plans'
import type { Plan, PlanEvidence } from '@/api/types'
import EvidenceList from '../EvidenceList'

const mocks = vi.hoisted(() => ({
  addLink: vi.fn(),
  addFile: vi.fn(),
  remove: vi.fn(),
}))

vi.mock('@/hooks/usePlans', () => ({
  useAddLinkEvidence: () => ({ mutateAsync: mocks.addLink, isPending: false }),
  useAddFileEvidence: () => ({ mutateAsync: mocks.addFile, isPending: false }),
  useRemoveEvidence: () => ({ mutateAsync: mocks.remove, isPending: false }),
}))
vi.mock('@/api/plans', () => ({ getEvidenceDownload: vi.fn() }))

const link: PlanEvidence = { id: 1, type: 'URL', url: 'https://github.com/a/b', fileName: null, sizeBytes: null }
const file: PlanEvidence = { id: 2, type: 'FILE', url: null, fileName: '정리.pdf', sizeBytes: 2048 }

function plan(overrides: Partial<Plan> = {}): Plan {
  return {
    id: 7, planDate: '2026-11-25', content: '자료구조 복습', category: null, doneCriteria: '문제 5개', estimatedMinutes: 60,
    timeSlot: null, place: null, firstAction: null, status: 'PLANNED', actualMinutes: null, missReason: null, memo: null,
    completedAt: null, evidences: [], ...overrides,
  }
}

describe('EvidenceList', () => {
  beforeEach(() => vi.clearAllMocks())

  it('결과물이 없으면 붙이라는 안내와 입력칸을 보여준다', () => {
    render(<EvidenceList plan={plan()} />)

    expect(screen.getByText('링크나 파일을 붙여 두면 완료할 수 있습니다.')).toBeInTheDocument()
    expect(screen.getByLabelText('결과물 링크')).toBeInTheDocument()
  })

  it('링크는 새 탭에서 열리고 opener를 끊는다', () => {
    render(<EvidenceList plan={plan({ evidences: [link] })} />)

    const anchor = screen.getByRole('link', { name: 'https://github.com/a/b' })
    expect(anchor).toHaveAttribute('target', '_blank')
    expect(anchor).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('링크를 붙이면 id와 주소로 추가하고 입력칸을 비운다', async () => {
    const user = userEvent.setup()
    mocks.addLink.mockResolvedValue(link)
    render(<EvidenceList plan={plan()} />)

    await user.type(screen.getByLabelText('결과물 링크'), ' https://github.com/a/b ')
    await user.click(screen.getByRole('button', { name: '링크 붙이기' }))

    expect(mocks.addLink).toHaveBeenCalledWith({ id: 7, url: 'https://github.com/a/b' })
    await waitFor(() => expect(screen.getByLabelText('결과물 링크')).toHaveValue(''))
  })

  it('http, https가 아닌 주소는 요청 없이 막는다', async () => {
    const user = userEvent.setup()
    render(<EvidenceList plan={plan()} />)

    await user.type(screen.getByLabelText('결과물 링크'), 'javascript:alert(1)')
    await user.click(screen.getByRole('button', { name: '링크 붙이기' }))

    expect(screen.getByRole('alert')).toHaveTextContent('http 또는 https 링크만 붙일 수 있습니다.')
    expect(mocks.addLink).not.toHaveBeenCalled()
  })

  it('허용하지 않는 파일 형식은 요청 없이 막는다', async () => {
    const user = userEvent.setup({ applyAccept: false })
    render(<EvidenceList plan={plan()} />)

    await user.upload(screen.getByLabelText('결과물 파일'), new File(['x'], 'a.zip', { type: 'application/zip' }))

    expect(screen.getByRole('alert')).toHaveTextContent('PDF 또는 이미지')
    expect(mocks.addFile).not.toHaveBeenCalled()
  })

  it('파일을 고르면 그 파일로 추가한다', async () => {
    const user = userEvent.setup()
    mocks.addFile.mockResolvedValue(file)
    const pdf = new File(['x'], '정리.pdf', { type: 'application/pdf' })
    render(<EvidenceList plan={plan()} />)

    await user.upload(screen.getByLabelText('결과물 파일'), pdf)

    expect(mocks.addFile).toHaveBeenCalledWith({ id: 7, file: pdf })
  })

  it('파일 이름을 누르면 임시 주소를 받아 새 탭으로 연다', async () => {
    const user = userEvent.setup()
    vi.mocked(getEvidenceDownload).mockResolvedValue({ url: 'https://s3.example/x', fileName: '정리.pdf', expiresAt: '' })
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    render(<EvidenceList plan={plan({ evidences: [file] })} />)

    await user.click(screen.getByRole('button', { name: '정리.pdf' }))

    await waitFor(() => expect(open).toHaveBeenCalledWith('https://s3.example/x', '_blank', 'noopener,noreferrer'))
    expect(getEvidenceDownload).toHaveBeenCalledWith(7, 2)
    open.mockRestore()
  })

  it('결과물을 지우면 서버에 알린다', async () => {
    const user = userEvent.setup()
    mocks.remove.mockResolvedValue(undefined)
    render(<EvidenceList plan={plan({ evidences: [link] })} />)

    await user.click(screen.getByRole('button', { name: 'https://github.com/a/b 지우기' }))

    expect(mocks.remove).toHaveBeenCalledWith({ id: 7, evidenceId: 1 })
  })

  it('최대 개수에 닿으면 추가 입력을 숨긴다', () => {
    const five = [1, 2, 3, 4, 5].map(id => ({ ...link, id, url: `https://a.b/${id}` }))
    render(<EvidenceList plan={plan({ evidences: five })} />)

    expect(screen.queryByLabelText('결과물 링크')).not.toBeInTheDocument()
    expect(screen.getByText('결과물은 5개까지 붙일 수 있습니다.')).toBeInTheDocument()
  })

  it('못함 상태에서는 보기만 하고 추가·삭제가 없다', () => {
    render(<EvidenceList plan={plan({ status: 'FAILED', evidences: [link] })} />)

    expect(screen.queryByLabelText('결과물 링크')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /지우기/ })).not.toBeInTheDocument()
  })

  it('서버가 거절하면 그 메시지를 보여준다', async () => {
    const user = userEvent.setup()
    mocks.addLink.mockRejectedValue({ isAxiosError: true, response: { data: { message: '결과물은 최대 5개까지 붙일 수 있습니다.' } } })
    render(<EvidenceList plan={plan()} />)

    await user.type(screen.getByLabelText('결과물 링크'), 'https://a.b')
    await user.click(screen.getByRole('button', { name: '링크 붙이기' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('결과물은 최대 5개까지 붙일 수 있습니다.')
  })
})
