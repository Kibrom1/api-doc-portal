import { useState } from 'react'
import { CodeBlock } from './ui/CodeBlock'
import type { Endpoint } from '../utils/schema'

export function generateCode(method: string, path: string, serverUrl: string) {
  const url = `${serverUrl}${path}`
  const hasBody = !['GET', 'DELETE', 'HEAD'].includes(method)
  const javaMethod = hasBody
    ? `.${method}(HttpRequest.BodyPublishers.ofString("{}"))\n    .header("Content-Type", "application/json")`
    : `.method("${method}", HttpRequest.BodyPublishers.noBody())`
  return {
    cURL: hasBody
      ? `curl -X ${method} "${url}" \\\n  -H "Content-Type: application/json" \\\n  -d '{}'`
      : `curl -X ${method} "${url}" \\\n  -H "Accept: application/json"`,
    Python: `import requests\n\nresponse = requests.${method.toLowerCase()}(\n    "${url}"${hasBody ? ',\n    json={}' : ''}\n)\nprint(response.json())`,
    JavaScript: `const response = await fetch(\n  "${url}",\n  { method: "${method}"${hasBody ? ',\n    headers: { "Content-Type": "application/json" },\n    body: JSON.stringify({})' : ''} }\n);\nconst data = await response.json();\nconsole.log(data);`,
    Java: `import java.net.http.*;\nimport java.net.URI;\n\nvar client = HttpClient.newHttpClient();\nvar request = HttpRequest.newBuilder()\n    .uri(URI.create("${url}"))\n    ${javaMethod}\n    .header("Accept", "application/json")\n    .build();\nvar response = client.send(request, HttpResponse.BodyHandlers.ofString());\nSystem.out.println(response.body());`,
  }
}

const CODE_LANGS = ['cURL', 'Python', 'JavaScript', 'Java'] as const
type CodeLang = typeof CODE_LANGS[number]
const LANG_SYNTAX: Record<CodeLang, string> = { cURL: 'bash', Python: 'python', JavaScript: 'javascript', Java: 'java' }

export function CodePanel({ activeEp, serverUrl }: { activeEp: Endpoint | undefined; serverUrl: string }) {
  const [lang, setLang] = useState<CodeLang>('cURL')
  const ep = activeEp ?? { method: 'GET', path: '/', id: '', tag: '' }
  const code = generateCode(ep.method, ep.path, serverUrl)

  return (
    <div className="w-80 shrink-0 flex flex-col overflow-hidden" style={{ background: 'var(--bg-base)', borderLeft: '1px solid var(--border)' }}>
      <div className="px-4 py-3 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Request Example</p>
        <div className="flex gap-1 flex-wrap">
          {CODE_LANGS.map(l => (
            <button key={l} onClick={() => setLang(l)}
              className="px-2.5 py-1 rounded text-xs font-medium transition-colors"
              style={lang === l ? { background: 'var(--accent)', color: '#fff' } : { color: 'var(--text-secondary)', background: 'transparent' }}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <CodeBlock code={code[lang]} language={LANG_SYNTAX[lang]} maxHeight="100%" />
      </div>
      {activeEp && (
        <div className="px-4 py-3 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-xs font-mono truncate" style={{ color: 'var(--text-muted)' }}>{ep.method} {ep.path}</p>
        </div>
      )}
    </div>
  )
}
