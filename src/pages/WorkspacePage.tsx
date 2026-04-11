import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listContracts } from '../api/contracts'
import { ContractListPanel } from '../components/ContractListPanel'
import { ContractDetailPanels } from '../components/ContractDetailPanels'
import { EmptyState } from '../components/EmptyState'
import { GenerateModal } from '../components/GenerateModal'
import { ResizeHandle } from '../components/ui/ResizeHandle'

const STORAGE_KEY = 'portal-sidebar-width'

export function WorkspacePage() {
  const [selected, setSelected] = useState<{ slug: string; timestamp: string } | null>(null)
  const [activeEndpointId, setActiveEndpointId] = useState('')
  const [showModal, setShowModal] = useState(false)
  const { data: contracts = [], refetch } = useQuery({ queryKey: ['contracts'], queryFn: listContracts })

  // Sidebar width state with persistence
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? parseInt(saved, 10) : 280
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, sidebarWidth.toString())
  }, [sidebarWidth])

  const handleSelectContract = (c: { slug: string; timestamp: string }) => {
    if (selected?.slug !== c.slug || selected?.timestamp !== c.timestamp) {
      setActiveEndpointId('')
    }
    setSelected(c)
  }

  const handleSelectEndpoint = (slug: string, timestamp: string, epId: string) => {
    setSelected({ slug, timestamp })
    setActiveEndpointId(epId)
  }

  const handleSuccess = (slug: string, timestamp: string) => {
    setShowModal(false)
    refetch()
    setSelected({ slug, timestamp })
    setActiveEndpointId('')
  }

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        <div style={{ width: sidebarWidth, minWidth: 200, maxWidth: 450 }} className="flex shrink-0 overflow-hidden">
          <ContractListPanel
            selected={selected}
            activeEndpointId={activeEndpointId}
            onSelectContract={handleSelectContract}
            onSelectEndpoint={handleSelectEndpoint}
            onGenerate={() => setShowModal(true)}
            onRefetch={refetch}
          />
        </div>

        <ResizeHandle 
          side="right" 
          onResize={(delta) => setSidebarWidth(prev => Math.min(450, Math.max(200, prev + delta)))} 
        />

        {selected
          ? <ContractDetailPanels
              key={`${selected.slug}-${selected.timestamp}`}
              slug={selected.slug}
              timestamp={selected.timestamp}
              activeEndpointId={activeEndpointId}
              onFirstEndpoint={setActiveEndpointId}
            />
          : <EmptyState onGenerate={() => setShowModal(true)} />
        }
      </div>

      {showModal && (
        <GenerateModal
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
          existingContracts={contracts}
        />
      )}
    </div>
  )
}
