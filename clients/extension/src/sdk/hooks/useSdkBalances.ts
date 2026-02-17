import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Chain, VaultEvents } from '@vultisig/sdk'

import { useSdkEventCallback } from '../useSdkEvent'
import { useSdkVaultRequired } from './useSdkVaultRequired'

/**
 * Fetches balances for multiple chains (or all active chains) via the SDK.
 *
 * Auto-invalidates when any `balanceUpdated` event fires.
 *
 * @param chains - Specific chains to query, or undefined for all active chains
 * @param includeTokens - Whether to include ERC-20 / SPL token balances
 */
export const useSdkBalances = (
  chains?: Chain[],
  includeTokens = false
) => {
  const vault = useSdkVaultRequired()
  const queryClient = useQueryClient()

  useSdkEventCallback<VaultEvents, 'balanceUpdated'>(vault, 'balanceUpdated', () => {
    queryClient.invalidateQueries({
      queryKey: ['sdk', 'balances', vault.id],
    })
  })

  return useQuery({
    queryKey: ['sdk', 'balances', vault.id, chains, includeTokens],
    queryFn: () => vault.balances(chains, includeTokens),
  })
}
