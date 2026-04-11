import { Globe, GitBranch } from 'lucide-react'

export function SourceBadge({ source }: { source: 'endpoint' | 'repo' }) {
  return source === 'endpoint' ? (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ring-1"
      style={{
        background: 'var(--badge-endpoint-bg)',
        color: 'var(--badge-endpoint-text)',
        border: '1px solid var(--badge-endpoint-ring)',
      }}
    >
      <Globe size={10} /> endpoint
    </span>
  ) : (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{
        background: 'var(--badge-repo-bg)',
        color: 'var(--badge-repo-text)',
        border: '1px solid var(--badge-repo-ring)',
      }}
    >
      <GitBranch size={10} /> repo
    </span>
  )
}
