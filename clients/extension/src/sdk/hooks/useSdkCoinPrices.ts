import { useQuery } from '@tanstack/react-query'
import { Vultisig } from '@vultisig/sdk'

/**
 * Fetches coin prices via the SDK (static method, no vault required).
 *
 * @param ids - CoinGecko price provider IDs to look up
 * @param fiatCurrency - Fiat currency code (default: 'usd')
 */
export const useSdkCoinPrices = (ids: string[], fiatCurrency?: string) => {
  return useQuery({
    queryKey: ['sdk', 'coinPrices', ids, fiatCurrency],
    queryFn: () => Vultisig.getCoinPrices({ ids, fiatCurrency }),
    enabled: ids.length > 0,
  })
}
