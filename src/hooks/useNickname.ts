import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { changeMyNickname, getMyNickname } from '@/api/nickname'

const NICKNAME_KEY = ['nickname']

export const useNickname = () =>
  useQuery({ queryKey: NICKNAME_KEY, queryFn: getMyNickname })

// 글 목록·상세의 작성자 이름도 바뀌므로 게시판 쿼리까지 함께 갱신한다.
export const useChangeNickname = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (nickname: string) => changeMyNickname(nickname),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NICKNAME_KEY })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}
