import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { SwapQuoteParams, VaultEvents } from '@vultisig/sdk'

import { useSdkEventCallback } from '../useSdkEvent'
import { useSdkVaultRequired } from './useSdkVaultRequired'

/**
 * Fetches a swap quote via the SDK.
 *
 * Auto-invalidates when the vault emits `swapQuoteReceived`.
 * Disabled when `params` is null/undefined (e.g., form not yet filled).
 *
 * @param params - Swap parameters (fromCoin, toCoin, amount) or null to disable
 */
export const useSdkSwapQuote = (params: SwapQuoteParams | null) => {
  const vault = useSdkVaultRequired()
  const queryClient = useQueryClient()

  useSdkEventCallback<VaultEvents, 'swapQuoteReceived'>(vault, 'swapQuoteReceived', () => {
    queryClient.invalidateQueries({
      queryKey: ['sdk', 'swapQuote', vault.id],
    })
  })

  return useQuery({
    queryKey: ['sdk', 'swapQuote', vault.id, params],
    queryFn: () => vault.getSwapQuote(params!),
    enabled: params !== null,
  })
}
