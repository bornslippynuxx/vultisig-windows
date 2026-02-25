import { extractAccountCoinKey } from '@core/chain/coin/AccountCoin'
import { areEqualCoins, Coin, extractCoinKey } from '@core/chain/coin/Coin'
import { knownTokens } from '@core/chain/coin/knownTokens'
import { PageHeaderBackButton } from '@core/ui/flow/PageHeaderBackButton'
import { useWhitelistedCoinsQuery } from '@core/ui/chain/coin/queries/useWhitelistedCoinsQuery'
import { useCore } from '@core/ui/state/core'
import { StorageKey } from '@core/ui/storage/StorageKey'
import { useAddToCoinFinderIgnoreMutation } from '@core/ui/storage/coinFinderIgnore'
import { useRemoveFromCoinFinderIgnoreMutation } from '@core/ui/storage/coinFinderIgnore'
import { useCurrentVaultChain } from '@core/ui/vault/chain/useCurrentVaultChain'
import { useCurrentVaultChainCoins } from '@core/ui/vault/state/currentVaultCoins'
import { AddCustomTokenPrompt } from '@core/ui/vault/chain/manage/coin/AddCustomTokenPrompt'
import { DoneButton } from '@core/ui/vault/chain/manage/shared/DoneButton'
import { ItemGrid } from '@core/ui/vault/chain/manage/shared/ItemGrid'
import { SearchInput } from '@core/ui/vault/chain/manage/shared/SearchInput'
import { TokenItem } from '@core/ui/vault/chain/manage/shared/TokenItem'
import { sortCoinsAlphabetically } from '@core/chain/coin/utils/sortCoinsAlphabetically'
import { VStack } from '@lib/ui/layout/Stack'
import { PageContent } from '@lib/ui/page/PageContent'
import { PageHeader } from '@lib/ui/page/PageHeader'
import { EmptyState } from '@lib/ui/status/EmptyState'
import { useRefetchQueries } from '@lib/ui/query/hooks/useRefetchQueries'
import { withoutDuplicates } from '@lib/utils/array/withoutDuplicates'
import { useMutation } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useSdkVault } from '../../../../SdkVaultProvider'
import { useVaultBridge } from '../../../../bridge/useVaultBridge'
import { useCurrentVault } from '@core/ui/vault/state/currentVault'
import { useAssertCurrentVaultId } from '@core/ui/storage/currentVaultId'

export const SdkManageVaultChainCoinsPage = () => {
  const { t } = useTranslation()
  const { goBack, createCoin, deleteCoin } = useCore()
  const [search, setSearch] = useState('')
  const currentChain = useCurrentVaultChain()
  const currentCoins = useCurrentVaultChainCoins(currentChain)
  const whitelistedQuery = useWhitelistedCoinsQuery(currentChain)
  const currentVault = useCurrentVault()
  const sdkVault = useSdkVault()
  const bridge = useVaultBridge()
  const vaultId = useAssertCurrentVaultId()
  const refetch = useRefetchQueries()
  const addToCoinFinderIgnore = useAddToCoinFinderIgnoreMutation()
  const removeFromCoinFinderIgnore = useRemoveFromCoinFinderIgnoreMutation()

  const coins = useMemo(() => {
    const currentChainCoins = sortCoinsAlphabetically(
      knownTokens[currentChain]
    )
    const whitelistedCoins = sortCoinsAlphabetically(
      whitelistedQuery.data || []
    )
    return withoutDuplicates(
      [...currentChainCoins, ...whitelistedCoins],
      areEqualCoins
    )
  }, [currentChain, whitelistedQuery.data])

  const filteredCoins = useMemo(() => {
    if (!search) return coins
    const normalizedSearch = search.toLowerCase()
    return coins.filter(({ ticker }) =>
      ticker.toLowerCase().includes(normalizedSearch)
    )
  }, [coins, search])

  const addTokenMutation = useMutation({
    mutationFn: async (coin: Coin) => {
      // Hydrate or use cached SDK vault
      const vault = sdkVault ?? (await bridge.hydrateVault(currentVault))

      // SDK: add token (handles internal state)
      if (coin.id) {
        await vault.addToken(coin.chain, {
          id: coin.id,
          symbol: coin.ticker,
          name: coin.ticker,
          decimals: coin.decimals,
          contractAddress: coin.id,
          chainId: coin.chain,
          logoUrl: coin.logo,
        })
      }

      // Dual-write: create AccountCoin in extension storage
      const address = await vault.address(coin.chain)
      const accountCoin = { ...coin, address }
      await createCoin({ vaultId, coin: accountCoin })
      await refetch([StorageKey.vaultsCoins])
    },
  })

  const deleteTokenMutation = useMutation({
    mutationFn: async (coin: Coin & { address: string }) => {
      // Remove from SDK if vault is hydrated
      const vault = sdkVault ?? bridge.getCached(vaultId)
      if (vault && coin.id) {
        await vault.removeToken(coin.chain, coin.id)
      }

      // Remove from extension storage
      await deleteCoin({
        vaultId,
        coinKey: extractAccountCoinKey(coin),
      })
      await refetch([StorageKey.vaultsCoins])
    },
  })

  const isLoading = addTokenMutation.isPending || deleteTokenMutation.isPending

  const handleToggle = async (coin: Coin) => {
    if (isLoading) return

    const currentCoin = currentCoins.find(c => areEqualCoins(c, coin))
    if (currentCoin) {
      // Remove: add to ignore list then delete
      addToCoinFinderIgnore.mutate(extractCoinKey(currentCoin), {
        onSuccess: () => deleteTokenMutation.mutate(currentCoin),
      })
    } else {
      // Add: remove from ignore list then create
      removeFromCoinFinderIgnore.mutate(extractCoinKey(coin), {
        onSuccess: () => addTokenMutation.mutate(coin),
      })
    }
  }

  return (
    <VStack fullHeight>
      <PageHeader
        primaryControls={<PageHeaderBackButton />}
        secondaryControls={<DoneButton onClick={goBack} />}
        title={t('choose_tokens')}
        hasBorder
      />
      <PageContent gap={24} flexGrow scrollable>
        <SearchInput value={search} onChange={setSearch} />
        {filteredCoins.length > 0 ? (
          <ItemGrid>
            <AddCustomTokenPrompt />
            {filteredCoins.map((coin, index) => (
              <TokenItem
                key={index}
                value={coin}
                currentCoins={currentCoins}
                onToggle={handleToggle}
                isLoading={isLoading}
              />
            ))}
          </ItemGrid>
        ) : (
          <EmptyState title={t('no_tokens_found')} />
        )}
      </PageContent>
    </VStack>
  )
}
