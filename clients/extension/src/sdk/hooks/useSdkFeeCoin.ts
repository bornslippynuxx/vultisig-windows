import { Vultisig, type Chain, type FeeCoinInfo } from '@vultisig/sdk'

/**
 * Returns the native fee coin info for a chain (synchronous — no query needed).
 *
 * This is a static lookup (chain → { ticker, decimals, logo, priceProviderId }).
 *
 * @param chain - The chain to get fee coin info for
 */
export const useSdkFeeCoin = (chain: Chain): FeeCoinInfo =>
  Vultisig.getFeeCoin(chain)
