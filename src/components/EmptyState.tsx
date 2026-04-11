import { Plus, FileText } from 'lucide-react'

const accentBtn = { background: 'var(--accent)', color: '#fff' }

export function EmptyState({ onGenerate }: { onGenerate: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center px-8">
      <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-elevated)' }}>
        <FileText size={28} style={{ color: 'var(--text-muted)' }} />
      </div>
      <div>
        <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>Select a contract</p>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Choose one from the list or generate a new one.
        </p>
      </div>
      <button onClick={onGenerate}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg hover:opacity-90"
        style={accentBtn}>
        <Plus size={15} /> Generate New
      </button>
    </div>
  )
}
