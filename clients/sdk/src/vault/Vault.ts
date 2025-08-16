import { WalletCore } from '@trustwallet/wallet-core'
import { Chain } from '@core/chain/Chain'
import { PublicKeys } from '@core/chain/publicKey/PublicKeys'
import { deriveAddress } from '@core/chain/publicKey/address/deriveAddress'
import { getPublicKey } from '@core/chain/publicKey/getPublicKey'

import type { VaultData, TxInput, MessageInput, SignedTx, Signature } from '../types/Config'

export class Vault {
  readonly id: string
  readonly name: string
  readonly publicKeys: PublicKeys
  readonly hexChainCode: string
  private encryptedKeyShare?: string
  private walletCore: WalletCore

  constructor(vaultData: VaultData, walletCore?: WalletCore) {
    this.id = vaultData.id
    this.name = vaultData.name
    this.publicKeys = {
      ecdsa: vaultData.publicKeyEcdsa,
      eddsa: vaultData.publicKeyEddsa
    }
    this.hexChainCode = vaultData.hexChainCode
    this.encryptedKeyShare = vaultData.encryptedKeyShare
    
    // WalletCore can be provided later via setWalletCore method
    this.walletCore = walletCore as any
  }

  /**
   * Get address for a specific chain
   */
  async getAddress(chain: Chain): Promise<string> {
    if (!this.walletCore) {
      throw new Error('WalletCore instance required for address derivation. Use setWalletCore() first.')
    }

    const publicKey = getPublicKey({
      chain,
      walletCore: this.walletCore,
      hexChainCode: this.hexChainCode,
      publicKeys: this.publicKeys
    })

    return deriveAddress({
      chain,
      publicKey,
      walletCore: this.walletCore
    })
  }

  /**
   * Set WalletCore instance for address derivation
   */
  setWalletCore(walletCore: WalletCore): void {
    this.walletCore = walletCore
  }

  /**
   * Sign a transaction (placeholder - requires MPC implementation)
   */
  async sign(input: TxInput | MessageInput): Promise<SignedTx | Signature> {
    // TODO: Implement MPC signing using DKLS/Schnorr WASM
    // This would require:
    // 1. Creating keysign payload
    // 2. Running MPC signing ceremony with server
    // 3. Combining signatures
    throw new Error('Signing not yet implemented - requires MPC ceremony')
  }

  /**
   * Export vault data (encrypted if password provided)
   */
  export(password?: string): string {
    const vaultData = {
      id: this.id,
      name: this.name,
      publicKeyEcdsa: this.publicKeys.ecdsa,
      publicKeyEddsa: this.publicKeys.eddsa,
      hexChainCode: this.hexChainCode,
      encryptedKeyShare: this.encryptedKeyShare
    }

    if (password) {
      // TODO: Encrypt vault data with password using AES-GCM
      // Use encryption utilities from @lib/utils/encryption/aesGcm
    }

    return JSON.stringify(vaultData)
  }

  /**
   * Get internal vault data (for SDK internal use)
   */
  getVaultData(): VaultData {
    return {
      id: this.id,
      name: this.name,
      publicKeyEcdsa: this.publicKeys.ecdsa,
      publicKeyEddsa: this.publicKeys.eddsa,
      hexChainCode: this.hexChainCode,
      encryptedKeyShare: this.encryptedKeyShare
    }
  }

  /**
   * Get vault summary info
   */
  getInfo() {
    return {
      id: this.id,
      name: this.name,
      hasEcdsaKey: !!this.publicKeys.ecdsa,
      hasEddsaKey: !!this.publicKeys.eddsa,
      isEncrypted: !!this.encryptedKeyShare
    }
  }
}