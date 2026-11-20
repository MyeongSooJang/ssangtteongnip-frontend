import { isAxiosError } from 'axios'
import { createCompany, getCompanies, getCompanyCandidates } from '@/api/companies'

// 자동완성에서 고른 회사 또는 직접 입력한 회사명. companyId가 null이면 아직 등록 전이다.
export interface CompanySelection {
  name: string
  companyId: number | null
}

// 지원 건을 만들려면 companyId가 필요하다. 등록 전 회사는 먼저 등록해 id를 얻는다.
// 그 사이 다른 사용자가 같은 회사를 등록해 409가 오면 이미 등록된 회사의 id를 찾아 이어 간다.
export async function resolveCompanyId(selection: CompanySelection): Promise<number> {
  if (selection.companyId !== null) return selection.companyId
  try {
    return (await createCompany({ name: selection.name })).id
  } catch (error) {
    if (!isAxiosError(error) || error.response?.status !== 409) throw error
    const id = await findRegisteredCompanyId(selection.name)
    if (id === null) throw error
    return id
  }
}

async function findRegisteredCompanyId(name: string): Promise<number | null> {
  const candidates = await getCompanyCandidates(name).catch(() => [])
  const candidate = candidates.find(c => c.name === name && c.companyId !== null)
  if (candidate) return candidate.companyId
  const companies = await getCompanies()
  return companies.find(c => c.name === name)?.id ?? null
}
