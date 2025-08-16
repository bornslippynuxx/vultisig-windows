import { initWasm, WalletCore } from '@trustwallet/wallet-core'
import { Chain } from '@core/chain/Chain'

import { FastVaultAPI } from './vault/FastVaultAPI'
import { Vault } from './vault/Vault'
import { VaultCreation } from './vault/VaultCreation'
import { AddressDeriver } from './chains/AddressDeriver'
import { TransactionSigner } from './signing/TransactionSigner'
import { MessageSigner } from './signing/MessageSigner'
import type { 
  FastVaultConfig, 
  AddressMap, 
  TxInput, 
  MessageInput, 
  SignedTx, 
  Signature,
  VaultData 
} from './types/Config'

export class VultisigSDK {
  private walletCore: WalletCore
  private fastVaultAPI: FastVaultAPI
  private addressDeriver: AddressDeriver
  private transactionSigner: TransactionSigner
  private messageSigner: MessageSigner

  private constructor(walletCore: WalletCore) {
    this.walletCore = walletCore
    this.fastVaultAPI = new FastVaultAPI()
    this.addressDeriver = new AddressDeriver(walletCore)
    this.transactionSigner = new TransactionSigner(walletCore)
    this.messageSigner = new MessageSigner(walletCore)
  }

  /**
   * Initialize the Vultisig SDK with WASM modules
   */
  static async initialize(): Promise<VultisigSDK> {
    // Initialize Trust Wallet Core WASM
    const walletCore = await initWasm()
    
    // Initialize DKLS and Schnorr WASM modules
    try {
      // Import and initialize DKLS WASM
      const dklsModule = await import('@lib/dkls/vs_wasm')
      await dklsModule.default()
      
      // Import and initialize Schnorr WASM
      const schnorrModule = await import('@lib/schnorr/vs_schnorr_wasm')
      await schnorrModule.default()
      
      console.log('✅ DKLS and Schnorr WASM modules initialized successfully')
    } catch (error) {
      console.warn('⚠️ WASM module initialization failed, some features may not work:', error)
      // Continue without WASM for basic functionality like address derivation
    }
    
    return new VultisigSDK(walletCore)
  }

  /**
   * Check Vultiserver connectivity
   */
  async ping(): Promise<string> {
    return this.fastVaultAPI.ping()
  }

  /**
   * Create a new fast vault with Vultiserver
   */
  async createFastVault(config: FastVaultConfig): Promise<VaultCreation> {
    const vaultCreation = await this.fastVaultAPI.createVault(config);
    
    // Store SDK reference for later vault download
    (vaultCreation as any)._sdkInstance = this;
    
    return vaultCreation;
  }

  /**
   * Load an existing vault from encrypted data
   */
  async loadVault(vaultData: string, password?: string): Promise<Vault> {
    // Parse and decrypt vault data
    const parsedVault = JSON.parse(vaultData) as VaultData
    const vault = new Vault(parsedVault, this.walletCore)
    return vault
  }

  /**
   * Derive addresses for multiple chains
   */
  async deriveAddresses(vault: Vault, chains: Chain[]): Promise<AddressMap> {
    // Ensure vault has WalletCore for address derivation
    vault.setWalletCore(this.walletCore)
    return this.addressDeriver.deriveMultiple(vault.getVaultData(), chains)
  }

  /**
   * Derive address for a single chain
   */
  async deriveAddress(vault: Vault, chain: Chain): Promise<string> {
    // Ensure vault has WalletCore for address derivation
    vault.setWalletCore(this.walletCore)
    return this.addressDeriver.deriveSingle(vault.getVaultData(), chain)
  }

  /**
   * Sign a transaction
   */
  async signTransaction(vault: Vault, transaction: TxInput): Promise<SignedTx> {
    return this.transactionSigner.sign(vault.getVaultData(), transaction)
  }

  /**
   * Sign a message
   */
  async signMessage(vault: Vault, message: MessageInput): Promise<Signature> {
    return this.messageSigner.sign(vault.getVaultData(), message)
  }

  /**
   * Get SDK version info
   */
  static getVersion(): string {
    return '1.0.0'
  }

  /**
   * Get supported chains
   */
  static getSupportedChains(): Chain[] {
    return Object.values(Chain)
  }
}