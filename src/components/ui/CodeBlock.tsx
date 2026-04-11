import { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

interface CodeBlockProps {
  code: string
  language?: string
  maxHeight?: string
}

export function CodeBlock({ code, language = 'yaml', maxHeight = '500px' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const { isLight } = useTheme()
  const hlStyle = isLight ? oneLight : oneDark
  const bgColor = isLight ? '#f6f8fa' : '#0d1117'

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 z-10 p-1.5 rounded transition-all opacity-0 group-hover:opacity-100"
        style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
        title="Copy to clipboard"
      >
        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
      </button>
      <div style={{ maxHeight, overflowY: 'auto' }}>
        <SyntaxHighlighter
          language={language}
          style={hlStyle}
          customStyle={{ margin: 0, borderRadius: 0, background: bgColor, fontSize: '0.8rem' }}
          showLineNumbers
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}
