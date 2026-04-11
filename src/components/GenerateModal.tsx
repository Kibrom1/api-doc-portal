import { useState, useEffect } from 'react'
import { apiClient } from '../api/client'
import { Spinner } from './ui/Spinner'
import type { Contract } from '../types'

// ─── Style helpers ────────────────────────────────────────────────────────────
const surface   = { background: 'var(--bg-surface)',  border: '1px solid var(--border)' }
const inputBase = { background: 'var(--bg-elevated)', border: '1px solid var(--border-muted)', color: 'var(--text-primary)' }
const accentBtn = { background: 'var(--accent)', color: '#fff' }

const PROGRESS_STEPS: Record<'endpoint' | 'repo', string[]> = {
  endpoint: ['Calling endpoint...', 'Analyzing response...', 'Generating contract...'],
  repo:     ['Cloning repository...', 'Scanning source files...', 'Generating contract...'],
}

function ProgressIndicator({ mode, elapsed }: { mode: 'endpoint' | 'repo'; elapsed: number }) {
  const steps = PROGRESS_STEPS[mode]
  const stepIndex = Math.min(Math.floor(elapsed / 8), steps.length - 1)
  return (
    <div className="py-4 space-y-3">
      {steps.map((label, i) => {
        const done = i < stepIndex
        const active = i === stepIndex
        return (
          <div key={label} className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
              style={done ? { background: 'rgba(34,197,94,0.15)', color: '#4ade80' }
                : active ? { background: 'var(--accent-bg)', color: 'var(--accent-text)' }
                : { background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
              {done ? (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : active ? (
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--accent)' }} />
              ) : (
                <span className="w-2 h-2 rounded-full" style={{ background: 'var(--text-muted)' }} />
              )}
            </div>
            <span className={`text-sm ${done ? 'line-through' : ''}`}
              style={{ color: done ? 'var(--text-muted)' : active ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              {label}
            </span>
          </div>
        )
      })}
      <p className="text-xs pt-1 pl-8" style={{ color: 'var(--text-muted)' }}>{elapsed}s elapsed · typically 20–60s</p>
    </div>
  )
}

export function GenerateModal({ onClose, onSuccess, existingContracts }: {
  onClose: () => void
  onSuccess: (slug: string, timestamp: string) => void
  existingContracts: Contract[]
}) {
  const [mode, setMode] = useState<'endpoint' | 'repo'>('endpoint')
  const [step, setStep] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    url: '', method: 'GET', description: '', authType: 'none', token: '',
    repo_url: '', access_token: '', branch: 'main', service_path: '', framework: '',
    replace_existing: false
  })

  const set = (k: string, v: string | boolean) => {
    setForm(f => ({ ...f, [k]: v }))
    if (typeof v === 'string' && fieldErrors[k]) setFieldErrors(fe => { const n = { ...fe }; delete n[k]; return n })
  }

  useEffect(() => {
    if (step !== 'loading') { setElapsed(0); return }
    const id = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(id)
  }, [step])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && step !== 'loading') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [step, onClose])

  const validate = (): boolean => {
    const errors: Record<string, string> = {}
    if (mode === 'endpoint') {
      if (!form.url.trim()) errors.url = 'Endpoint URL is required'
      else if (!/^https?:\/\/.+/.test(form.url.trim())) errors.url = 'Must be a valid http(s) URL'
      if (form.authType !== 'none' && !form.token.trim()) errors.token = 'Token is required when authentication is enabled'
    } else {
      if (!form.repo_url.trim()) errors.repo_url = 'Repository URL is required'
      // Allow local paths or URLs
      const isUrl = /^https?:\/\/.+/.test(form.repo_url.trim())
      const isLocalPath = /^[./~]/.test(form.repo_url.trim()) || form.repo_url.includes('/')
      if (!isUrl && !isLocalPath) errors.repo_url = 'Must be a valid URL or local path'
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleGenerate = async () => {
    if (!validate()) return
    setStep('loading')
    setErrorMsg('')
    try {
      const ep = mode === 'endpoint' ? '/api/v1/generate/from-endpoint' : '/api/v1/generate/from-repo'
      const payload = mode === 'endpoint'
        ? { url: form.url.trim(), method: form.method, description: form.description || undefined,
            auth: form.authType !== 'none' ? { type: form.authType, token: form.token } : undefined,
            replace_existing: form.replace_existing }
        : { repo_url: form.repo_url.trim(), access_token: form.access_token || undefined,
            branch: form.branch, service_path: form.service_path, framework: form.framework || undefined,
            replace_existing: form.replace_existing }
      const { data } = await apiClient.post(ep, payload)
      const parts = data.saved_to?.split('/') ?? []
      setStep('done')
      setTimeout(() => onSuccess(parts[parts.length - 2], parts[parts.length - 1]), 600)
    } catch (e: unknown) {
      setErrorMsg((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Generation failed. Please try again.')
      setStep('error')
    }
  }

  const inputStyle = (field: string): React.CSSProperties => ({
    ...inputBase,
    ...(fieldErrors[field] ? { borderColor: '#ef4444' } : {}),
  })

  const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>{children}</label>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="rounded-xl w-full max-w-lg shadow-2xl overflow-hidden" style={surface}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Generate New Contract</h2>
          <button onClick={onClose} disabled={step === 'loading'}
            className="text-xl leading-none disabled:opacity-40 hover:opacity-60" style={{ color: 'var(--text-secondary)' }}>
            &times;
          </button>
        </div>
        <div className="p-6 space-y-5">
          {step === 'loading' ? <ProgressIndicator mode={mode} elapsed={elapsed} /> : (
            <>
              <div className="grid grid-cols-2 gap-3">
                {(['endpoint', 'repo'] as const).map(m => (
                  <button key={m} onClick={() => { setMode(m); setFieldErrors({}); set('replace_existing', false) }}
                    className="py-3 px-4 rounded-lg text-sm font-medium transition-all"
                    style={mode === m
                      ? { border: '1px solid var(--accent)', background: 'var(--accent-bg)', color: 'var(--accent-text)' }
                      : { border: '1px solid var(--border-muted)', color: 'var(--text-secondary)', background: 'transparent' }}>
                    {m === 'endpoint' ? '🌐 API Endpoint' : '📁 Repository'}
                  </button>
                ))}
              </div>

              {/* Duplicate Detection & Replace Toggle */}
              {(() => {
                const currentVal = mode === 'endpoint' ? form.url.trim() : form.repo_url.trim()
                const match = currentVal ? existingContracts.find(c => c.source_ref.toLowerCase() === currentVal.toLowerCase()) : null
                if (!match) return null

                return (
                  <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span className="text-xs font-semibold text-amber-500/90 uppercase tracking-tight">Existing Contract Found</span>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Replace Documentation</span>
                        <input type="checkbox" className="w-3.5 h-3.5 accent-amber-500 rounded"
                          checked={form.replace_existing} onChange={e => set('replace_existing', e.target.checked)} />
                      </label>
                    </div>
                    {form.replace_existing && (
                      <p className="text-[11px] leading-relaxed text-amber-500/80">
                        Warning: This will permanently delete all previous versions and endpoints for this documentation.
                      </p>
                    )}
                  </div>
                )
              })()}

              {mode === 'endpoint' ? (
                <>
                  <div>
                    <Label>Endpoint URL <span className="text-red-400">*</span></Label>
                    <input className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                      style={inputStyle('url')} placeholder="https://api.example.com/users"
                      value={form.url} onChange={e => set('url', e.target.value)} />
                    {fieldErrors.url && <p className="text-red-400 text-xs mt-1">{fieldErrors.url}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Method</Label>
                      <select className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={inputBase}
                        value={form.method} onChange={e => set('method', e.target.value)}>
                        {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => <option key={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label>Authentication</Label>
                      <select className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={inputBase}
                        value={form.authType} onChange={e => set('authType', e.target.value)}>
                        <option value="none">None</option>
                        <option value="bearer">Bearer Token</option>
                        <option value="api_key">API Key</option>
                      </select>
                    </div>
                  </div>
                  {form.authType !== 'none' && (
                    <div>
                      <Label>Token / Key</Label>
                      <input type="password" className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                        style={inputStyle('token')} placeholder="Enter token..."
                        value={form.token} onChange={e => set('token', e.target.value)} />
                      {fieldErrors.token && <p className="text-red-400 text-xs mt-1">{fieldErrors.token}</p>}
                    </div>
                  )}
                  <div>
                    <Label>Description <span className="font-normal" style={{ color: 'var(--text-muted)' }}>(optional AI hint)</span></Label>
                    <input className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={inputBase}
                      placeholder="e.g. User management endpoints"
                      value={form.description} onChange={e => set('description', e.target.value)} />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label>Repository URL or Local Path <span className="text-red-400">*</span></Label>
                    <input className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                      style={inputStyle('repo_url')} placeholder="https://github.com/org/repo or /path/to/repo"
                      value={form.repo_url} onChange={e => set('repo_url', e.target.value)} />
                    {fieldErrors.repo_url && <p className="text-red-400 text-xs mt-1">{fieldErrors.repo_url}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Branch</Label>
                      <input className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={inputBase}
                        value={form.branch} onChange={e => set('branch', e.target.value)} />
                    </div>
                    <div>
                      <Label>Service Path <span className="font-normal" style={{ color: 'var(--text-muted)' }}>(monorepos)</span></Label>
                      <input className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={inputBase}
                        placeholder="e.g. services/api"
                        value={form.service_path} onChange={e => set('service_path', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label>Access Token <span className="font-normal" style={{ color: 'var(--text-muted)' }}>(private repos)</span></Label>
                    <input type="password" className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={inputBase}
                      placeholder="ghp_..." value={form.access_token} onChange={e => set('access_token', e.target.value)} />
                  </div>
                </>
              )}
              {step === 'error' && (
                <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{errorMsg}</p>
              )}
            </>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button onClick={onClose} disabled={step === 'loading'}
            className="px-4 py-2 text-sm disabled:opacity-40 hover:opacity-70" style={{ color: 'var(--text-secondary)' }}>
            Cancel
          </button>
          <button onClick={handleGenerate} disabled={step === 'loading' || step === 'done'}
            className="flex items-center gap-2 px-5 py-2 text-white text-sm font-medium rounded-lg disabled:opacity-60 hover:opacity-90"
            style={accentBtn}>
            {step === 'loading' && <Spinner size={14} />}
            {step === 'idle' || step === 'error' ? 'Generate Contract' : step === 'loading' ? 'Generating...' : '✓ Done'}
          </button>
        </div>
      </div>
    </div>
  )
}
