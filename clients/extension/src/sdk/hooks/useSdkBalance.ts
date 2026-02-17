import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Chain, VaultEvents } from '@vultisig/sdk'

import { useSdkEventCallback } from '../useSdkEvent'
import { useSdkVaultRequired } from './useSdkVaultRequired'

/**
 * Fetches the balance for a single chain (and optional token) via the SDK.
 *
 * Auto-invalidates when the vault emits a matching `balanceUpdated` event.
 */
export const useSdkBalance = (chain: Chain, tokenId?: string) => {
  const vault = useSdkVaultRequired()
  const queryClient = useQueryClient()

  useSdkEventCallback<VaultEvents, 'balanceUpdated'>(vault, 'balanceUpdated', event => {
    if (event.chain === chain && event.tokenId === tokenId) {
      queryClient.invalidateQueries({
        queryKey: ['sdk', 'balance', vault.id, chain, tokenId],
      })
    }
  })

  return useQuery({
    queryKey: ['sdk', 'balance', vault.id, chain, tokenId],
    queryFn: () => vault.balance(chain, tokenId),
  })
}
