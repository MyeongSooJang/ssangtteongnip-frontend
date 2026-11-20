import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeAll, describe, it, expect, vi } from 'vitest'
import Applications from '../Applications'

const updateMutate = vi.hoisted(() =>
  vi.fn((_status: string, opts?: { onSuccess?: () => void }) => opts?.onSuccess?.()),
)

const createMutate = vi.hoisted(() => vi.fn())

vi.mock('@/hooks/useApplications', () => ({
  useApplications: () => ({
    data: [
      { id: 1, company: { id: 1, name: '카카오', industry: 'IT', website: '', createdAt: '' }, position: '백엔드', status: 'RESUME_SUBMITTED', appliedDate: '2026-10-01', jobSite: 'SARAMIN', deadline: '2026-10-31', resumeView: 'VIEWED', autoRejectedAt: null, createdAt: '' },
      { id: 2, company: { id: 2, name: '네이버', industry: 'IT', website: '', createdAt: '' }, position: '프론트엔드', status: 'RESUME_SUBMITTED', appliedDate: '2026-09-01', jobSite: null, deadline: '2026-09-15', resumeView: 'NOT_VIEWED', autoRejectedAt: null, createdAt: '' },
      { id: 3, company: { id: 3, name: '토스', industry: 'IT', website: '', createdAt: '' }, position: '서버', status: 'REJECTED', appliedDate: '2026-08-01', jobSite: 'WANTED', deadline: null, resumeView: 'NOT_VIEWED', autoRejectedAt: '2026-11-11T07:00:00', createdAt: '' },
      // 일부러 지원일 순서를 어긋나게 둔 건: 정렬하면 당근(10-20)은 맨 위, 라인(09-20)은 카카오와 네이버 사이로 온다.
      { id: 4, company: { id: 4, name: '라인', industry: 'IT', website: '', createdAt: '' }, position: '플랫폼', status: 'RESUME_SUBMITTED', appliedDate: '2026-09-20', jobSite: 'OTHER', deadline: null, resumeView: 'NOT_VIEWED', autoRejectedAt: null, createdAt: '' },
      { id: 5, company: { id: 5, name: '당근', industry: 'IT', website: '', createdAt: '' }, position: '모바일', status: 'RESUME_SUBMITTED', appliedDate: '2026-10-20', jobSite: 'OTHER', deadline: null, resumeView: 'NOT_VIEWED', autoRejectedAt: null, createdAt: '' },
    ],
    isLoading: false,
  }),
  useCreateApplication: () => ({ mutate: createMutate, isPending: false }),
  useUpdateApplicationStatus: () => ({ mutate: updateMutate, isPending: false }),
}))

vi.mock('@/hooks/useCompanies', () => ({
  useCompanyCandidates: (keyword: string) => ({
    data: keyword.startsWith('카카오')
      ? [
          { name: '카카오', listed: true, companyId: 1 },
          { name: '카카오뱅크', listed: true, companyId: null },
        ]
      : [],
    isError: false,
  }),
}))

const resolveCompanyId = vi.hoisted(() =>
  vi.fn(async (c: { companyId: number | null }) => c.companyId ?? 99),
)
vi.mock('@/lib/resolveCompany', () => ({ resolveCompanyId }))

const qc = new QueryClient()
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}><BrowserRouter>{children}</BrowserRouter></QueryClientProvider>
)

// Radix Select가 jsdom에서 열리도록 브라우저 API를 보정한다.
beforeAll(() => {
  Element.prototype.hasPointerCapture = () => false
  Element.prototype.releasePointerCapture = () => {}
  Element.prototype.scrollIntoView = () => {}
})

async function pickOption(trigger: HTMLElement, optionName: string) {
  await userEvent.click(trigger)
  await userEvent.click(await screen.findByRole('option', { name: optionName }))
}

const companyInput = () => screen.getByRole('combobox', { name: /회사/ })

// 후보 목록은 입력 후 디바운스가 지나야 뜬다.
async function pickCompany(typed: string, optionName: string | RegExp) {
  await userEvent.type(companyInput(), typed)
  await userEvent.click(await screen.findByRole('option', { name: optionName }))
}
const jobSiteSelect = () => screen.getByRole('combobox', { name: '지원 사이트' })

