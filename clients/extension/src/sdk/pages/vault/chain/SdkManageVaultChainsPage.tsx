import { chainFeeCoin } from '@core/chain/coin/chainFeeCoin'
import { PageHeaderBackButton } from '@core/ui/flow/PageHeaderBackButton'
import { useCoreNavigate } from '@core/ui/navigation/hooks/useCoreNavigate'
import { useAvailableChains } from '@core/ui/vault/state/useAvailableChains'
import { DoneButton } from '@core/ui/vault/chain/manage/shared/DoneButton'
import { ItemGrid } from '@core/ui/vault/chain/manage/shared/ItemGrid'
import { SearchInput } from '@core/ui/vault/chain/manage/shared/SearchInput'
import { VStack } from '@lib/ui/layout/Stack'
import { PageContent } from '@lib/ui/page/PageContent'
import { PageHeader } from '@lib/ui/page/PageHeader'
import { EmptyState } from '@lib/ui/status/EmptyState'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { SdkChainItem } from './SdkChainItem'

export const SdkManageVaultChainsPage = () => {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const availableChains = useAvailableChains()
  const nativeCoins = useMemo(
    () =>
      Object.values(chainFeeCoin).filter(coin =>
        availableChains.includes(coin.chain)
      ),
    [availableChains]
  )
  const navigate = useCoreNavigate()

  const sortedNativeCoins = useMemo(() => {
    let coins = nativeCoins

    if (search) {
      const normalizedSearch = search.toLowerCase()
      coins = nativeCoins.filter(
        ({ chain, ticker }) =>
          chain.toLowerCase().includes(normalizedSearch) ||
          ticker.toLowerCase().includes(normalizedSearch)
      )
    }

    return coins.sort((a, b) => a.chain.localeCompare(b.chain))
  }, [nativeCoins, search])

  return (
    <VStack fullHeight>
      <PageHeader
        primaryControls={
          <PageHeaderBackButton onClick={() => navigate({ id: 'vault' })} />
        }
        secondaryControls={
          <DoneButton onClick={() => navigate({ id: 'vault' })} />
        }
        title={t('manage_chains')}
        hasBorder
      />
      <PageContent gap={24} flexGrow scrollable>
        <SearchInput value={search} onChange={setSearch} />
        {sortedNativeCoins.length > 0 ? (
          <ItemGrid>
            {sortedNativeCoins.map((coin, index) => (
              <SdkChainItem key={index} value={coin} />
            ))}
          </ItemGrid>
        ) : (
          <EmptyState title={t('no_chains_found')} />
        )}
      </PageContent>
    </VStack>
  )
}
