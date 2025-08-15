import { VaultData } from '../vault/VaultLoader'
import { initWasm, WalletCore } from '@trustwallet/wallet-core'
import BIP32Factory from 'bip32'
import * as ecc from 'tiny-secp256k1'

export interface DerivedAddresses {
  [chainName: string]: string
}

export type SupportedChain = 
  | 'btc' | 'eth' | 'sol' | 'ltc' | 'doge' | 'avax' | 'matic' | 'bsc' 
  | 'optimism' | 'arbitrum' | 'base' | 'thor' | 'atom' | 'maya' | 'ada' 
  | 'dot' | 'xrp' | 'trx' | 'sui' | 'ton'

export const CHAIN_NAMES: Record<SupportedChain, string> = {
  btc: 'Bitcoin',
  eth: 'Ethereum',
  sol: 'Solana',
  ltc: 'Litecoin',
  doge: 'Dogecoin',
  avax: 'Avalanche',
  matic: 'Polygon',
  bsc: 'BSC',
  optimism: 'Optimism',
  arbitrum: 'Arbitrum',
  base: 'Base',
  thor: 'THORChain',
  atom: 'Cosmos',
  maya: 'MayaChain',
  ada: 'Cardano',
  dot: 'Polkadot',
  xrp: 'Ripple',
  trx: 'Tron',
  sui: 'Sui',
  ton: 'Ton'
}

// Chain configuration
const CHAIN_CONFIG: Record<SupportedChain, {
  algorithm: 'ecdsa' | 'eddsa',
  derivationPath: string,
  getCoinType?: (walletCore: WalletCore) => any
}> = {
  btc: { algorithm: 'ecdsa', derivationPath: "m/84'/0'/0'/0/0", getCoinType: (wc) => wc.CoinType.bitcoin },
  eth: { algorithm: 'ecdsa', derivationPath: "m/44'/60'/0'/0/0", getCoinType: (wc) => wc.CoinType.ethereum },
  sol: { algorithm: 'eddsa', derivationPath: "m/44'/501'/0'/0'", getCoinType: (wc) => wc.CoinType.solana },
  ltc: { algorithm: 'ecdsa', derivationPath: "m/84'/2'/0'/0/0", getCoinType: (wc) => wc.CoinType.litecoin },
  doge: { algorithm: 'ecdsa', derivationPath: "m/44'/3'/0'/0/0", getCoinType: (wc) => wc.CoinType.dogecoin },
  avax: { algorithm: 'ecdsa', derivationPath: "m/44'/60'/0'/0/0", getCoinType: (wc) => wc.CoinType.avalancheCChain },
  matic: { algorithm: 'ecdsa', derivationPath: "m/44'/60'/0'/0/0", getCoinType: (wc) => wc.CoinType.polygon },
  bsc: { algorithm: 'ecdsa', derivationPath: "m/44'/60'/0'/0/0", getCoinType: (wc) => wc.CoinType.smartChain },
  optimism: { algorithm: 'ecdsa', derivationPath: "m/44'/60'/0'/0/0", getCoinType: (wc) => wc.CoinType.optimism },
  arbitrum: { algorithm: 'ecdsa', derivationPath: "m/44'/60'/0'/0/0", getCoinType: (wc) => wc.CoinType.arbitrum },
  base: { algorithm: 'ecdsa', derivationPath: "m/44'/60'/0'/0/0", getCoinType: (wc) => wc.CoinType.base },
  thor: { algorithm: 'ecdsa', derivationPath: "m/44'/931'/0'/0/0", getCoinType: (wc) => wc.CoinType.thorchain },
  atom: { algorithm: 'ecdsa', derivationPath: "m/44'/118'/0'/0/0", getCoinType: (wc) => wc.CoinType.cosmos },
  maya: { algorithm: 'ecdsa', derivationPath: "m/44'/931'/0'/0/0", getCoinType: (wc) => wc.CoinType.thorchain }, // Uses thor cointype
  ada: { algorithm: 'eddsa', derivationPath: "m/44'/1815'/0'/0/0", getCoinType: (wc) => wc.CoinType.cardano },
  dot: { algorithm: 'eddsa', derivationPath: "m/44'/354'/0'/0/0", getCoinType: (wc) => wc.CoinType.polkadot },
  xrp: { algorithm: 'ecdsa', derivationPath: "m/44'/144'/0'/0/0", getCoinType: (wc) => wc.CoinType.xrp },
  trx: { algorithm: 'ecdsa', derivationPath: "m/44'/195'/0'/0/0", getCoinType: (wc) => wc.CoinType.tron },
  sui: { algorithm: 'eddsa', derivationPath: "m/44'/784'/0'/0/0", getCoinType: (wc) => wc.CoinType.sui },
  ton: { algorithm: 'eddsa', derivationPath: "m/44'/607'/0'/0/0", getCoinType: (wc) => wc.CoinType.ton }
}

