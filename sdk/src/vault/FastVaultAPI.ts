import { setupVaultWithServer } from '@core/mpc/fast/api/setupVaultWithServer'
import { getVaultFromServer } from '@core/mpc/fast/api/getVaultFromServer'
import { verifyVaultEmailCode } from '@core/mpc/fast/api/verifyVaultEmailCode'
import { signWithServer } from '@core/mpc/fast/api/signWithServer'
import { reshareWithServer } from '@core/mpc/fast/api/reshareWithServer'

export interface CreateVaultParams {
  name: string
  session_id: string
  hex_encryption_key: string
  hex_chain_code: string
  local_party_id: string
  encryption_password: string
  email: string
  lib_type: number
}

export interface SignParams {
  public_key: string
  messages: string[]
  session: string
  hex_encryption_key: string
  derive_path: string
  is_ecdsa: boolean
  vault_password: string
}


export interface ReshareParams {
  name: string
  session_id: string
  public_key?: string
  hex_encryption_key: string
  hex_chain_code: string
  local_party_id: string
  old_parties: string[]
  old_reshare_prefix: string
  encryption_password: string
  email?: string
  reshare_type?: number
  lib_type?: number
}

export class FastVaultAPI {
  constructor(private serverUrl: string) {}

  getServerUrl(): string {
    return this.serverUrl
  }

  async createVault(params: CreateVaultParams): Promise<void> {
    return setupVaultWithServer(params)
  }

  async getVault(vaultId: string, password: string): Promise<any> {
    return getVaultFromServer({ vaultId, password })
  }

  async verifyEmail(vaultId: string, code: string): Promise<void> {
    return verifyVaultEmailCode({ vaultId, code })
  }

  async signWithServer(params: SignParams): Promise<void> {
    return signWithServer(params)
  }


  async reshareVault(params: ReshareParams): Promise<void> {
    return reshareWithServer(params)
  }
}