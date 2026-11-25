import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addFileEvidence, addLinkEvidence, completePlan, createPlan, deletePlan, getPlans, reflectPlan, removeEvidence,
  revisePlan,
} from '@/api/plans'
import type { PlanCompleteRequest, PlanCreateRequest, PlanDetailInput, PlanReflectionRequest } from '@/api/types'

const PLANS_KEY = ['plans']

export const usePlans = (from: string, to: string) =>
  useQuery({ queryKey: [...PLANS_KEY, from, to], queryFn: () => getPlans(from, to) })

// 계획과 결과물의 변경은 오늘 화면, 모아보기, 대시보드 카드에 모두 영향을 주므로 계획 쿼리를 한꺼번에 갱신한다.
function usePlanMutation<TVariables>(mutationFn: (variables: TVariables) => Promise<unknown>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PLANS_KEY }),
  })
}

export const useCreatePlan = () => usePlanMutation((data: PlanCreateRequest) => createPlan(data))

export const useRevisePlan = () =>
  usePlanMutation(({ id, data }: { id: number; data: PlanDetailInput }) => revisePlan(id, data))

export const useCompletePlan = () =>
  usePlanMutation(({ id, data }: { id: number; data: PlanCompleteRequest }) => completePlan(id, data))

export const useReflectPlan = () =>
  usePlanMutation(({ id, data }: { id: number; data: PlanReflectionRequest }) => reflectPlan(id, data))

export const useDeletePlan = () => usePlanMutation((id: number) => deletePlan(id))

export const useAddLinkEvidence = () =>
  usePlanMutation(({ id, url }: { id: number; url: string }) => addLinkEvidence(id, url))

export const useAddFileEvidence = () =>
  usePlanMutation(({ id, file }: { id: number; file: File }) => addFileEvidence(id, file))

export const useRemoveEvidence = () =>
  usePlanMutation(({ id, evidenceId }: { id: number; evidenceId: number }) => removeEvidence(id, evidenceId))
