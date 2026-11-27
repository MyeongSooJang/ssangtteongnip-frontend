import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, type AxiosResponse } from 'axios'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import NicknameSection from '../NicknameSection'

const changeMutate = vi.fn()
let nicknameState: { data?: { nickname: string | null }; isLoading: boolean; isError: boolean }
let mutationError: unknown = null

vi.mock('@/hooks/useNickname', () => ({
  useNickname: () => nicknameState,
  useChangeNickname: () => ({ mutate: changeMutate, isPending: false, error: mutationError, reset: vi.fn() }),
}))

describe('NicknameSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mutationError = null
    nicknameState = { data: { nickname: '취준생1' }, isLoading: false, isError: false }
  })

  it('현재 닉네임을 보여준다', () => {
    render(<NicknameSection />)

    expect(screen.getByText('취준생1')).toBeInTheDocument()
  })

  it('닉네임이 없으면 설정을 안내한다', () => {
    nicknameState = { data: { nickname: null }, isLoading: false, isError: false }
    render(<NicknameSection />)

    expect(screen.getByText(/아직 닉네임이 없어요/)).toBeInTheDocument()
  })

  it('규칙에 맞지 않으면 요청하지 않고 안내한다', async () => {
    const user = userEvent.setup()
    render(<NicknameSection />)

    await user.click(screen.getByRole('button', { name: '변경' }))
    await user.clear(screen.getByLabelText('닉네임'))
    await user.type(screen.getByLabelText('닉네임'), '가')
    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(screen.getByRole('alert')).toHaveTextContent('닉네임은 한글, 영문, 숫자 2~10자로 입력해주세요.')
    expect(changeMutate).not.toHaveBeenCalled()
  })

  it('앞뒤 공백을 지우고 저장하며 성공하면 편집을 닫는다', async () => {
    const user = userEvent.setup()
    changeMutate.mockImplementation((_nickname, options) => options.onSuccess())
    render(<NicknameSection />)

    await user.click(screen.getByRole('button', { name: '변경' }))
    await user.clear(screen.getByLabelText('닉네임'))
    await user.type(screen.getByLabelText('닉네임'), '  새닉네임  ')
    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(changeMutate).toHaveBeenCalledWith('새닉네임', expect.anything())
    expect(screen.queryByLabelText('닉네임')).not.toBeInTheDocument()
  })

  it('중복이면 서버 메시지를 입력칸 아래에 보여준다', async () => {
    const user = userEvent.setup()
    mutationError = new AxiosError('conflict', '409', undefined, undefined, {
      status: 409,
      data: { success: false, code: 'NICKNAME_ALREADY_EXISTS', message: '이미 사용 중인 닉네임입니다.' },
    } as AxiosResponse)
    render(<NicknameSection />)

    await user.click(screen.getByRole('button', { name: '변경' }))

    expect(screen.getByRole('alert')).toHaveTextContent('이미 사용 중인 닉네임입니다.')
  })

  it('불러오기에 실패하면 안내한다', () => {
    nicknameState = { isLoading: false, isError: true }
    render(<NicknameSection />)

    expect(screen.getByRole('alert')).toHaveTextContent('닉네임을 불러오지 못했습니다.')
  })
})
