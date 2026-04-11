import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search, FileText, ChevronRight, ChevronDown, History } from 'lucide-react'
import { listContracts } from '../api/contracts'
import { Spinner } from './ui/Spinner'
import { ContractEndpointList } from './ContractEndpointList'
import type { Contract } from '../types'

const accentBtn = { background: 'var(--accent)', color: '#fff' }
const inputBase = { background: 'var(--bg-elevated)', border: '1px solid var(--border-muted)', color: 'var(--text-primary)' }

interface ApiGroup {
  slug: string
  source_ref: string
  versions: Contract[]
  latest_at: string
}

export function ContractListPanel({ selected, activeEndpointId, onSelectContract, onSelectEndpoint, onGenerate, onRefetch }: {
  selected: { slug: string; timestamp: string } | null
  activeEndpointId: string
  onSelectContract: (c: { slug: string; timestamp: string }) => void
  onSelectEndpoint: (slug: string, timestamp: string, epId: string) => void
  onGenerate: () => void
  onRefetch: () => void
}) {
  const [search, setSearch] = useState('')
  const [expandedApis, setExpandedApis] = useState<Record<string, boolean>>({})

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['contracts'],
    queryFn: listContracts,
  })

  useEffect(() => { onRefetch() }, [])

  // Group contracts by slug
  const groupedApis = useMemo(() => {
    const groups: Record<string, ApiGroup> = {}
    
    contracts.forEach(c => {
      if (!groups[c.slug]) {
        groups[c.slug] = {
          slug: c.slug,
          source_ref: c.source_ref,
          versions: [],
          latest_at: c.generated_at
        }
      }
      groups[c.slug].versions.push(c)
      if (new Date(c.generated_at) > new Date(groups[c.slug].latest_at)) {
        groups[c.slug].latest_at = c.generated_at
      }
    })

    return Object.values(groups)
      .sort((a, b) => new Date(b.latest_at).getTime() - new Date(a.latest_at).getTime())
  }, [contracts])

  const filtered = groupedApis.filter(g =>
    g.source_ref.toLowerCase().includes(search.toLowerCase())
  )

  const toggleExpand = (slug: string) => setExpandedApis(prev => ({ ...prev, [slug]: !prev[slug] }))

  return (
    <aside className="w-full shrink-0 flex flex-col overflow-hidden" style={{ background: 'var(--bg-base)', borderRight: '1px solid var(--border)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Contracts</p>
        <button onClick={onGenerate}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-opacity hover:opacity-90"
          style={accentBtn}>
          <Plus size={11} /> New
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2.5 shrink-0" style={{ borderBottom: '1px solid var(--border-muted)' }}>
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            className="w-full rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none"
            style={inputBase}
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-1">
        {isLoading ? (
          <div className="flex justify-center py-8"><Spinner size={20} /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <FileText size={20} className="mb-2" style={{ color: 'var(--text-muted)' }} />
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {contracts.length === 0 ? 'No contracts yet.' : 'No matches.'}
            </p>
          </div>
        ) : (
          filtered.map(group => {
            const isAnyInGroupSelected = selected?.slug === group.slug
            const isGroupExpanded = expandedApis[group.slug] ?? isAnyInGroupSelected
            
            return (
              <div key={group.slug} className="mb-1">
                {/* API Group Header */}
                <button
                  className="group w-full text-left px-4 py-2 flex items-start gap-2 hover:bg-black/5 transition-colors"
                  onClick={() => toggleExpand(group.slug)}
                >
                  <span className="mt-1 text-[10px] shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {isGroupExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate"
                      style={{ color: isAnyInGroupSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                      title={group.source_ref}>
                      {group.source_ref.replace(/^https?:\/\//, '')}
                    </p>
                    <p className="text-[10px] mt-0.5 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                      <History size={10} /> {group.versions.length} {group.versions.length === 1 ? 'version' : 'versions'}
                    </p>
                  </div>
                </button>

                {isGroupExpanded && (
                  <div className="pl-4">
                    {group.versions.map(v => {
                      const isSelected = selected?.slug === v.slug && selected?.timestamp === v.timestamp
                      return (
                        <div key={v.timestamp}>
                          <button
                            className="w-full text-left pl-6 pr-4 py-1.5 text-[11px] hover:bg-black/5 transition-colors border-l"
                            style={isSelected
                              ? { color: 'var(--accent-text)', borderColor: 'var(--accent)', background: 'var(--bg-elevated)' }
                              : { color: 'var(--text-muted)', borderColor: 'var(--border-muted)' }}
                            onClick={() => onSelectContract({ slug: v.slug, timestamp: v.timestamp })}
                          >
                            <span className="font-medium">
                              {new Date(v.generated_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                            </span>
                          </button>
                          
                          {isSelected && (
                            <div className="pl-2">
                              <ContractEndpointList
                                slug={v.slug}
                                timestamp={v.timestamp}
                                activeEndpointId={activeEndpointId}
                                onSelect={epId => onSelectEndpoint(v.slug, v.timestamp, epId)}
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </aside>
  )
}
