import { fromChainAmount } from '@core/chain/amount/fromChainAmount'
import { SwapQuote } from '@core/chain/swap/quote/SwapQuote'
import { BuildKeysignPayloadError } from '@core/mpc/keysign/error'
import { useCurrentVault } from '@core/ui/vault/state/currentVault'
import { useCurrentVaultCoin } from '@core/ui/vault/state/currentVaultCoins'
import { useFromAmount } from '@core/ui/vault/swap/state/fromAmount'
import { useSwapFromCoin } from '@core/ui/vault/swap/state/fromCoin'
import { useSwapToCoin } from '@core/ui/vault/swap/state/toCoin'
import { noRefetchQueryOptions } from '@lib/ui/query/utils/options'
import { shouldBePresent } from '@lib/utils/assert/shouldBePresent'
import { useQuery } from '@tanstack/react-query'
import type { SwapQuoteResult } from '@vultisig/sdk'

import { useSdkVault } from '../../../SdkVaultProvider'
import { useVaultBridge } from '../../../bridge/useVaultBridge'

/**
 * Adapts a core SwapQuote into the SDK's SwapQuoteResult format.
 *
 * Only `quote` and `expiresAt` are functionally used by vault.prepareSwapTx()
 * for payload building and expiry validation. The remaining fields are populated
 * with values extracted from the quote for event emission.
 */
function toSdkSwapQuoteResult(
  swapQuote: SwapQuote,
  fromCoin: { chain: string; ticker: string; decimals: number; id?: string },
  toCoin: { chain: string; ticker: string; decimals: number; id?: string }
): SwapQuoteResult {
  const isNative = 'native' in swapQuote.quote

  return {
    quote: swapQuote,
    estimatedOutput: isNative
      ? BigInt(swapQuote.quote.native.expected_amount_out)
      : BigInt(swapQuote.quote.general.dstAmount),
    provider: isNative
      ? swapQuote.quote.native.swapChain.toLowerCase()
      : swapQuote.quote.general.provider,
    expiresAt: isNative
      ? Math.max(swapQuote.quote.native.expiry * 1000, Date.now() + 30_000)
      : Date.now() + 60_000,
    requiresApproval: false, // Determined internally by buildSwapKeysignPayload
    fees: { network: 0n, total: 0n },
    warnings: [],
    fromCoin: {
      chain: fromCoin.chain,
      ticker: fromCoin.ticker,
      decimals: fromCoin.decimals,
      tokenId: fromCoin.id,
    },
    toCoin: {
      chain: toCoin.chain,
      ticker: toCoin.ticker,
      decimals: toCoin.decimals,
      tokenId: toCoin.id,
    },
    balance: 0n,
    maxSwapable: 0n,
  } as SwapQuoteResult
}

export const useSdkSwapKeysignPayloadQuery = (swapQuote: SwapQuote) => {
  const [fromCoinKey] = useSwapFromCoin()
  const [toCoinKey] = useSwapToCoin()
  const [fromAmount] = useFromAmount()
  const fromCoin = useCurrentVaultCoin(fromCoinKey)
  const toCoin = useCurrentVaultCoin(toCoinKey)

  const vault = useCurrentVault()
  const sdkVault = useSdkVault()
  const bridge = useVaultBridge()

  return useQuery({
    queryKey: [
      'sdkSwapKeysignPayload',
      fromCoin,
      toCoin,
      fromAmount?.toString(),
      swapQuote,
    ],
    queryFn: async () => {
      const v = sdkVault ?? (await bridge.hydrateVault(vault))
      const amount = fromChainAmount(
        shouldBePresent(fromAmount, 'fromAmount'),
        fromCoin.decimals
      )
      const sdkQuote = toSdkSwapQuoteResult(swapQuote, fromCoin, toCoin)
      const result = await v.prepareSwapTx({
        fromCoin,
        toCoin,
        amount,
        swapQuote: sdkQuote,
      })
      return result.keysignPayload
    },
    ...noRefetchQueryOptions,
    retry: (failureCount, error) => {
      if (error instanceof BuildKeysignPayloadError) return false
      if ((error as Error)?.cause instanceof BuildKeysignPayloadError)
        return false
      return failureCount < 3
    },
  })
}
