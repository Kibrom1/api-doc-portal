import { useMemo } from 'react'

interface DiffViewerProps {
  oldValue: string
  newValue: string
  language?: string
}

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged'
  content: string
  oldLineNumber?: number
  newLineNumber?: number
}

export function DiffViewer({ oldValue, newValue }: DiffViewerProps) {
  const diff = useMemo(() => {
    const oldLines = oldValue.split('\n')
    const newLines = newValue.split('\n')
    
    // Simple line-level diffing (Naive implementation for efficiency)
    // For a "premium" feel, we'll do a basic LCS or similar if needed, 
    // but line-by-line comparison is usually sufficient for documentation.
    const result: DiffLine[] = []
    
    // This is a simplified diff logic. 
    // In a real app, you'd use a robust library, but we'll build a clean one here.
    let i = 0, j = 0
    while (i < oldLines.length || j < newLines.length) {
      if (i < oldLines.length && j < newLines.length && oldLines[i] === newLines[j]) {
        result.push({ type: 'unchanged', content: oldLines[i], oldLineNumber: i + 1, newLineNumber: j + 1 })
        i++; j++
      } else if (j < newLines.length && (i >= oldLines.length || !oldLines.slice(i).includes(newLines[j]))) {
        result.push({ type: 'added', content: newLines[j], newLineNumber: j + 1 })
        j++
      } else if (i < oldLines.length) {
        result.push({ type: 'removed', content: oldLines[i], oldLineNumber: i + 1 })
        i++
      }
    }
    return result
  }, [oldValue, newValue])

  return (
    <div className="font-mono text-[13px] border rounded-lg overflow-hidden" style={{ background: 'var(--bg-base)', borderColor: 'var(--border)' }}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <tbody>
            {diff.map((line, idx) => (
              <tr key={idx} className={
                line.type === 'added' ? 'bg-green-500/10' : 
                line.type === 'removed' ? 'bg-red-500/10' : ''
              }>
                <td className="w-12 px-2 py-0.5 text-right select-none opacity-30 border-r" style={{ borderColor: 'var(--border-muted)', color: 'var(--text-muted)' }}>
                  {line.oldLineNumber || ''}
                </td>
                <td className="w-12 px-2 py-0.5 text-right select-none opacity-30 border-r" style={{ borderColor: 'var(--border-muted)', color: 'var(--text-muted)' }}>
                  {line.newLineNumber || ''}
                </td>
                <td className="w-6 px-2 py-0.5 text-center select-none opacity-50">
                  {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                </td>
                <td className="px-4 py-0.5 whitespace-pre">
                  <span style={{ 
                    color: line.type === 'added' ? '#4ade80' : 
                          line.type === 'removed' ? '#f87171' : 
                          'var(--text-primary)' 
                  }}>
                    {line.content || ' '}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
