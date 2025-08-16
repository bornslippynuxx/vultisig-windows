import { Chain } from '@core/chain/Chain'

export interface FastVaultConfig {
  name: string
  email: string
  password: string
}

export interface AddressMap {
  [chainName: string]: string
}

export interface TxInput {
  chain: Chain
  to: string
  amount: string
  gasLimit?: string
  gasPrice?: string
  memo?: string
}

export interface MessageInput {
  chain: Chain
  message: string | Uint8Array
}

export interface SignedTx {
  txHash: string
  rawTx: string
}

export interface Signature {
  signature: string
  publicKey: string
}

export interface VaultData {
  id: string
  name: string
  publicKeyEcdsa: string
  publicKeyEddsa: string
  hexChainCode: string
  encryptedKeyShare?: string
}