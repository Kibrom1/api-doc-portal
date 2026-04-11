import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkHtml from 'remark-html'
import { getContract } from '../api/contracts'
import { Spinner } from './ui/Spinner'
import { SourceBadge } from './ui/SourceBadge'
import { CodeBlock } from './ui/CodeBlock'
import { CodePanel } from './CodePanel'
import { ResizeHandle } from './ui/ResizeHandle'
import { EndpointDoc, OverviewDoc } from './documentation/DocsRenderer'
import { extractEndpoints } from '../utils/schema'
import type { OAOperation } from '../utils/schema'

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

export function ContractDetailPanels({ slug, timestamp, activeEndpointId, onFirstEndpoint }: {
  slug: string
  timestamp: string
  activeEndpointId: string
  onFirstEndpoint: (id: string) => void
}) {
  const [activeTab, setActiveTab] = useState<'docs' | 'spec'>('docs')

  const { data: contract, isLoading, error } = useQuery({
    queryKey: ['contract', slug, timestamp],
    queryFn: () => getContract(slug, timestamp),
  })

  // Code panel width state with persistence
  const [codePanelWidth, setCodePanelWidth] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? parseInt(saved, 10) : 320
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, codePanelWidth.toString())
  }, [codePanelWidth])

  const root = (contract?.openapi_json ?? {}) as Record<string, unknown>
  const endpoints = contract ? extractEndpoints(root) : []
  const serverUrl = (root.servers as { url: string }[] | undefined)?.[0]?.url ?? ''
  const activeEp = endpoints.find(e => e.id === activeEndpointId)

  useEffect(() => {
    if (endpoints.length > 0 && !activeEndpointId) {
      onFirstEndpoint(endpoints[0].id)
    }
  }, [contract])

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

  const activeOperation = activeEp
    ? ((root.paths as Record<string, Record<string, unknown>> | undefined)?.[activeEp.path]?.[activeEp.method.toLowerCase()] as OAOperation | undefined)
    : undefined

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
        <div className="flex items-center px-5 shrink-0" style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border)' }}>
          {(['docs', 'spec'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px"
              style={activeTab === tab
                ? { borderColor: 'var(--accent)', color: 'var(--accent-text)' }
                : { borderColor: 'transparent', color: 'var(--text-muted)' }}>
              {tab === 'docs' ? 'Documentation' : 'OpenAPI Spec'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-8">
          {activeTab === 'docs' ? (
            <div className="max-w-3xl">
              {activeEp && activeOperation
                ? <EndpointDoc key={activeEp.id} method={activeEp.method} path={activeEp.path} operation={activeOperation} root={root} />
                : <OverviewDoc openApiJson={root} />}
            </div>
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
