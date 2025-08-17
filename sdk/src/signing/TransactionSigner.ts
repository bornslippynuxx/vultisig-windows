import { create } from '@bufbuild/protobuf'
import { fromChainAmount } from '@core/chain/amount/fromChainAmount'
import { Chain } from '@core/chain/Chain'
import { chainFeeCoin } from '@core/chain/coin/chainFeeCoin'
import { getPublicKey } from '@core/chain/publicKey/getPublicKey'
import { getChainSpecific } from '@core/mpc/keysign/chainSpecific'
import { keysign } from '@core/mpc/keysign'
import { CoinSchema } from '@core/mpc/types/vultisig/keysign/v1/coin_pb'
import {
  KeysignPayload,
  KeysignPayloadSchema,
} from '@core/mpc/types/vultisig/keysign/v1/keysign_message_pb'
import { TransactionType } from '@core/mpc/types/vultisig/keysign/v1/blockchain_specific_pb'
import { Vault } from '@core/ui/vault/Vault'
import { WalletCore } from '@trustwallet/wallet-core'
import { getCoinType } from '@core/chain/coin/coinType'
import { TransactionData, SignedTransaction } from '../types/Transaction'
import { getTxInputData } from '@core/mpc/keysign/txInputData'

export class TransactionSigner {
  private serverUrl: string
  private walletCore: WalletCore | null = null

  constructor(serverUrl: string) {
    this.serverUrl = serverUrl
  }

  async initialize(walletCore: WalletCore): Promise<void> {
    this.walletCore = walletCore
  }

  async signTransaction(
    vault: Vault,
    transaction: TransactionData,
    sessionId: string,
    hexEncryptionKey: string,
    peers: string[] = []
  ): Promise<SignedTransaction> {
    if (!this.walletCore) {
      throw new Error('TransactionSigner not initialized. Call initialize() first.')
    }

    try {
      // 1. Validate transaction data
      this.validateTransaction(transaction)

      // 2. Resolve chain
      const chain = this.resolveChain(transaction.chain || 'ethereum')

      // 3. Generate keysign payload using real chain-specific logic
      const keysignPayload = await this.generateKeysignPayload(vault, transaction, chain)

      // 4. Get transaction input data for signing
      const txInputData = getTxInputData({
        keysignPayload,
        walletCore: this.walletCore,
      })

      // 5. Perform MPC keysign
      const signature = await keysign({
        keyShare: vault.keyShares.ecdsa,
        signatureAlgorithm: 'ecdsa',
        message: Buffer.concat(txInputData as unknown as Uint8Array[]).toString('hex'),
        chainPath: this.walletCore.CoinTypeExt.derivationPath(getCoinType({ walletCore: this.walletCore, chain })).replace(/'/g, ''),
        localPartyId: vault.localPartyId,
        peers,
        serverUrl: this.serverUrl,
        sessionId,
        hexEncryptionKey,
        isInitiatingDevice: true,
      })

      // 6. Return signed transaction with real signature
      return {
        hash: `0x${signature.r}${signature.s}`, // Transaction hash would come from broadcast
        rawTransaction: JSON.stringify(transaction),
        signature: signature.der_signature
      }
    } catch (error) {
      throw new Error('Transaction signing failed: ' + (error as Error).message)
    }
  }

  private validateTransaction(transaction: TransactionData): void {
    if (!transaction.from) {
      throw new Error('Transaction must have a from address')
    }
    if (!transaction.to && !transaction.data) {
      throw new Error('Transaction must have either a to address or data')
    }
  }

  private resolveChain(chainStr: string): Chain {
    const chainMap: Record<string, Chain> = {
      'ethereum': Chain.Ethereum,
      'bitcoin': Chain.Bitcoin,
      'cosmos': Chain.Cosmos,
      'thorchain': Chain.THORChain,
      'solana': Chain.Solana,
      'osmosis': Chain.Osmosis,
    }
    
    const chain = chainMap[chainStr.toLowerCase()]
    if (!chain) {
      throw new Error(`Unsupported chain: ${chainStr}`)
    }
    return chain
  }


  private async generateKeysignPayload(
    vault: Vault,
    transaction: TransactionData,
    chain: Chain
  ): Promise<KeysignPayload> {
    if (!this.walletCore) {
      throw new Error('WalletCore not initialized')
    }

    // Get the coin for this transaction
    const accountCoin = {
      ...chainFeeCoin[chain],
      address: transaction.from,
    }

    // Get chain-specific transaction details
    const chainSpecific = await getChainSpecific({
      coin: accountCoin,
      amount: fromChainAmount(
        Number(transaction.amount || transaction.value || '0'),
        accountCoin.decimals
      ),
      isDeposit: false,
      receiver: transaction.to || '',
      transactionType: TransactionType.UNSPECIFIED,
      feeSettings: null,
      data: transaction.data as `0x${string}` | undefined,
    })

    // Get public key
    const publicKey = getPublicKey({
      chain,
      walletCore: this.walletCore,
      hexChainCode: vault.hexChainCode,
      publicKeys: vault.publicKeys,
    })

    // Create coin schema
    const coin = create(CoinSchema, {
      chain,
      ticker: accountCoin.ticker,
      address: transaction.from,
      decimals: accountCoin.decimals,
      hexPublicKey: Buffer.from(publicKey.data()).toString('hex'),
      isNativeToken: true,
      logo: accountCoin.logo || '',
      priceProviderId: accountCoin.priceProviderId || '',
      contractAddress: accountCoin.id || '',
    })

    // Create keysign payload
    return create(KeysignPayloadSchema, {
      toAddress: transaction.to || '',
      toAmount: BigInt(transaction.amount || transaction.value || '0').toString(),
      memo: transaction.data || '',
      vaultPublicKeyEcdsa: vault.publicKeys.ecdsa,
      vaultLocalPartyId: vault.localPartyId,
      coin,
      blockchainSpecific: chainSpecific,
      skipBroadcast: false,
    })
  }


  async estimateGas(): Promise<string> {
    // Would integrate with chain-specific gas estimation
    return "21000" // Default gas limit
  }

  async broadcastTransaction(signedTx: SignedTransaction): Promise<string> {
    // Would integrate with chain-specific broadcast
    return signedTx.hash
  }
}