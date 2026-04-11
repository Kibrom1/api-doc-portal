export interface Contract {
  slug: string
  timestamp: string
  source: 'endpoint' | 'repo'
  source_ref: string
  generated_at: string
  endpoint_count?: number
}

export interface ContractDetail {
  openapi_yaml: string
  openapi_json: Record<string, unknown>
  markdown_doc: string
  source: 'endpoint' | 'repo'
  source_ref: string
  generated_at: string
  saved_to: string
}

export interface GenerateEndpointPayload {
  url: string
  method: string
  headers?: Record<string, string>
  body?: Record<string, unknown>
  auth?: {
    type: string
    token?: string
    api_key?: string
    header_name?: string
    username?: string
    password?: string
  }
  description?: string
}

export interface GenerateRepoPayload {
  repo_url: string
  access_token?: string
  branch?: string
  service_path?: string
  framework?: string
}
