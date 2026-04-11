const METHOD_STYLES: Record<string, string> = {
  GET:    'bg-blue-500/15 text-blue-400 ring-blue-500/30',
  POST:   'bg-green-500/15 text-green-400 ring-green-500/30',
  PUT:    'bg-orange-500/15 text-orange-400 ring-orange-500/30',
  PATCH:  'bg-purple-500/15 text-purple-400 ring-purple-500/30',
  DELETE: 'bg-red-500/15 text-red-400 ring-red-500/30',
  HEAD:   'bg-gray-500/15 text-gray-400 ring-gray-500/30',
}

export function MethodBadge({ method }: { method: string }) {
  const upper = method.toUpperCase()
  const styles = METHOD_STYLES[upper] ?? METHOD_STYLES.GET
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono ring-1 ${styles}`}>
      {upper}
    </span>
  )
}
