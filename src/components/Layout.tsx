import { useState, useRef, useEffect } from 'react'
import { BookOpen, Palette, Check } from 'lucide-react'
import { useTheme, THEMES, type ThemeId } from '../context/ThemeContext'

function ThemeSelector() {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = THEMES.find(t => t.id === theme)!

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-muted)',
          color: 'var(--text-secondary)',
        }}
        title="Change theme"
      >
        <Palette size={14} />
        <span className="hidden sm:inline">{current.label}</span>
        <span
          className="w-3 h-3 rounded-full shrink-0"
          style={{ background: current.dot }}
        />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-44 rounded-xl shadow-2xl z-50 py-1.5 overflow-hidden"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-muted)',
          }}
        >
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => { setTheme(t.id as ThemeId); setOpen(false) }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-[var(--bg-elevated)]"
              style={{ color: theme === t.id ? 'var(--accent-text)' : 'var(--text-secondary)' }}
            >
              <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ background: t.dot }} />
              {t.label}
              {theme === t.id && <Check size={12} className="ml-auto" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <header
        className="flex items-center justify-between px-6 py-3 sticky top-0 z-40 backdrop-blur"
        style={{
          background: 'color-mix(in srgb, var(--bg-base) 85%, transparent)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="flex items-center gap-2.5 font-semibold" style={{ color: 'var(--text-primary)' }}>
          <BookOpen size={20} style={{ color: 'var(--accent)' }} />
          <span>API Doc Portal</span>
        </div>
        <ThemeSelector />
      </header>
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
