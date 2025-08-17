export type { Vault, VaultKeyShares } from '@core/ui/vault/Vault'
export { getVaultId } from '@core/ui/vault/Vault'

export interface VaultState {
  currentVault: any | null
  isAuthenticated: boolean
  balances: Record<string, CoinBalance>
  addresses: Record<string, string>
}

export interface CoinBalance {
  amount: string
  decimals: number
}

export interface FastVaultParams {
  name: string
  email: string
  password: string
  passwordHint?: string
}