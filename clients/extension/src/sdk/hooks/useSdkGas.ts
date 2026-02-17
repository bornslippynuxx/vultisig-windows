import { useQuery } from '@tanstack/react-query'
import type { Chain } from '@vultisig/sdk'

import { useSdkVaultRequired } from './useSdkVaultRequired'

/**
 * Fetches gas/fee estimation for a chain via the SDK.
 *
 * Returns chain-specific gas info (e.g., EVM gets gasLimit + EIP-1559 fees,
 * UTXO gets byteFee, Cosmos gets gas amount).
 *
 * @param chain - The chain to estimate fees for
 */
export const useSdkGas = <C extends Chain>(chain: C) => {
  const vault = useSdkVaultRequired()

  return useQuery({
    queryKey: ['sdk', 'gas', vault.id, chain],
    queryFn: () => vault.gas(chain),
  })
}
