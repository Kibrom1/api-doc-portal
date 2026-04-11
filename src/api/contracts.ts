import { apiClient } from './client'
import type {
  Contract,
  ContractDetail,
  GenerateEndpointPayload,
  GenerateRepoPayload,
} from '../types'

export async function listContracts(): Promise<Contract[]> {
  const { data } = await apiClient.get<Contract[]>('/api/v1/contracts')
  return data
}

export async function getContract(slug: string, timestamp: string): Promise<ContractDetail> {
  const { data } = await apiClient.get<ContractDetail>(`/api/v1/contracts/${slug}/${timestamp}`)
  return data
}

export async function generateFromEndpoint(payload: GenerateEndpointPayload): Promise<ContractDetail> {
  const { data } = await apiClient.post<ContractDetail>('/api/v1/generate/from-endpoint', payload)
  return data
}

export async function generateFromRepo(payload: GenerateRepoPayload): Promise<ContractDetail> {
  const { data } = await apiClient.post<ContractDetail>('/api/v1/generate/from-repo', payload)
  return data
}
