import React, { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { MethodBadge } from '../ui/MethodBadge'
import type { 
  OASchema, 
  OAParameter, 
  OAOperation 
} from '../../utils/schema'
import { 
  resolveSchema, 
  typeLabel 
} from '../../utils/schema'

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>{children}</p>
}

export function Divider() {
  return <hr style={{ borderColor: 'var(--border-muted)', margin: '2rem 0' }} />
}

export function PropertiesTable({ schema, root, requiredFields }: {
  schema: OASchema
  root: Record<string, unknown>
  requiredFields?: string[]
}) {
  const resolved = resolveSchema(schema, root)
  const properties = resolved.properties as Record<string, OASchema> | undefined
  if (!properties || Object.keys(properties).length === 0) return null
  const required = requiredFields ?? (resolved.required as string[] | undefined) ?? []

  return (
    <div className="rounded-lg overflow-hidden text-xs" style={{ border: '1px solid var(--border-muted)' }}>
      <div
        className="grid text-[11px] font-semibold uppercase tracking-wider px-4 py-2"
        style={{ gridTemplateColumns: '1fr 1fr 80px 2fr', background: 'var(--bg-elevated)', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-muted)' }}
      >
        <span>Name</span><span>Type</span><span>Required</span><span>Description</span>
      </div>
      {Object.entries(properties).map(([name, prop], i) => (
        <div
          key={name}
          className="grid px-4 py-2.5 items-start"
          style={{ gridTemplateColumns: '1fr 1fr 80px 2fr', background: i % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)' }}
        >
          <span className="font-mono font-medium" style={{ color: 'var(--text-primary)' }}>{name}</span>
          <span style={{ color: 'var(--accent-text)' }}>{typeLabel(prop, root)}</span>
          <span>{required.includes(name) ? <span className="text-red-400">yes</span> : <span style={{ color: 'var(--text-muted)' }}>no</span>}</span>
          <span style={{ color: 'var(--text-secondary)' }}>{(prop.description as string) ?? '—'}</span>
        </div>
      ))}
    </div>
  )
}

export function ParametersSection({ params, root }: { params: OAParameter[]; root: Record<string, unknown> }) {
  const grouped: Record<string, OAParameter[]> = {}
  for (const p of params) { (grouped[p.in] ??= []).push(p) }
  return (
    <>
      {Object.entries(grouped).map(([location, list]) => (
        <div key={location} className="mb-6">
          <SectionLabel>{location} parameters</SectionLabel>
          <div className="rounded-lg overflow-hidden text-xs" style={{ border: '1px solid var(--border-muted)' }}>
            <div
              className="grid text-[11px] font-semibold uppercase tracking-wider px-4 py-2"
              style={{ gridTemplateColumns: '1fr 1fr 80px 2fr', background: 'var(--bg-elevated)', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-muted)' }}
            >
              <span>Name</span><span>Type</span><span>Required</span><span>Description</span>
            </div>
            {list.map((p, i) => (
              <div key={p.name} className="grid px-4 py-2.5 items-start"
                style={{ gridTemplateColumns: '1fr 1fr 80px 2fr', background: i % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)' }}>
                <span className="font-mono font-medium" style={{ color: 'var(--text-primary)' }}>
                  {p.name}
                  {p.deprecated && <span className="ml-1.5 text-[10px] text-orange-400"> deprecated</span>}
                </span>
                <span style={{ color: 'var(--accent-text)' }}>{typeLabel(p.schema, root)}</span>
                <span>{p.required ? <span className="text-red-400">yes</span> : <span style={{ color: 'var(--text-muted)' }}>no</span>}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{p.description ?? '—'}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}

export function RequestBodySection({ requestBody, root }: { requestBody: OAOperation['requestBody']; root: Record<string, unknown> }) {
  if (!requestBody?.content) return null
  const [firstType, firstContent] = Object.entries(requestBody.content)[0] ?? []
  if (!firstContent) return null
  return (
    <div>
      <SectionLabel>Request body</SectionLabel>
      {requestBody.description && <p className="mb-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{requestBody.description}</p>}
      <p className="mb-2 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
        Content-Type: {firstType} {requestBody.required && <span className="text-red-400">required</span>}
      </p>
      {firstContent.schema
        ? <PropertiesTable schema={firstContent.schema} root={root} />
        : <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No schema defined.</p>}
    </div>
  )
}

const STATUS_COLORS: Record<string, string> = { '2': '#22c55e', '3': '#f59e0b', '4': '#f87171', '5': '#f87171' }

export function ResponsesSection({ responses, root }: { responses: NonNullable<OAOperation['responses']>; root: Record<string, unknown> }) {
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const toggle = (code: string) => setOpen(o => ({ ...o, [code]: !o[code] }))
  return (
    <div className="flex flex-col gap-3">
      {Object.entries(responses).map(([code, resp]) => {
        const firstContent = resp.content ? Object.entries(resp.content)[0] : undefined
        const schema = firstContent?.[1]?.schema
        const isOpen = open[code] ?? false
        return (
          <div key={code} className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-muted)' }}>
            <button onClick={() => schema && toggle(code)} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left"
              style={{ background: 'var(--bg-surface)', cursor: schema ? 'pointer' : 'default' }}>
              <span className="font-mono font-semibold" style={{ color: STATUS_COLORS[code[0]] ?? 'var(--text-secondary)' }}>{code}</span>
              <span style={{ color: 'var(--text-secondary)' }}>{resp.description ?? ''}</span>
              {schema && <span className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}>{isOpen ? '▲ hide' : '▼ schema'}</span>}
            </button>
            {isOpen && schema && (
              <div className="px-4 py-3" style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-muted)' }}>
                {firstContent && <p className="mb-2 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>Content-Type: {firstContent[0]}</p>}
                <PropertiesTable schema={schema} root={root} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function EndpointDoc({ method, path, operation, root }: {
  method: string; path: string; operation: OAOperation; root: Record<string, unknown>
}) {
  const params = operation.parameters ?? []
  return (
    <div>
      <div className="flex items-start gap-3 mb-2 flex-wrap">
        <MethodBadge method={method} />
        <code className="font-mono text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{path}</code>
        {operation.deprecated && <span className="flex items-center gap-1 text-xs text-orange-400"><AlertTriangle size={12} /> Deprecated</span>}
      </div>
      {operation.summary && <p className="text-base mb-1 font-medium" style={{ color: 'var(--text-primary)' }}>{operation.summary}</p>}
      {operation.tags && operation.tags.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {operation.tags.map(t => (
            <span key={t} className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: 'var(--accent-bg)', color: 'var(--accent-text)' }}>{t}</span>
          ))}
        </div>
      )}
      {operation.description && <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>{operation.description}</p>}
      {params.length > 0 && <><Divider /><ParametersSection params={params} root={root} /></>}
      {operation.requestBody && <><Divider /><RequestBodySection requestBody={operation.requestBody} root={root} /></>}
      {operation.responses && Object.keys(operation.responses).length > 0 && (
        <><Divider /><SectionLabel>Responses</SectionLabel><ResponsesSection responses={operation.responses} root={root} /></>
      )}
    </div>
  )
}

export function OverviewDoc({ openApiJson }: { openApiJson: Record<string, unknown> }) {
  const info = (openApiJson.info ?? {}) as Record<string, unknown>
  const servers = (openApiJson.servers ?? []) as { url: string; description?: string }[]
  return (
    <div>
      <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{(info.title as string) ?? 'API Reference'}</h1>
      {!!info.version && (
        <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
          v{info.version as string}
        </span>
      )}
      {!!info.description && <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{info.description as string}</p>}
      {servers.length > 0 && (
        <><Divider /><SectionLabel>Base URL</SectionLabel>
          <div className="flex flex-col gap-2">
            {servers.map(s => (
              <div key={s.url} className="flex items-center gap-3">
                <code className="text-sm font-mono px-3 py-1.5 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>{s.url}</code>
                {s.description && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.description}</span>}
              </div>
            ))}
          </div>
        </>
      )}
      <Divider />
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Select an endpoint from the sidebar to view its documentation.</p>
    </div>
  )
}
