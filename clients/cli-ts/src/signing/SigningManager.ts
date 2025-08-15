import { Chain } from '@core/chain/Chain'
import { getChainKind } from '@core/chain/ChainKind'
import { getCoinType } from '@core/chain/coin/coinType'
import { getPublicKey } from '@core/chain/publicKey/getPublicKey'
import { signatureAlgorithms } from '@core/chain/signing/SignatureAlgorithm'
import { keysign } from '@core/mpc/keysign'
import { KeysignSignature } from '@core/mpc/keysign/KeysignSignature'
import { getTxInputData } from '@core/mpc/keysign/txInputData'
import { create } from '@bufbuild/protobuf'
import { KeysignPayloadSchema, KeysignPayload } from '@core/mpc/types/vultisig/keysign/v1/keysign_message_pb'
import { toCommCoin } from '@core/mpc/types/utils/commCoin'
import { initWasm, WalletCore } from '@trustwallet/wallet-core'
import * as crypto from 'crypto'
import { VaultData } from '../vault/VaultLoader'
import { KeysignWebServer } from '../web/KeysignWebServer'
import open from 'open'

export interface SigningRequest {
  // Network and signature parameters
  scheme: 'ecdsa' | 'eddsa'
  curve: 'secp256k1' | 'ed25519'
  network: string
  messageType: string
  
  // Transaction payload (network-specific)
  payload: any
  
  // MPC session parameters
  sessionId?: string
  serverUrl?: string
  hexEncryptionKey?: string
  peers?: string[]
}

export interface SigningResult {
  signature: string
  txId?: string
  raw?: string
  signedPsbtBase64?: string
  finalTxHex?: string
}

export class SigningManager {
  private walletCore: WalletCore | null = null
  private vault: VaultData
  private webServer?: KeysignWebServer
  
  constructor(vault: VaultData) {
    this.vault = vault
  }
  
  async initialize(): Promise<void> {
    if (!this.walletCore) {
      this.walletCore = await initWasm()
    }
  }
  
  async signTransaction(request: SigningRequest): Promise<SigningResult> {
    await this.initialize()
    
    if (!this.walletCore) {
      throw new Error('Failed to initialize Trust Wallet Core')
    }
    
    // Map network to Chain
    const chain = this.mapNetworkToChain(request.network)
    if (!chain) {
      throw new Error(`Unsupported network: ${request.network}`)
    }
    
    // Validate signature scheme matches chain
    const chainKind = getChainKind(chain)
    const expectedAlgorithm = signatureAlgorithms[chainKind]
    if (request.scheme !== expectedAlgorithm) {
      throw new Error(`Invalid signature scheme ${request.scheme} for ${request.network}, expected ${expectedAlgorithm}`)
    }
    
    console.log(`🔐 Starting MPC signing for ${request.network} (${request.scheme})`)
    
    try {
      // Create keysign payload based on message type
      const keysignPayload = await this.createKeysignPayload(chain, request)
      
      // Get transaction input data
      const txInputData = getTxInputData({
        keysignPayload,
        walletCore: this.walletCore
      })
      
      console.log('📋 Transaction input data prepared')
      console.log(`   Input data length: ${txInputData.length} bytes`)
      
      // Convert to hex message for signing
      const message = Buffer.concat(txInputData).toString('hex')
      console.log(`   Message hash: ${message.slice(0, 16)}...`)
      
      // MPC signing parameters
      const sessionId = request.sessionId || this.generateSessionId()
      const hexEncryptionKey = request.hexEncryptionKey || this.generateEncryptionKey()
      const serverUrl = request.serverUrl || 'https://api.vultisig.com' // Default relay server
      const peers = request.peers || [] // For CLI, we'll need mobile app coordination
      
      console.log(`🔄 MPC Session: ${sessionId}`)
      console.log(`🌐 Server: ${serverUrl}`)
      console.log(`👥 Peers: ${peers.length > 0 ? peers.join(', ') : 'Waiting for mobile app...'}`)
      
      // Start web server for QR code display and coordination
      await this.startWebInterface(request, keysignPayload, sessionId, serverUrl)
      
      // TODO: For CLI implementation, we still need to:
      // 1. Wait for mobile app to join the session via relay/local
      // 2. Coordinate the actual 2-of-2 MPC signing
      // 3. Handle signature completion and broadcast
      
      console.log('\\n📱 Next steps:')
      console.log('1. Open the web interface that just launched')
      console.log('2. Scan the QR code with your Vultisig mobile app')
      console.log('3. Approve the transaction on your mobile device')
      console.log('4. Wait for MPC signature completion')
      
      // For now, keep the session open and wait for manual termination
      console.log('\\n⏳ Keeping session active... Press Ctrl+C to cancel')
      
      // In a real implementation, this would wait for actual MPC completion
      await this.waitForSigningCompletion(sessionId)
      
      // Placeholder return - real implementation would return actual signature
      throw new Error('MPC signing session started - signature coordination with mobile app in progress')
      
      /* 
      // Real MPC signing (commented out until mobile coordination is implemented)
      const signature = await keysign({
        keyShare: this.getKeyShareForChain(chain),
        signatureAlgorithm: expectedAlgorithm,
        message,
        chainPath: this.getChainPath(chain),
        localPartyId: this.vault.localPartyId,
        peers,
        serverUrl,
        sessionId,
        hexEncryptionKey,
        isInitiatingDevice: true
      })
      
      return this.formatSigningResult(request, signature)
      */
      
    } catch (error) {
      console.error('❌ Signing failed:', error instanceof Error ? error.message : error)
      throw error
    }
  }
  
