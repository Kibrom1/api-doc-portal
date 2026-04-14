import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Download, Pencil, X, Save } from 'lucide-react'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkHtml from 'remark-html'
import ReactMarkdown from 'react-markdown'
import { getContract, updateMarkdown } from '../api/contracts'
import { Spinner } from './ui/Spinner'
import { SourceBadge } from './ui/SourceBadge'
import { CodeBlock } from './ui/CodeBlock'
import { CodePanel } from './CodePanel'
import { ResizeHandle } from './ui/ResizeHandle'
import { extractEndpoints } from '../utils/schema'

const STORAGE_KEY = 'portal-code-panel-width'

const HTML_STYLES = `
    *, *::before, *::after { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 900px; margin: 48px auto; padding: 0 32px;
      color: #111827; background: #ffffff; line-height: 1.75; font-size: 15px;
    }
    h1 { font-size: 2rem; font-weight: 700; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.6rem; margin: 0 0 1.5rem; color: #030712; }
    h2 { font-size: 1.35rem; font-weight: 600; margin: 2.5rem 0 0.75rem; padding-bottom: 0.35rem; border-bottom: 1px solid #f3f4f6; color: #111827; }
    h3 { font-size: 1.05rem; font-weight: 600; margin: 1.75rem 0 0.5rem; color: #1f2937; }
    h4 { font-size: 0.95rem; font-weight: 600; margin: 1.25rem 0 0.4rem; color: #374151; }
    p { margin: 0.6rem 0 1rem; }
    a { color: #4f46e5; text-decoration: none; }
    a:hover { text-decoration: underline; }
    code {
      background: #f3f4f6; color: #4f46e5;
      padding: 0.15em 0.45em; border-radius: 4px;
      font-family: 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
      font-size: 0.865em;
    }
    pre {
      background: #0f172a; color: #e2e8f0;
      padding: 1.1rem 1.4rem; border-radius: 10px;
      overflow-x: auto; margin: 1.25rem 0;
      border: 1px solid #1e293b;
    }
    pre code {
      background: none; padding: 0; color: inherit;
      font-size: 0.83rem; line-height: 1.65;
    }
    blockquote {
      border-left: 4px solid #6366f1; margin: 1rem 0;
      padding: 0.5rem 1rem; background: #f5f3ff; color: #4b5563; border-radius: 0 6px 6px 0;
    }
    table { border-collapse: collapse; width: 100%; margin: 1.25rem 0; font-size: 0.875rem; }
    thead tr { background: #f9fafb; }
    th { text-align: left; padding: 10px 14px; border: 1px solid #e5e7eb; font-weight: 600; color: #374151; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.04em; }
    td { padding: 9px 14px; border: 1px solid #e5e7eb; vertical-align: top; }
    tbody tr:nth-child(even) td { background: #f9fafb; }
    ul, ol { padding-left: 1.5rem; margin: 0.5rem 0 1rem; }
    li { margin: 0.3rem 0; }
    hr { border: none; border-top: 1px solid #e5e7eb; margin: 2rem 0; }
    .method { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; font-family: monospace; margin-right: 6px; }
`

const markdownProseVars: React.CSSProperties = {
  ['--tw-prose-body' as string]: 'var(--text-secondary)',
  ['--tw-prose-headings' as string]: 'var(--text-primary)',
  ['--tw-prose-bold' as string]: 'var(--text-primary)',
  ['--tw-prose-code' as string]: 'var(--accent-text)',
  ['--tw-prose-pre-bg' as string]: 'var(--bg-elevated)',
  ['--tw-prose-td-borders' as string]: 'var(--border-muted)',
  ['--tw-prose-th-borders' as string]: 'var(--border-muted)',
  ['--tw-prose-hr' as string]: 'var(--border-muted)',
  ['--tw-prose-links' as string]: 'var(--accent-text)',
  ['--tw-prose-quotes' as string]: 'var(--text-muted)',
  ['--tw-prose-quote-borders' as string]: 'var(--accent)',
  ['--tw-prose-counters' as string]: 'var(--text-muted)',
  ['--tw-prose-bullets' as string]: 'var(--text-muted)',
}

