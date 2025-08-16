import { WalletCore } from '@trustwallet/wallet-core'
import { Chain } from '@core/chain/Chain'
import { deriveAddress } from '@core/chain/publicKey/address/deriveAddress'
import { getPublicKey } from '@core/chain/publicKey/getPublicKey'

import type { VaultData, AddressMap } from '../types/Config'

export class AddressDeriver {
  private walletCore: WalletCore

  constructor(walletCore: WalletCore) {
    this.walletCore = walletCore
  }

  /**
   * Derive addresses for multiple chains
   */
  async deriveMultiple(vaultData: VaultData, chains: Chain[]): Promise<AddressMap> {
    const addresses: AddressMap = {}
    
    for (const chain of chains) {
      try {
        const address = await this.deriveSingle(vaultData, chain)
        addresses[this.getChainDisplayName(chain)] = address
      } catch (error) {
        console.warn(`Failed to derive address for ${this.getChainDisplayName(chain)}:`, error)
        addresses[this.getChainDisplayName(chain)] = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
    
    return addresses
  }

  /**
   * Derive address for a single chain
   */
  async deriveSingle(vaultData: VaultData, chain: Chain): Promise<string> {
    const publicKeys = {
      ecdsa: vaultData.publicKeyEcdsa,
      eddsa: vaultData.publicKeyEddsa
    }

    // Get the derived public key for this chain
    const publicKey = getPublicKey({
      chain,
      walletCore: this.walletCore,
      hexChainCode: vaultData.hexChainCode,
      publicKeys
    })

    // Derive the address from the public key
    return deriveAddress({
      chain,
      publicKey,
      walletCore: this.walletCore
    })
  }

  /**
   * Get common chains for address derivation
   */
  static getCommonChains(): Chain[] {
    return [
      Chain.Bitcoin,
      Chain.Ethereum,
      Chain.Solana,
      Chain.Avalanche,
      Chain.Polygon,
      Chain.BSC,
      Chain.Cosmos,
      Chain.THORChain
    ]
  }

  /**
   * Check if a chain is supported for address derivation
   */
  static isChainSupported(chain: Chain): boolean {
    // Most chains are supported, but we can add specific checks here
    return Object.values(Chain).includes(chain)
  }

  private getChainDisplayName(chain: Chain): string {
    // Convert Chain enum to display name
    switch (chain) {
      case Chain.Bitcoin: return 'Bitcoin'
      case Chain.Ethereum: return 'Ethereum'
      case Chain.Solana: return 'Solana'
      case Chain.Avalanche: return 'Avalanche'
      case Chain.Polygon: return 'Polygon'
      case Chain.BSC: return 'BSC'
      case Chain.Cosmos: return 'Cosmos'
      case Chain.THORChain: return 'THORChain'
      case Chain.MayaChain: return 'MayaChain'
      case Chain.Cardano: return 'Cardano'
      case Chain.Polkadot: return 'Polkadot'
      case Chain.Ripple: return 'Ripple'
      case Chain.Tron: return 'Tron'
      case Chain.Sui: return 'Sui'
      case Chain.Ton: return 'Ton'
      case Chain.Litecoin: return 'Litecoin'
      case Chain.Dogecoin: return 'Dogecoin'
      case Chain.BitcoinCash: return 'Bitcoin Cash'
      case Chain.Optimism: return 'Optimism'
      case Chain.Arbitrum: return 'Arbitrum'
      case Chain.Base: return 'Base'
      default: return String(chain)
    }
  }
}