import { useQuery } from '@tanstack/react-query'
import type { Chain } from '@vultisig/sdk'

import { useSdkVaultRequired } from './useSdkVaultRequired'

/**
 * Derives the address for a specific chain via the SDK.
 *
 * Addresses are cached by the SDK internally, so subsequent calls are fast.
 *
 * @param chain - The chain to derive an address for
 */
export const useSdkChainAddress = (chain: Chain) => {
  const vault = useSdkVaultRequired()

  return useQuery({
    queryKey: ['sdk', 'address', vault.id, chain],
    queryFn: () => vault.address(chain),
    staleTime: Infinity,
  })
}
