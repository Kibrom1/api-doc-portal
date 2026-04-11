export type OASchema = Record<string, unknown>

export interface OAParameter {
  name: string
  in: 'path' | 'query' | 'header' | 'cookie'
  required?: boolean
  description?: string
  schema?: OASchema
  deprecated?: boolean
}

export interface OAOperation {
  summary?: string
  description?: string
  tags?: string[]
  deprecated?: boolean
  parameters?: OAParameter[]
  requestBody?: {
    description?: string
    required?: boolean
    content?: Record<string, { schema?: OASchema }>
  }
  responses?: Record<string, {
    description?: string
    content?: Record<string, { schema?: OASchema }>
  }>
}

export interface Endpoint {
  method: string
  path: string
  id: string
  tag: string
}

export function resolveRef(ref: string, root: Record<string, unknown>): OASchema | null {
  const parts = ref.replace(/^#\//, '').split('/')
  let cur: unknown = root
  for (const p of parts) {
    if (typeof cur !== 'object' || cur === null) return null
    cur = (cur as Record<string, unknown>)[p]
  }
  return typeof cur === 'object' && cur !== null ? (cur as OASchema) : null
}

export function resolveSchema(schema: OASchema, root: Record<string, unknown>): OASchema {
  if (schema.$ref) return resolveRef(String(schema.$ref), root) ?? schema
  if (Array.isArray(schema.allOf)) {
    const merged: Record<string, OASchema> = {}
    const required: string[] = []
    for (const sub of schema.allOf as OASchema[]) {
      const s = resolveSchema(sub, root)
      if (s.properties) Object.assign(merged, s.properties as Record<string, OASchema>)
      if (Array.isArray(s.required)) required.push(...(s.required as string[]))
    }
    return { ...schema, properties: merged, required }
  }
  return schema
}

export function typeLabel(schema: OASchema | undefined, root: Record<string, unknown>): string {
  if (!schema) return 'any'
  if (schema.$ref) {
    const resolved = resolveRef(String(schema.$ref), root)
    if (resolved) return typeLabel(resolved, root)
    return String(schema.$ref).split('/').pop() ?? 'object'
  }
  const type = schema.type as string | undefined
  const format = schema.format as string | undefined
  const items = schema.items as OASchema | undefined
  if (type === 'array' && items) return `array[${typeLabel(items, root)}]`
  if (format) return `${type ?? 'any'}(${format})`
  return type ?? 'any'
}

export function extractEndpoints(openApiJson: Record<string, unknown>): Endpoint[] {
  const paths = (openApiJson?.paths ?? {}) as Record<string, Record<string, unknown>>
  const methods = ['get', 'post', 'put', 'patch', 'delete', 'head']
  const endpoints: Endpoint[] = []
  for (const [path, pathItem] of Object.entries(paths)) {
    for (const method of methods) {
      const op = pathItem[method] as OAOperation | undefined
      if (op) {
        endpoints.push({
          method: method.toUpperCase(),
          path,
          id: `endpoint-${method}-${path}`.replace(/[^a-zA-Z0-9]/g, '-'),
          tag: op.tags?.[0] ?? 'General',
        })
      }
    }
  }
  return endpoints
}

export function groupByTag(endpoints: Endpoint[]) {
  const map = new Map<string, Endpoint[]>()
  for (const ep of endpoints) {
    if (!map.has(ep.tag)) map.set(ep.tag, [])
    map.get(ep.tag)!.push(ep)
  }
  return Array.from(map.entries()).map(([tag, items]) => ({ tag, items }))
}
