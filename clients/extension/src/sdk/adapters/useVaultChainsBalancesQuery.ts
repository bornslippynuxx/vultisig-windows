import { Chain } from '@core/chain/Chain'
import { coinKeyToString } from '@core/chain/coin/Coin'
import { getCoinValue } from '@core/chain/coin/utils/getCoinValue'
import { useCurrentVaultCoinsByChain } from '@core/ui/vault/state/currentVaultCoins'
import { VaultChainCoin } from '@core/ui/vault/queries/useVaultChainCoinsQuery'
import { EagerQuery } from '@lib/ui/query/Query'
import { order } from '@lib/utils/array/order'
import { sum } from '@lib/utils/array/sum'
import { recordMap } from '@lib/utils/record/recordMap'
import { toEntries } from '@lib/utils/record/toEntries'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { useSdkVault } from '../SdkVaultProvider'

export type VaultChainBalance = {
  chain: Chain
  coins: VaultChainCoin[]
}

export const useVaultChainsBalancesQuery = (): EagerQuery<
  VaultChainBalance[]
> => {
  const vault = useSdkVault()
  const groupedCoins = useCurrentVaultCoinsByChain()

  const balancesQuery = useQuery({
    queryKey: ['sdk', 'balancesWithPrices', vault?.id],
    queryFn: () => vault!.balancesWithPrices(undefined, true),
    enabled: !!vault,
  })

  return useMemo(() => {
    const isPending = !vault || balancesQuery.isPending

    const balancesByChain = recordMap(groupedCoins, coins => {
      return coins.map(coin => {
        const key = coinKeyToString(coin)
        const sdkBalance = balancesQuery.data?.[key]

        return {
          ...coin,
          amount: sdkBalance ? BigInt(sdkBalance.amount || '0') : BigInt(0),
          price: sdkBalance?.value ?? 0,
        }
      })
    })

    const data = order(
      toEntries(balancesByChain).map(({ key, value }) => ({
        chain: key,
        coins: value,
      })),
      ({ coins }) => sum(coins.map(getCoinValue)),
      'desc'
    )

    return {
      isPending,
      data,
      errors: balancesQuery.error ? [balancesQuery.error] : [],
    }
  }, [vault, groupedCoins, balancesQuery])
}
