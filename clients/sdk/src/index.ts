// Main SDK exports
export { VultisigSDK } from './VultisigSDK'

// Core classes
export { Vault, VaultCreation, FastVaultAPI } from './vault'
export { AddressDeriver, Chain } from './chains'
export { TransactionSigner, MessageSigner } from './signing'

// Types
export type {
  FastVaultConfig,
  AddressMap,
  TxInput,
  MessageInput,
  SignedTx,
  Signature,
  VaultData
} from './types/Config'

// Version
export const VERSION = '1.0.0'