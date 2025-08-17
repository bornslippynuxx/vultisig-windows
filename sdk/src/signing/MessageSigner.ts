import { create } from '@bufbuild/protobuf'
import { Chain } from '@core/chain/Chain'
import { keysign } from '@core/mpc/keysign'
import { CustomMessagePayloadSchema } from '@core/mpc/types/vultisig/keysign/v1/custom_message_payload_pb'
import { Vault } from '@core/ui/vault/Vault'
import { WalletCore } from '@trustwallet/wallet-core'
import { getCoinType } from '@core/chain/coin/coinType'

export class MessageSigner {
  private serverUrl: string
  private walletCore: WalletCore | null = null

  constructor(serverUrl: string) {
    this.serverUrl = serverUrl
  }

  async initialize(walletCore: WalletCore): Promise<void> {
    this.walletCore = walletCore
  }

  async signMessage(
    vault: Vault,
    message: string,
    chain: string,
    sessionId: string,
    hexEncryptionKey: string,
    peers: string[] = []
  ): Promise<string> {
    if (!this.walletCore) {
      throw new Error('MessageSigner not initialized. Call initialize() first.')
    }

    try {
      // 1. Resolve chain
      const chainEnum = this.resolveChain(chain)
      
      // 2. Create custom message payload
      const customMessagePayload = create(CustomMessagePayloadSchema, {
        method: 'personal_sign',
        message: this.formatMessage(message, chain),
        vaultPublicKeyEcdsa: vault.publicKeys.ecdsa,
        vaultLocalPartyId: vault.localPartyId,
        chain: chainEnum,
      })
      
      // 3. Convert to hex for signing
      const messageHex = Buffer.from(customMessagePayload.message, 'utf8').toString('hex')
      
      // 4. Perform MPC keysign
      const signature = await keysign({
        keyShare: vault.keyShares.ecdsa,
        signatureAlgorithm: 'ecdsa',
        message: messageHex,
        chainPath: this.walletCore.CoinTypeExt.derivationPath(getCoinType({ walletCore: this.walletCore, chain: chainEnum })).replace(/'/g, ''),
        localPartyId: vault.localPartyId,
        peers,
        serverUrl: this.serverUrl,
        sessionId,
        hexEncryptionKey,
        isInitiatingDevice: true,
      })
      
      // 5. Return the signature in proper format
      return `0x${signature.r}${signature.s}${signature.recovery_id || ''}`
    } catch (error) {
      throw new Error('Message signing failed: ' + (error as Error).message)
    }
  }

  private formatMessage(message: string, chain: string): string {
    switch (chain.toLowerCase()) {
      case 'ethereum':
        // Ethereum personal_sign format
        return `0x${Buffer.from(message, 'utf8').toString('hex')}`
      
      case 'cosmos':
      case 'osmosis':
      case 'thorchain':
        // Cosmos message format
        return JSON.stringify({
          account_number: "0",
          chain_id: chain,
          fee: { amount: [], gas: "0" },
          memo: "",
          msgs: [{ type: "sign/MsgSignData", value: { signer: "", data: message } }],
          sequence: "0"
        })
      
      case 'solana':
        // Solana message format
        return message
      
      default:
        throw new Error(`Unsupported chain for message signing: ${chain}`)
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


}