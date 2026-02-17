import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { FiatCurrency, VaultEvents } from '@vultisig/sdk'

import { useSdkEventCallback } from '../useSdkEvent'
import { useSdkVaultRequired } from './useSdkVaultRequired'

/**
 * Fetches the total portfolio value across all active chains via the SDK.
 *
 * Auto-invalidates when the vault emits `totalValueUpdated`.
 *
 * @param fiatCurrency - Optional fiat currency override (default: vault's configured currency)
 */
export const useSdkTotalValue = (fiatCurrency?: FiatCurrency) => {
  const vault = useSdkVaultRequired()
  const queryClient = useQueryClient()

  useSdkEventCallback<VaultEvents, 'totalValueUpdated'>(
    vault,
    'totalValueUpdated',
    () => {
      queryClient.invalidateQueries({
        queryKey: ['sdk', 'totalValue', vault.id],
      })
    }
  )

  return useQuery({
    queryKey: ['sdk', 'totalValue', vault.id, fiatCurrency],
    queryFn: () => vault.getTotalValue(fiatCurrency),
  })
}
