// Main SDK export
export { VultisigSDK } from './VultisigSDK'

// Core classes
export { VaultManager } from './vault/VaultManager'
export { FastVaultAPI } from './vault/FastVaultAPI'
export { TransactionSigner } from './signing/TransactionSigner'
export { MessageSigner } from './signing/MessageSigner'
export { AddressDeriver } from './chains/AddressDeriver'

// Types
export type { SDKConfig } from './types/Config'
export type { 
  Vault, 
  VaultState, 
  CoinBalance, 
  FastVaultParams 
} from './types/Vault'
export type { 
  TransactionData, 
  SignedTransaction, 
  MessageSigningData 
} from './types/Transaction'

// Re-export core types that SDK users might need
export type { ChainKind } from '@core/chain/ChainKind'
export type { Chain } from '@core/chain/Chain'
export type { Coin } from '@core/chain/coin/Coin'

// Default export for convenience  
import { VultisigSDK } from './VultisigSDK'
export default VultisigSDK