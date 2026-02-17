import { VStack } from '@lib/ui/layout/Stack'
import { Spinner } from '@lib/ui/loaders/Spinner'
import { Text } from '@lib/ui/text'
import type { Balance, Chain } from '@vultisig/sdk'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { useSdkBalances } from '../../hooks'
import { SdkVaultChainItem } from './SdkVaultChainItem'

type ChainBalanceSummary = {
  chain: Chain
  nativeBalance: Balance
  totalFiatValue: number
}

/**
 * Displays the list of chains with their balances, sorted by fiat value.
 * Data is fetched via the SDK's vault.balances() method.
 */
export const SdkVaultChainList = () => {
  const { t } = useTranslation()
  const { data, isPending, isError } = useSdkBalances()

  const chainSummaries = useMemo(() => {
    if (!data) return []

    // Group balances by chain and compute total fiat value per chain
    const chainMap = new Map<string, ChainBalanceSummary>()

    for (const [key, balance] of Object.entries(data)) {
      const chainId = balance.chainId || key.split(':')[0]

      const existing = chainMap.get(chainId)
      if (existing) {
        // Add token's fiat value to chain total
        existing.totalFiatValue += balance.fiatValue ?? 0
      } else {
        chainMap.set(chainId, {
          chain: chainId as Chain,
          nativeBalance: balance,
          totalFiatValue: balance.fiatValue ?? 0,
        })
      }
    }

    // Sort by total fiat value descending
    return Array.from(chainMap.values()).sort(
      (a, b) => b.totalFiatValue - a.totalFiatValue
    )
  }, [data])

  if (isPending) {
    return (
      <VStack alignItems="center" gap={12}>
        <Spinner size="2em" />
      </VStack>
    )
  }

  if (isError) {
    return (
      <VStack alignItems="center" gap={12}>
        <Text color="danger" size={14}>
          {t('failed_to_load')}
        </Text>
      </VStack>
    )
  }

  if (chainSummaries.length === 0) {
    return null
  }

  return (
    <VStack gap={8}>
      {chainSummaries.map(({ chain, nativeBalance, totalFiatValue }) => (
        <SdkVaultChainItem
          key={chain}
          chain={chain}
          formattedBalance={nativeBalance.formattedAmount}
          symbol={nativeBalance.symbol}
          fiatValue={totalFiatValue}
        />
      ))}
    </VStack>
  )
}