export const ECDSA_CHAINS: SupportedChain[] = Object.keys(CHAIN_CONFIG)
  .filter(key => CHAIN_CONFIG[key as SupportedChain].algorithm === 'ecdsa') as SupportedChain[]

export const EDDSA_CHAINS: SupportedChain[] = Object.keys(CHAIN_CONFIG)
  .filter(key => CHAIN_CONFIG[key as SupportedChain].algorithm === 'eddsa') as SupportedChain[]

export class SimpleAddressDeriver {
  private walletCore: WalletCore | null = null
  
  async initialize(): Promise<void> {
    if (!this.walletCore) {
      this.walletCore = await initWasm()
    }
  }
  
  async deriveAddresses(vault: VaultData, requestedChains: SupportedChain[] = ['btc', 'eth', 'sol']): Promise<DerivedAddresses> {
    await this.initialize()
    
    if (!this.walletCore) {
      throw new Error('Failed to initialize Trust Wallet Core')
    }
    
    const addresses: DerivedAddresses = {}
    
    for (const chainKey of requestedChains) {
      try {
        const address = await this.deriveAddressForChain(vault, chainKey)
        addresses[CHAIN_NAMES[chainKey]] = address
      } catch (error) {
        console.warn(`Failed to derive address for ${chainKey}:`, error)
        addresses[CHAIN_NAMES[chainKey]] = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
    
    return addresses
  }
  
  private async deriveAddressForChain(vault: VaultData, chainKey: SupportedChain): Promise<string> {
    if (!this.walletCore) {
      throw new Error('Trust Wallet Core not initialized')
    }
    
    const config = CHAIN_CONFIG[chainKey]
    if (!config) {
      throw new Error(`Unsupported chain: ${chainKey}`)
    }
    
    let derivedPublicKey: string
    
    if (config.algorithm === 'ecdsa') {
      // Use BIP32 derivation for ECDSA chains
      if (!vault.publicKeyEcdsa || !vault.hexChainCode) {
        throw new Error(`Missing ECDSA public key or chain code for ${chainKey}`)
      }
      
      derivedPublicKey = this.deriveEcdsaPublicKey(
        vault.publicKeyEcdsa,
        vault.hexChainCode,
        config.derivationPath
      )
    } else {
      // Use EdDSA public key directly
      if (!vault.publicKeyEddsa) {
        throw new Error(`Missing EdDSA public key for ${chainKey}`)
      }
      derivedPublicKey = vault.publicKeyEddsa
    }
    
    // Create Trust Wallet Core public key
    let publicKeyType
    if (config.algorithm === 'ecdsa') {
      publicKeyType = this.walletCore.PublicKeyType.secp256k1
    } else {
      // For EdDSA, Cardano uses special ed25519Cardano type
      if (chainKey === 'ada') {
        publicKeyType = this.walletCore.PublicKeyType.ed25519Cardano
      } else {
        publicKeyType = this.walletCore.PublicKeyType.ed25519
      }
    }
    
    // Create public key data - Cardano needs special extended key format
    let publicKeyData: Uint8Array
    if (chainKey === 'ada') {
      // Cardano requires extended key data (spending key + chain code duplicated)
      if (!vault.hexChainCode) {
        throw new Error('Missing chain code for Cardano')
      }
      const spendingKeyData = Buffer.from(derivedPublicKey, 'hex')
      const chainCodeData = Buffer.from(vault.hexChainCode, 'hex')
      
      const extendedKeyBuffer = Buffer.concat([
        spendingKeyData,
        spendingKeyData, 
        chainCodeData,
        chainCodeData,
      ])
      
      publicKeyData = new Uint8Array(extendedKeyBuffer)
    } else {
      publicKeyData = new Uint8Array(Buffer.from(derivedPublicKey, 'hex'))
    }
    
    const publicKey = this.walletCore.PublicKey.createWithData(
      publicKeyData,
      publicKeyType
    )
    
    // Get correct coin type from Trust Wallet Core
    const coinType = config.getCoinType ? config.getCoinType(this.walletCore) : this.walletCore.CoinType.bitcoin
    
    // Special cases
    if (chainKey === 'ada') {
      // Cardano uses special address derivation (based on core implementation)
      const extendedKeyData = publicKey.data()
      const spendingKeyData = extendedKeyData.slice(0, 32)
      
      const hash = this.walletCore.Hash.blake2b(spendingKeyData, 28)
      
      const addressData = new Uint8Array(29)
      addressData[0] = 0x61
      addressData.set(hash, 1)
      
      return this.walletCore.Bech32.encode('addr', addressData)
    }
    
    if (chainKey === 'maya') {
      // MayaChain uses thor cointype with maya prefix  
      return this.walletCore.AnyAddress.createBech32WithPublicKey(
        publicKey,
        coinType, // Already set to thorchain cointype above
        'maya'
      ).description()
    }
    
    if (chainKey === 'trx') {
      // TRON requires uncompressed public key
      const uncompressedPubKey = publicKey.uncompressed()
      return this.walletCore.CoinTypeExt.deriveAddressFromPublicKey(
        coinType,
        uncompressedPubKey
      )
    }
    
    // Standard address derivation
    const address = this.walletCore.CoinTypeExt.deriveAddressFromPublicKey(
      coinType,
      publicKey
    )
    
    return address
  }
  
  private deriveEcdsaPublicKey(hexRootPubKey: string, hexChainCode: string, path: string): string {
    const bip32 = BIP32Factory(ecc)
    
    // Parse the master public key and chain code
    const pubKeyBuf = Buffer.from(hexRootPubKey, 'hex')
    const chainCodeBuf = Buffer.from(hexChainCode, 'hex')
    
    // Create BIP32 node from public key
    const rootNode = bip32.fromPublicKey(pubKeyBuf, chainCodeBuf)
    
    // Parse derivation path (remove hardened markers since we only have public keys)
    const pathIndices = this.parseBIP32Path(path)
    
    // Derive child public key
    let currentNode = rootNode
    for (const index of pathIndices) {
      if (index >= 0x80000000) {
        throw new Error(`Cannot derive hardened child (${index}) from public key`)
      }
      currentNode = currentNode.derive(index)
    }
    
    if (!currentNode.publicKey) {
      throw new Error('Failed to derive public key')
    }
    
    return currentNode.publicKey.toString('hex')
  }
  
  private parseBIP32Path(path: string): number[] {
    return path
      .split('/')
      .filter(segment => segment && segment !== 'm')
      .map(segment => {
        const index = parseInt(segment.replace("'", ''), 10)
        return isNaN(index) ? 0 : index
      })
  }
  
  // Helper methods
  getSignatureAlgorithm(chainKey: SupportedChain): 'ecdsa' | 'eddsa' {
    return CHAIN_CONFIG[chainKey]?.algorithm || 'ecdsa'
  }
  
  validateVaultForChain(vault: VaultData, chainKey: SupportedChain): boolean {
    const config = CHAIN_CONFIG[chainKey]
    if (!config) return false
    
    if (config.algorithm === 'ecdsa') {
      return !!vault.publicKeyEcdsa && !!vault.hexChainCode
    } else {
      return !!vault.publicKeyEddsa
    }
  }
}

export function parseNetworksString(networks: string): SupportedChain[] {
  if (networks === 'all') {
    return Object.keys(CHAIN_NAMES) as SupportedChain[]
  }
  
  return networks
    .split(',')
    .map(n => n.trim().toLowerCase() as SupportedChain)
    .filter(n => n in CHAIN_NAMES)
}