  private mapNetworkToChain(network: string): Chain | null {
    const networkMap: Record<string, Chain> = {
      'eth': Chain.Ethereum,
      'btc': Chain.Bitcoin, 
      'sol': Chain.Solana,
      'ltc': Chain.Litecoin,
      'doge': Chain.Dogecoin,
      'avax': Chain.Avalanche,
      'matic': Chain.Polygon,
      'bsc': Chain.BSC,
      'optimism': Chain.Optimism,
      'arbitrum': Chain.Arbitrum,
      'base': Chain.Base,
      'thor': Chain.THORChain,
      'atom': Chain.Cosmos,
      'maya': Chain.MayaChain,
      'ada': Chain.Cardano,
      'dot': Chain.Polkadot,
      'xrp': Chain.Ripple,
      'trx': Chain.Tron,
      'sui': Chain.Sui,
      'ton': Chain.Ton
    }
    
    return networkMap[network.toLowerCase()] || null
  }
  
  private async createKeysignPayload(chain: Chain, request: SigningRequest): Promise<KeysignPayload> {
    if (!this.walletCore) {
      throw new Error('WalletCore not initialized')
    }
    
    // Get public key for this chain
    const publicKey = getPublicKey({
      chain,
      walletCore: this.walletCore,
      hexChainCode: this.vault.hexChainCode,
      publicKeys: {
        ecdsa: this.vault.publicKeyEcdsa,
        eddsa: this.vault.publicKeyEddsa
      }
    })
    
    // Create coin info - need to provide required AccountCoin fields
    const coin = toCommCoin({
      chain,
      address: '', // Will be derived later
      ticker: this.getTickerForChain(chain),
      decimals: this.getDecimalsForChain(chain),
      logo: '',
      priceProviderId: '',
      hexPublicKey: Buffer.from(publicKey.data()).toString('hex')
    })
    
    // Create keysign payload based on message type and network
    let blockchainSpecific: any
    
    switch (request.messageType) {
      case 'eth_tx':
        blockchainSpecific = {
          case: 'ethereumSpecific' as const,
          value: {
            gasLimit: BigInt(request.payload.gasLimit || 21000),
            gasPrice: request.payload.gasPrice ? BigInt(request.payload.gasPrice) : undefined,
            maxFeePerGas: request.payload.maxFeePerGas ? BigInt(request.payload.maxFeePerGas) : undefined,
            maxPriorityFeePerGas: request.payload.maxPriorityFeePerGas ? BigInt(request.payload.maxPriorityFeePerGas) : undefined,
            nonce: BigInt(request.payload.nonce || 0),
          }
        }
        break
        
      case 'eth_typed':
        // EIP-712 typed data signing
        blockchainSpecific = {
          case: 'ethereumSpecific' as const,
          value: {
            // Typed data specific fields
          }
        }
        break
        
      case 'btc_psbt':
        blockchainSpecific = {
          case: 'utxoSpecific' as const,
          value: {
            // UTXO specific fields
          }
        }
        break
        
      case 'sol_tx':
        blockchainSpecific = {
          case: 'solanaSpecific' as const,
          value: {
            // Solana specific fields
          }
        }
        break
        
      default:
        throw new Error(`Unsupported message type: ${request.messageType}`)
    }
    
    return create(KeysignPayloadSchema, {
      coin,
      toAddress: request.payload.to || '',
      toAmount: request.payload.value?.toString() || '0',
      blockchainSpecific,
      memo: request.payload.memo || '',
      utxoInfo: [], // Empty for non-UTXO chains
      vaultPublicKeyEcdsa: this.vault.publicKeyEcdsa,
      vaultLocalPartyId: this.vault.localPartyId || '',
      libType: 'GG20',
      skipBroadcast: false,
      swapPayload: { case: undefined },
      contractPayload: { case: undefined }
    })
  }
  
