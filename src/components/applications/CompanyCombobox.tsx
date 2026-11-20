import { useId, useState } from 'react'
import { Input } from '@/components/ui/input'
import { useCompanyCandidates } from '@/hooks/useCompanies'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { cn } from '@/lib/utils'
import type { CompanySelection } from '@/lib/resolveCompany'

const DEBOUNCE_MS = 280

interface CompanyComboboxProps {
  onSelect: (selection: CompanySelection | null) => void
}

// 회사명을 입력하면 후보를 보여 주고, 후보에 없으면 맨 아래 "직접 입력"으로 입력한 이름 그대로 쓴다.
// 선택 뒤 글자를 고치면 선택을 풀어 다른 회사로 등록되는 일이 없게 한다.
export default function CompanyCombobox({ onSelect }: CompanyComboboxProps) {
  const listId = useId()
  const [text, setText] = useState('')
  const [selected, setSelected] = useState<CompanySelection | null>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)

  const keyword = text.trim()
  const debounced = useDebouncedValue(keyword, DEBOUNCE_MS)
  // 입력이 바뀌었는데 디바운스가 아직 안 끝났으면 이전 키워드의 후보를 보이지 않는다.
  const { data, isError } = useCompanyCandidates(debounced)
  const candidates = debounced === keyword && !isError ? (data ?? []) : []

  const showList = open && !selected && keyword.length > 0
  const directIndex = candidates.length
  const optionCount = directIndex + 1
  const activeIndex = Math.min(active, directIndex)

  const choose = (selection: CompanySelection) => {
    setText(selection.name)
    setSelected(selection)
    setOpen(false)
    onSelect(selection)
  }

  const chooseAt = (index: number) => {
    const candidate = candidates[index]
    choose(candidate ? { name: candidate.name, companyId: candidate.companyId } : { name: keyword, companyId: null })
  }

  const handleChange = (value: string) => {
    setText(value)
    setActive(0)
    setOpen(true)
    if (selected) {
      setSelected(null)
      onSelect(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showList) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((activeIndex + 1) % optionCount)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((activeIndex - 1 + optionCount) % optionCount)
    } else if (e.key === 'Enter') {
      // 목록이 열려 있을 때의 엔터는 폼 제출이 아니라 후보 선택이다.
      e.preventDefault()
      chooseAt(activeIndex)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const optionId = (i: number) => `${listId}-${i}`

  return (
    <div className="relative">
      <Input
        id="company"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList ? optionId(activeIndex) : undefined}
        autoComplete="off"
        placeholder="회사명(법인명)을 입력하세요"
        value={text}
        onChange={e => handleChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
      />
      <p className="mt-1 text-xs text-ink-600">
        법인명으로 검색해 주세요. 예: 토스는 &lsquo;비바리퍼블리카&rsquo;, 배달의민족은 &lsquo;우아한형제들&rsquo;
      </p>
      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label="회사 후보"
          className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-md border bg-white py-1 shadow-md"
        >
          {candidates.map((c, i) => (
            <li
              key={`${c.name}-${i}`}
              id={optionId(i)}
              role="option"
              aria-selected={i === activeIndex}
              // mousedown에서 선택해야 입력창 blur로 목록이 닫히기 전에 처리된다.
              onMouseDown={e => {
                e.preventDefault()
                chooseAt(i)
              }}
              onMouseEnter={() => setActive(i)}
              className={cn(
                'flex cursor-pointer items-center justify-between px-3 py-2 text-sm',
                i === activeIndex && 'bg-slate-100',
              )}
            >
              <span>{c.name}</span>
              <span className="flex items-center gap-1.5 text-xs">
                {c.listed && <span className="rounded-full bg-brand-100 px-2 py-0.5 text-brand-700">상장</span>}
                {c.companyId !== null && <span className="text-ink-600">등록됨</span>}
              </span>
            </li>
          ))}
          <li
            id={optionId(directIndex)}
            role="option"
            aria-selected={directIndex === activeIndex}
            onMouseDown={e => {
              e.preventDefault()
              chooseAt(directIndex)
            }}
            onMouseEnter={() => setActive(directIndex)}
            className={cn(
              'cursor-pointer border-t px-3 py-2 text-sm text-ink-600',
              directIndex === activeIndex && 'bg-slate-100',
            )}
          >
            &lsquo;{keyword}&rsquo; 직접 입력
          </li>
        </ul>
      )}
    </div>
  )
}
