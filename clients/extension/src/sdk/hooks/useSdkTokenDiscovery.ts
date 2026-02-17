import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Chain, VaultEvents } from '@vultisig/sdk'

import { useSdkEventCallback } from '../useSdkEvent'
import { useSdkVaultRequired } from './useSdkVaultRequired'

/**
 * Discovers tokens held on a specific chain via the SDK.
 *
 * Scans the vault's address for ERC-20 / SPL / other token balances.
 * Auto-invalidates when the vault emits `tokenAdded`.
 *
 * @param chain - The chain to scan for tokens
 */
export const useSdkTokenDiscovery = (chain: Chain) => {
  const vault = useSdkVaultRequired()
  const queryClient = useQueryClient()

  useSdkEventCallback<VaultEvents, 'tokenAdded'>(vault, 'tokenAdded', event => {
    if (event.chain === chain) {
      queryClient.invalidateQueries({
        queryKey: ['sdk', 'tokenDiscovery', vault.id, chain],
      })
    }
  })

  return useQuery({
    queryKey: ['sdk', 'tokenDiscovery', vault.id, chain],
    queryFn: () => vault.discoverTokens(chain),
  })
}
