import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCompanies, getCompany, getCompanyReviews, createCompany, getCompanyCandidates } from '@/api/companies'
import type { CreateCompanyRequest } from '@/api/types'

export const useCompanies = () =>
  useQuery({ queryKey: ['companies'], queryFn: getCompanies })

export const useCompany = (id: number) =>
  useQuery({ queryKey: ['companies', id], queryFn: () => getCompany(id) })

export const useCompanyReviews = (id: number) =>
  useQuery({ queryKey: ['companies', id, 'reviews'], queryFn: () => getCompanyReviews(id) })

// 키워드가 바뀌면 queryKey가 바뀌어 이전 요청은 취소되고 늦게 온 응답은 쓰이지 않는다.
// 실패해도 목록만 비우면 되므로 재시도하지 않는다.
export const useCompanyCandidates = (keyword: string) =>
  useQuery({
    queryKey: ['companies', 'candidates', keyword],
    queryFn: ({ signal }) => getCompanyCandidates(keyword, signal),
    enabled: keyword.length > 0,
    retry: false,
    staleTime: 60_000,
  })

export const useCreateCompany = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateCompanyRequest) => createCompany(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['companies'] }),
  })
}