/** Extract the ### `METHOD /path` block for one endpoint from the full markdown. */
function extractEndpointSection(markdown: string, method: string, path: string): string {
  const heading = `### \`${method.toUpperCase()} ${path}\``
  const lines = markdown.split('\n')
  const start = lines.findIndex(l => l.trim() === heading)
  if (start === -1) return ''
  // Collect until next ### or ## heading (or end)
  let end = lines.length
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].startsWith('## ') || lines[i].startsWith('### ')) { end = i; break }
  }
  return lines.slice(start, end).join('\n').trimEnd()
}

/** Splice an edited endpoint section back into the full markdown. */
function replaceEndpointSection(markdown: string, method: string, path: string, newSection: string): string {
  const heading = `### \`${method.toUpperCase()} ${path}\``
  const lines = markdown.split('\n')
  const start = lines.findIndex(l => l.trim() === heading)
  if (start === -1) return markdown
  let end = lines.length
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].startsWith('## ') || lines[i].startsWith('### ')) { end = i; break }
  }
  return [...lines.slice(0, start), newSection, '', ...lines.slice(end)].join('\n')
}

export function ContractDetailPanels({ slug, timestamp, activeEndpointId, onFirstEndpoint }: {
  slug: string
  timestamp: string
  activeEndpointId: string
  onFirstEndpoint: (id: string) => void
}) {
  const [activeTab, setActiveTab] = useState<'docs' | 'spec'>('docs')
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')

  const queryClient = useQueryClient()

  const { data: contract, isLoading, error } = useQuery({
    queryKey: ['contract', slug, timestamp],
    queryFn: () => getContract(slug, timestamp),
  })

  const root = (contract?.openapi_json ?? {}) as Record<string, unknown>
  const endpoints = contract ? extractEndpoints(root) : []
  const serverUrl = (root.servers as { url: string }[] | undefined)?.[0]?.url ?? ''
  const activeEp = endpoints.find(e => e.id === activeEndpointId)

  const saveMutation = useMutation({
    mutationFn: (editedSection: string) => {
      if (!contract || !activeEp) throw new Error('No endpoint selected')
      const fullMarkdown = replaceEndpointSection(contract.markdown_doc, activeEp.method, activeEp.path, editedSection)
      return updateMarkdown(slug, timestamp, fullMarkdown)
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['contract', slug, timestamp], updated)
      setIsEditing(false)
    },
  })

  // Code panel width state with persistence
  const [codePanelWidth, setCodePanelWidth] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? parseInt(saved, 10) : 320
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, codePanelWidth.toString())
  }, [codePanelWidth])

  useEffect(() => {
    if (endpoints.length > 0 && !activeEndpointId) {
      onFirstEndpoint(endpoints[0].id)
    }
  }, [contract])

  // Cancel edit when switching endpoints
  useEffect(() => {
    setIsEditing(false)
  }, [activeEndpointId])

  const downloadFile = (type: 'yaml' | 'json' | 'html') => {
    if (!contract) return
    let content: string
    let mimeType: string
    let ext: string
    if (type === 'yaml') {
      content = contract.openapi_yaml
      mimeType = 'text/yaml'
      ext = 'yaml'
    } else if (type === 'json') {
      content = JSON.stringify(contract.openapi_json, null, 2)
      mimeType = 'application/json'
      ext = 'json'
    } else {
      const title = contract.source_ref.replace(/^https?:\/\//, '')
      const body = String(
        unified()
          .use(remarkParse)
          .use(remarkGfm)
          .use(remarkHtml, { sanitize: false })
          .processSync(contract.markdown_doc)
      )
      content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — API Documentation</title>
  <style>${HTML_STYLES}</style>
</head>
<body>
${body}
</body>
</html>`
      mimeType = 'text/html'
      ext = 'html'
    }
    const blob = new Blob([content], { type: mimeType })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${slug}-contract.${ext}`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  if (isLoading) return <div className="flex flex-1 items-center justify-center"><Spinner size={32} /></div>
  if (error || !contract) return <div className="flex flex-1 items-center justify-center"><p className="text-sm" style={{ color: 'var(--text-muted)' }}>Failed to load contract.</p></div>

  // Markdown slice to render in the docs panel
  const docMarkdown = activeEp
    ? extractEndpointSection(contract.markdown_doc, activeEp.method, activeEp.path)
    : contract.markdown_doc

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Info strip */}
        <div className="flex items-center justify-between px-5 py-2.5 shrink-0" style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2.5 min-w-0">
            <SourceBadge source={contract.source} />
            <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{contract.source_ref}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {(['yaml', 'json', 'html'] as const).map(t => (
              <button key={t} onClick={() => downloadFile(t)}
                className="flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors"
                style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-muted)' }}>
                <Download size={10} /> {t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between px-5 shrink-0" style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center">
            {(['docs', 'spec'] as const).map(tab => (
              <button key={tab} onClick={() => { setActiveTab(tab); setIsEditing(false) }}
                className="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px"
                style={activeTab === tab
                  ? { borderColor: 'var(--accent)', color: 'var(--accent-text)' }
                  : { borderColor: 'transparent', color: 'var(--text-muted)' }}>
                {tab === 'docs' ? 'Documentation' : 'OpenAPI Spec'}
              </button>
            ))}
          </div>

          {activeTab === 'docs' && (
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={() => { setIsEditing(false) }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors"
                    style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-muted)' }}>
                    <X size={12} /> Cancel
                  </button>
                  <button
                    onClick={() => saveMutation.mutate(editValue)}
                    disabled={saveMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-60"
                    style={{ background: 'var(--accent)', color: '#fff' }}>
                    <Save size={12} /> {saveMutation.isPending ? 'Saving...' : 'Save'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    if (!contract || !activeEp) return
                    const section = extractEndpointSection(contract.markdown_doc, activeEp.method, activeEp.path)
                    setEditValue(section)
                    setIsEditing(true)
                  }}
                  disabled={!activeEp}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-muted)' }}
                  title={activeEp ? `Edit documentation for ${activeEp.method} ${activeEp.path}` : 'Select an endpoint to edit'}>
                  <Pencil size={12} /> Edit
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-8">
          {activeTab === 'docs' ? (
            isEditing ? (
              <div className="max-w-3xl flex flex-col gap-3 h-full">
                {saveMutation.isError && (
                  <p className="text-xs text-red-400 px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    Failed to save. Please try again.
                  </p>
                )}
                <textarea
                  className="flex-1 w-full rounded-lg p-4 text-sm font-mono leading-relaxed resize-none focus:outline-none"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-muted)',
                    color: 'var(--text-primary)',
                    minHeight: '70vh',
                  }}
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  spellCheck={false}
                />
              </div>
            ) : (
              <div className="max-w-3xl prose prose-sm max-w-none" style={markdownProseVars}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {docMarkdown}
                </ReactMarkdown>
              </div>
            )
          ) : (
            <div className="max-w-4xl">
              <CodeBlock code={contract.openapi_yaml} language="yaml" maxHeight="100%" />
            </div>
          )}
        </div>
      </div>

      <ResizeHandle 
        side="left" 
        onResize={(delta) => setCodePanelWidth(prev => Math.min(600, Math.max(250, prev + delta)))} 
      />

      <div style={{ width: codePanelWidth, minWidth: 250, maxWidth: 600 }} className="flex shrink-0 overflow-hidden">
        <CodePanel activeEp={activeEp} serverUrl={serverUrl} />
      </div>
    </>
  )
}
