import { Vault } from '@core/ui/vault/Vault'
import { getCoinBalance } from '@core/chain/coin/balance'
import { Chain } from '@core/chain/Chain'
import { CoinBalance } from '../types/Vault'
import { AddressDeriver } from './AddressDeriver'

export class BalanceManager {
  private addressDeriver: AddressDeriver

  constructor() {
    this.addressDeriver = new AddressDeriver()
  }

  async getBalances(vault: Vault, chains: string[] = ['ethereum', 'bitcoin', 'cosmos']): Promise<Record<string, CoinBalance>> {
    try {
      const balances: Record<string, CoinBalance> = {}
      
      for (const chainStr of chains) {
        try {
          const chain = this.mapStringToChain(chainStr)
          const address = await this.addressDeriver.deriveAddress(vault, chainStr)
          
          // Create coin input for balance query
          const coinInput = {
            chain,
            address,
            ticker: this.getChainNativeTicker(chain),
            decimals: this.getChainDecimals(chain),
            isNativeToken: true
          }

          // Get balance using core balance resolver
          const amount = await getCoinBalance(coinInput)
          
          balances[chainStr] = {
            amount: amount.toString(),
            decimals: coinInput.decimals
          }
        } catch (error) {
          console.warn(`Failed to get balance for ${chainStr}:`, error)
          // Continue with other chains even if one fails
        }
      }
      
      return balances
    } catch (error) {
      throw new Error('Failed to fetch balances: ' + (error as Error).message)
    }
  }

  private mapStringToChain(chainStr: string): Chain {
    const chainMap: Record<string, Chain> = {
      'ethereum': Chain.Ethereum,
      'bitcoin': Chain.Bitcoin,
      'cosmos': Chain.Cosmos,
      'thorchain': Chain.THORChain,
      'solana': Chain.Solana,
      'polkadot': Chain.Polkadot,
      'ripple': Chain.Ripple,
      'bsc': Chain.BSC,
      'polygon': Chain.Polygon,
      'avalanche': Chain.Avalanche,
      'arbitrum': Chain.Arbitrum,
      'optimism': Chain.Optimism
    }
    
    const mappedChain = chainMap[chainStr.toLowerCase()]
    if (!mappedChain) {
      throw new Error(`Unsupported chain: ${chainStr}`)
    }
    
    return mappedChain
  }

  private getChainNativeTicker(chain: Chain): string {
    const tickers: Record<Chain, string> = {
      [Chain.Ethereum]: 'ETH',
      [Chain.Bitcoin]: 'BTC',
      [Chain.Cosmos]: 'ATOM',
      [Chain.THORChain]: 'RUNE',
      [Chain.Solana]: 'SOL',
      [Chain.Polkadot]: 'DOT',
      [Chain.Ripple]: 'XRP',
      [Chain.BSC]: 'BNB',
      [Chain.Polygon]: 'MATIC',
      [Chain.Avalanche]: 'AVAX',
      [Chain.Arbitrum]: 'ETH',
      [Chain.Optimism]: 'ETH'
    } as any
    
    return tickers[chain] || 'UNKNOWN'
  }

  private getChainDecimals(chain: Chain): number {
    const decimals: Record<Chain, number> = {
      [Chain.Ethereum]: 18,
      [Chain.Bitcoin]: 8,
      [Chain.Cosmos]: 6,
      [Chain.THORChain]: 8,
      [Chain.Solana]: 9,
      [Chain.Polkadot]: 10,
      [Chain.Ripple]: 6,
      [Chain.BSC]: 18,
      [Chain.Polygon]: 18,
      [Chain.Avalanche]: 18,
      [Chain.Arbitrum]: 18,
      [Chain.Optimism]: 18
    } as any
    
    return decimals[chain] || 18
  }

  async refreshBalance(): Promise<CoinBalance> {
    // Would refresh balance for specific chain
    return { amount: '0.0', decimals: 18 }
  }

  async getTotalValueUSD(): Promise<number> {
    // Would calculate total USD value using price feeds
    return 0.0
  }
}