import { SDKConfig } from './types/Config'
import { Vault, FastVaultParams, CoinBalance } from './types/Vault'
import { TransactionData } from './types/Transaction'
import { VaultManager } from './vault/VaultManager'
import { TransactionSigner } from './signing/TransactionSigner'
import { MessageSigner } from './signing/MessageSigner'
import { AddressDeriver } from './chains/AddressDeriver'
import { initializeMpcLib } from '@core/mpc/lib/initialize'
import { WalletCore } from '@trustwallet/wallet-core'
import { initWasm } from '@trustwallet/wallet-core'

export class VultisigSDK {
  private config: SDKConfig
  private vaultManager: VaultManager
  private transactionSigner: TransactionSigner
  private messageSigner: MessageSigner
  private addressDeriver: AddressDeriver
  private walletCore: WalletCore | null = null
  private initialized = false

  constructor(config: SDKConfig = {}) {
    this.config = {
      serverUrl: 'https://api.vultisig.com',
      theme: 'light',
      supportedChains: [],
      ...config
    }
    
    this.vaultManager = new VaultManager()
    this.transactionSigner = new TransactionSigner(this.config.serverUrl!)
    this.messageSigner = new MessageSigner(this.config.serverUrl!)
    this.addressDeriver = new AddressDeriver()
  }

  async initialize(walletCore?: WalletCore): Promise<void> {
    if (this.initialized) return

    try {
      // Use provided WalletCore or create new one
      if (!walletCore) {
        this.walletCore = await initWasm()
      } else {
        this.walletCore = walletCore
      }
      
      // Initialize MPC libraries
      await initializeMpcLib('ecdsa')
      await initializeMpcLib('eddsa')
      
      // Initialize components with WalletCore
      if (this.walletCore) {
        await this.addressDeriver.initialize(this.walletCore)
        await this.transactionSigner.initialize(this.walletCore)
        await this.messageSigner.initialize(this.walletCore)
      }
      
      this.initialized = true
    } catch (error) {
      throw new Error('Failed to initialize SDK: ' + (error as Error).message)
    }
  }

  // Vault Operations
  async createFastVault(params: FastVaultParams): Promise<{
    vault: Vault
    verificationRequired: boolean
    vaultId: string
  }> {
    await this.initialize()
    return this.vaultManager.createFastVault(params)
  }

  async getVault(vaultId: string, password: string): Promise<Vault> {
    await this.initialize()
    return this.vaultManager.retrieveVault(vaultId, password)
  }

  async verifyVaultEmail(vaultId: string, code: string): Promise<void> {
    await this.initialize()
    return this.vaultManager.verifyEmail(vaultId, code)
  }

  // Balance & Address Management
  async getBalances(vault: Vault, chains?: string[]): Promise<Record<string, CoinBalance>> {
    await this.initialize()
    return this.vaultManager.getVaultBalances(vault, chains)
  }

  async deriveAddress(vault: Vault, chain: string): Promise<string> {
    await this.initialize()
    return this.addressDeriver.deriveAddress(vault, chain)
  }

  // Signing Operations
  async signTransaction(
    vault: Vault, 
    txData: TransactionData, 
    sessionId: string = crypto.randomUUID(),
    hexEncryptionKey: string = vault.hexChainCode,
    peers: string[] = []
  ): Promise<string> {
    await this.initialize()
    const result = await this.transactionSigner.signTransaction(vault, txData, sessionId, hexEncryptionKey, peers)
    return result.hash
  }

  async signMessage(
    vault: Vault, 
    message: string, 
    chain: string = 'ethereum',
    sessionId: string = crypto.randomUUID(),
    hexEncryptionKey: string = vault.hexChainCode,
    peers: string[] = []
  ): Promise<string> {
    await this.initialize()
    return this.messageSigner.signMessage(vault, message, chain, sessionId, hexEncryptionKey, peers)
  }

  // Configuration
  getConfig(): SDKConfig {
    return { ...this.config }
  }

  updateConfig(updates: Partial<SDKConfig>): void {
    this.config = { ...this.config, ...updates }
  }
}