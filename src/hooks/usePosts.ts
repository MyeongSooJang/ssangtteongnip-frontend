import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createPost, deletePost, getPost, getPosts, rewritePost } from '@/api/posts'
import type { PostCreateInput, PostRewriteInput } from '@/api/types'

const POSTS_KEY = ['posts']
const detailKey = (id: number) => [...POSTS_KEY, 'detail', id]

// page는 서버 기준(0부터)이다. 페이지를 넘길 때 이전 목록을 유지해 화면이 깜빡이지 않게 한다.
export const usePosts = (page: number) =>
  useQuery({ queryKey: [...POSTS_KEY, 'list', page], queryFn: () => getPosts(page), placeholderData: keepPreviousData })

// 없는 글(404)은 다시 시도해도 같으므로 재시도하지 않고 바로 안내한다.
export const usePost = (id: number) =>
  useQuery({ queryKey: detailKey(id), queryFn: () => getPost(id), enabled: Number.isInteger(id) && id > 0, retry: false })

export const useCreatePost = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: PostCreateInput) => createPost(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: POSTS_KEY }),
  })
}

export const useRewritePost = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: PostRewriteInput }) => rewritePost(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: POSTS_KEY }),
  })
}

// 지운 글의 상세를 다시 불러오면 404가 나므로 캐시에서 빼고 목록만 갱신한다.
export const useDeletePost = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deletePost(id),
    onSuccess: (_result, id) => {
      queryClient.removeQueries({ queryKey: detailKey(id) })
      queryClient.invalidateQueries({ queryKey: [...POSTS_KEY, 'list'] })
    },
  })
}