describe('Applications', () => {
  it('지원 목록에 지원한 사이트를 보여주고 이전 지원 건은 대시로 보여준다', () => {
    render(<Applications />, { wrapper })
    expect(within(screen.getByRole('row', { name: /카카오/ })).getByText('사람인')).toBeInTheDocument()
    expect(within(screen.getByRole('row', { name: /네이버/ })).getByText('-')).toBeInTheDocument()
  })

  it('회사, 직무, 지원일, 사이트를 모두 입력하면 선택한 사이트와 함께 등록한다', async () => {
    createMutate.mockClear()
    render(<Applications />, { wrapper })
    await userEvent.click(screen.getByRole('button', { name: '지원 등록' }))
    await pickCompany('카카오', /^카카오(?!뱅크)/)
    await userEvent.type(screen.getByLabelText('직무 *'), '백엔드')
    await userEvent.type(screen.getByLabelText('지원일 *'), '2026-11-01')
    await pickOption(jobSiteSelect(), '자사 홈페이지')

    await userEvent.click(screen.getByRole('button', { name: '등록' }))

    expect(createMutate).toHaveBeenCalledWith(
      { companyId: 1, position: '백엔드', appliedDate: '2026-11-01', jobSite: 'COMPANY_WEBSITE' },
      expect.anything(),
    )
  })

  it('지원 사이트를 고르지 않으면 등록할 수 없다', async () => {
    render(<Applications />, { wrapper })
    await userEvent.click(screen.getByRole('button', { name: '지원 등록' }))
    await pickCompany('카카오', /^카카오(?!뱅크)/)
    await userEvent.type(screen.getByLabelText('직무 *'), '백엔드')
    await userEvent.type(screen.getByLabelText('지원일 *'), '2026-11-01')

    expect(screen.getByRole('button', { name: '등록' })).toBeDisabled()
  })

  it('사이트를 고르면 그 사이트로 지원한 건만 보여준다', async () => {
    render(<Applications />, { wrapper })

    await pickOption(screen.getByRole('combobox', { name: '지원 사이트 필터' }), '사람인')

    expect(screen.getByRole('row', { name: /카카오/ })).toBeInTheDocument()
    expect(screen.queryByRole('row', { name: /네이버/ })).not.toBeInTheDocument()
    expect(screen.getByText('1건 · 사람인')).toBeInTheDocument()
  })

  it('미지정을 고르면 사이트를 채우지 않은 이전 지원 건만 보여준다', async () => {
    render(<Applications />, { wrapper })

    await pickOption(screen.getByRole('combobox', { name: '지원 사이트 필터' }), '미지정')

    expect(screen.getByRole('row', { name: /네이버/ })).toBeInTheDocument()
    expect(screen.queryByRole('row', { name: /카카오/ })).not.toBeInTheDocument()
  })

  it('상태 버튼과 사이트 필터는 함께 적용된다', async () => {
    render(<Applications />, { wrapper })
    await pickOption(screen.getByRole('combobox', { name: '지원 사이트 필터' }), '사람인')

    await userEvent.click(screen.getByRole('button', { name: '최종합격' }))

    expect(screen.queryByRole('row', { name: /카카오/ })).not.toBeInTheDocument()
    expect(screen.getByText('0건 · 사람인')).toBeInTheDocument()
  })

  it('지원일이 최근인 건이 위로 오도록 정렬한다', () => {
    render(<Applications />, { wrapper })
    const names = screen
      .getAllByRole('row')
      .slice(1)
      .map((row) => within(row).getAllByRole('cell')[0].textContent)
    expect(names).toEqual(['당근', '카카오', '라인', '네이버', '토스'])
  })

  it('지원 목록을 렌더링한다', () => {
    render(<Applications />, { wrapper })
    expect(screen.getByText('카카오')).toBeInTheDocument()
    expect(screen.getByText('백엔드')).toBeInTheDocument()
  })

  it('다음 단계가 있는 지원 건에 상태 변경 버튼을 보여준다', () => {
    render(<Applications />, { wrapper })
    const row = within(screen.getByRole('row', { name: /카카오/ }))
    expect(row.getByRole('button', { name: '서류합격' })).toBeInTheDocument()
    expect(row.getByRole('button', { name: '불합격' })).toBeInTheDocument()
  })

  it('서류합격으로 변경하면 면접 일정 등록 창을 띄운다', async () => {
    render(<Applications />, { wrapper })
    const row = within(screen.getByRole('row', { name: /카카오/ }))
    await userEvent.click(row.getByRole('button', { name: '서류합격' }))
    expect(await screen.findByText('서류합격 — 면접 일정 등록')).toBeInTheDocument()
    expect(screen.getByLabelText('제목 *')).toHaveValue('카카오 면접')
  })

  it('불합격으로 변경하면 일정 등록 창을 띄우지 않는다', async () => {
    render(<Applications />, { wrapper })
    const row = within(screen.getByRole('row', { name: /카카오/ }))
    await userEvent.click(row.getByRole('button', { name: '불합격' }))
    expect(screen.queryByText('서류합격 — 면접 일정 등록')).not.toBeInTheDocument()
  })

  it('지원 목록에 공고 마감일과 열람 여부를 보여준다', () => {
    render(<Applications />, { wrapper })
    const row = within(screen.getByRole('row', { name: /카카오/ }))
    expect(row.getByText('2026-10-31')).toBeInTheDocument()
    expect(row.getByText('열람')).toBeInTheDocument()
    expect(within(screen.getByRole('row', { name: /네이버/ })).getByText('미열람')).toBeInTheDocument()
  })

  it('마감일을 모르는 지원 건은 대시로 보여준다', () => {
    render(<Applications />, { wrapper })
    expect(within(screen.getByRole('row', { name: /토스/ })).getByText('-')).toBeInTheDocument()
  })

  it('자동으로 불합격된 지원 건에만 자동 표시를 붙인다', () => {
    render(<Applications />, { wrapper })
    expect(within(screen.getByRole('row', { name: /토스/ })).getByText('자동')).toBeInTheDocument()
    expect(within(screen.getByRole('row', { name: /카카오/ })).queryByText('자동')).not.toBeInTheDocument()
  })

  it('공고 마감일을 입력하면 마감일과 함께 등록한다', async () => {
    createMutate.mockClear()
    render(<Applications />, { wrapper })
    await userEvent.click(screen.getByRole('button', { name: '지원 등록' }))
    await pickCompany('카카오', /^카카오(?!뱅크)/)
    await userEvent.type(screen.getByLabelText('직무 *'), '백엔드')
    await userEvent.type(screen.getByLabelText('지원일 *'), '2026-11-01')
    await pickOption(jobSiteSelect(), '사람인')
    await userEvent.type(screen.getByLabelText('공고 마감일'), '2026-11-30')

    await userEvent.click(screen.getByRole('button', { name: '등록' }))

    expect(createMutate).toHaveBeenCalledWith(
      { companyId: 1, position: '백엔드', appliedDate: '2026-11-01', jobSite: 'SARAMIN', deadline: '2026-11-30' },
      expect.anything(),
    )
  })

  it('후보에 상장 배지와 등록됨 표시를 보여 준다', async () => {
    createMutate.mockClear()
    render(<Applications />, { wrapper })
    await userEvent.click(screen.getByRole('button', { name: '지원 등록' }))
    await userEvent.type(companyInput(), '카카오')

    expect(await screen.findByRole('option', { name: /카카오뱅크/ })).toBeInTheDocument()
    expect(screen.getAllByText('상장')).toHaveLength(2)
    expect(screen.getByText('등록됨')).toBeInTheDocument()
  })

  it('등록 전 후보를 고르면 회사를 등록한 id로 지원 건을 만든다', async () => {
    createMutate.mockClear()
    resolveCompanyId.mockClear()
    render(<Applications />, { wrapper })
    await userEvent.click(screen.getByRole('button', { name: '지원 등록' }))
    await pickCompany('카카오', /카카오뱅크/)
    await userEvent.type(screen.getByLabelText('직무 *'), '백엔드')
    await userEvent.type(screen.getByLabelText('지원일 *'), '2026-11-01')
    await pickOption(jobSiteSelect(), '사람인')

    await userEvent.click(screen.getByRole('button', { name: '등록' }))

    expect(resolveCompanyId).toHaveBeenCalledWith({ name: '카카오뱅크', companyId: null })
    expect(createMutate).toHaveBeenCalledWith(expect.objectContaining({ companyId: 99 }), expect.anything())
  })

  it('후보에 없으면 맨 아래 직접 입력으로 입력한 이름 그대로 쓴다', async () => {
    resolveCompanyId.mockClear()
    render(<Applications />, { wrapper })
    await userEvent.click(screen.getByRole('button', { name: '지원 등록' }))
    await pickCompany('내가쓴회사', /내가쓴회사.*직접 입력/)
    await userEvent.type(screen.getByLabelText('직무 *'), '백엔드')
    await userEvent.type(screen.getByLabelText('지원일 *'), '2026-11-01')
    await pickOption(jobSiteSelect(), '사람인')

    await userEvent.click(screen.getByRole('button', { name: '등록' }))

    expect(resolveCompanyId).toHaveBeenCalledWith({ name: '내가쓴회사', companyId: null })
  })

  it('방향키와 엔터로 후보를 고른다', async () => {
    render(<Applications />, { wrapper })
    await userEvent.click(screen.getByRole('button', { name: '지원 등록' }))
    await userEvent.type(companyInput(), '카카오')
    await screen.findByRole('option', { name: /카카오뱅크/ })

    await userEvent.keyboard('{ArrowDown}{Enter}')

    expect(companyInput()).toHaveValue('카카오뱅크')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('고른 뒤 글자를 고치면 선택이 풀려 등록할 수 없다', async () => {
    render(<Applications />, { wrapper })
    await userEvent.click(screen.getByRole('button', { name: '지원 등록' }))
    await userEvent.type(screen.getByLabelText('직무 *'), '백엔드')
    await userEvent.type(screen.getByLabelText('지원일 *'), '2026-11-01')
    await pickOption(jobSiteSelect(), '사람인')
    await pickCompany('카카오', /^카카오(?!뱅크)/)
    expect(screen.getByRole('button', { name: '등록' })).toBeEnabled()

    await userEvent.type(companyInput(), '뱅')

    expect(screen.getByRole('button', { name: '등록' })).toBeDisabled()
  })

  it('회사명 입력 안내 문구에 법인명으로 검색하라고 알려 준다', async () => {
    render(<Applications />, { wrapper })
    await userEvent.click(screen.getByRole('button', { name: '지원 등록' }))

    expect(screen.getByText(/법인명으로 검색/)).toBeInTheDocument()
  })
})