  private getKeyShareForChain(chain: Chain): string {
    // For now, return a placeholder - in reality this would extract the appropriate keyshare
    // from the vault's keyShares array based on the chain's signature algorithm
    const chainKind = getChainKind(chain)
    const algorithm = signatureAlgorithms[chainKind]
    
    if (this.vault.keyShares.length > 0) {
      return this.vault.keyShares[0].keyshare
    }
    
    throw new Error('No keyshares available in vault')
  }
  
  private getChainPath(chain: Chain): string {
    // Return the derivation path for the chain
    // This should match the paths used in address derivation
    const chainKind = getChainKind(chain)
    const algorithm = signatureAlgorithms[chainKind]
    
    // Standard derivation paths
    const paths: Record<string, string> = {
      [Chain.Bitcoin]: "m/84'/0'/0'/0/0",
      [Chain.Ethereum]: "m/44'/60'/0'/0/0", 
      [Chain.Solana]: "m/44'/501'/0'/0'",
      // Add more as needed
    }
    
    return paths[chain] || "m/44'/0'/0'/0/0"
  }
  
  private generateSessionId(): string {
    return `cli-${crypto.randomBytes(8).toString('hex')}`
  }
  
  private generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex')
  }
  
  private getTickerForChain(chain: Chain): string {
    const tickers: Record<string, string> = {
      [Chain.Bitcoin]: 'BTC',
      [Chain.Ethereum]: 'ETH',
      [Chain.Solana]: 'SOL',
      [Chain.Litecoin]: 'LTC',
      [Chain.Dogecoin]: 'DOGE',
      [Chain.Avalanche]: 'AVAX',
      [Chain.Polygon]: 'MATIC',
      [Chain.BSC]: 'BNB',
      [Chain.Optimism]: 'ETH',
      [Chain.Arbitrum]: 'ETH',
      [Chain.Base]: 'ETH',
      [Chain.THORChain]: 'RUNE',
      [Chain.Cosmos]: 'ATOM',
      [Chain.MayaChain]: 'CACAO',
      [Chain.Cardano]: 'ADA',
      [Chain.Polkadot]: 'DOT',
      [Chain.Ripple]: 'XRP',
      [Chain.Tron]: 'TRX',
      [Chain.Sui]: 'SUI',
      [Chain.Ton]: 'TON'
    }
    return tickers[chain] || 'UNKNOWN'
  }
  
  private getDecimalsForChain(chain: Chain): number {
    // Most chains use 18 decimals, Bitcoin uses 8
    const decimals: Record<string, number> = {
      [Chain.Bitcoin]: 8,
      [Chain.Litecoin]: 8,
      [Chain.Dogecoin]: 8,
      [Chain.Solana]: 9,
      [Chain.Cardano]: 6,
      [Chain.Ripple]: 6,
      [Chain.Ton]: 9
    }
    return decimals[chain] || 18
  }
  
  private async startWebInterface(request: SigningRequest, keysignPayload: KeysignPayload, sessionId: string, serverUrl: string): Promise<void> {
    try {
      this.webServer = new KeysignWebServer({
        sessionId,
        vaultData: this.vault,
        keysignPayload,
        useVultisigRelay: request.serverUrl !== undefined || serverUrl !== 'http://127.0.0.1:18080'
      })
      
      const webUrl = await this.webServer.start()
      console.log(`\\n🌐 Keysign web interface available at: ${webUrl}`)
      
      // Open the web interface in the default browser
      try {
        await open(webUrl)
        console.log('✅ Opened web interface in your default browser')
      } catch (error) {
        console.warn('⚠️  Could not auto-open browser. Please manually visit:', webUrl)
      }
      
    } catch (error) {
      console.error('❌ Failed to start web interface:', error)
      throw error
    }
  }
  
  private async waitForSigningCompletion(sessionId: string): Promise<void> {
    // This is where we would implement the actual MPC coordination
    // For now, we'll just wait indefinitely until the user cancels
    return new Promise((resolve, reject) => {
      const cleanup = () => {
        if (this.webServer) {
          this.webServer.stop().catch(console.error)
        }
      }
      
      process.on('SIGINT', () => {
        console.log('\\n\\n🛑 Signing session cancelled by user')
        cleanup()
        process.exit(0)
      })
      
      process.on('SIGTERM', () => {
        cleanup()
        process.exit(0)
      })
    })
  }
  
  private formatSigningResult(request: SigningRequest, signature: KeysignSignature): SigningResult {
    const result: SigningResult = {
      signature: signature.der_signature || `${signature.r}${signature.s}`,
    }
    
    // Add format-specific results
    switch (request.messageType) {
      case 'btc_psbt':
        result.signedPsbtBase64 = signature.msg // Base64 encoded signed PSBT
        break
        
      case 'eth_tx':
        result.raw = signature.der_signature // Raw transaction hex
        break
        
      default:
        break
    }
    
    return result
  }
}