import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getContract } from '../api/contracts'
import { Spinner } from './ui/Spinner'
import { MethodBadge } from './ui/MethodBadge'
import { extractEndpoints, groupByTag } from '../utils/schema'

export function ContractEndpointList({ slug, timestamp, activeEndpointId, onSelect }: {
  slug: string
  timestamp: string
  activeEndpointId: string
  onSelect: (epId: string) => void
}) {
  const { data: contract, isLoading } = useQuery({
    queryKey: ['contract', slug, timestamp],
    queryFn: () => getContract(slug, timestamp),
  })

  const [collapsedTags, setCollapsedTags] = useState<Record<string, boolean>>({})
  const toggleTag = (tag: string) => setCollapsedTags(c => ({ ...c, [tag]: !c[tag] }))

  if (isLoading) {
    return <div className="flex justify-center py-3"><Spinner size={14} /></div>
  }

  const root = (contract?.openapi_json ?? {}) as Record<string, unknown>
  const endpoints = contract ? extractEndpoints(root) : []
  const groups = groupByTag(endpoints)

  if (groups.length === 0) {
    return <p className="px-6 py-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>No endpoints found</p>
  }

  return (
    <div className="pb-1">
      {groups.map(({ tag, items }) => {
        const isOpen = collapsedTags[tag] !== true
        return (
          <div key={tag}>
            <button
              onClick={() => toggleTag(tag)}
              className="w-full flex items-center justify-between px-5 py-1.5 text-left"
              style={{ color: 'var(--text-muted)' }}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider truncate">{tag}</span>
              <span className="text-[9px] shrink-0 ml-1">{isOpen ? '▾' : '▸'}</span>
            </button>
            {isOpen && items.map(ep => (
              <button
                key={ep.id}
                onClick={() => onSelect(ep.id)}
                className="w-full flex items-center gap-2 pl-7 pr-4 py-1.5 text-left transition-colors"
                style={activeEndpointId === ep.id
                  ? { background: 'var(--accent-bg)', color: 'var(--accent-text)' }
                  : { color: 'var(--text-secondary)' }}
              >
                <MethodBadge method={ep.method} />
                <span className="truncate font-mono text-[10px]">{ep.path}</span>
              </button>
            ))}
          </div>
        )
      })}
    </div>
  )
}
