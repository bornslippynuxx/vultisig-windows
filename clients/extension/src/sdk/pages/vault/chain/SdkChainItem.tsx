import { extractAccountCoinKey } from '@core/chain/coin/AccountCoin'
import { areEqualCoins, Coin } from '@core/chain/coin/Coin'
import { ChainEntityIcon } from '@core/ui/chain/coin/icon/ChainEntityIcon'
import { getChainLogoSrc } from '@core/ui/chain/metadata/getChainLogoSrc'
import { useCore } from '@core/ui/state/core'
import { StorageKey } from '@core/ui/storage/StorageKey'
import { useCurrentVaultNativeCoins } from '@core/ui/vault/state/currentVaultCoins'
import { UnstyledButton } from '@lib/ui/buttons/UnstyledButton'
import { CheckmarkIcon } from '@lib/ui/icons/CheckmarkIcon'
import { IconWrapper } from '@lib/ui/icons/IconWrapper'
import { vStack } from '@lib/ui/layout/Stack'
import { IsActiveProp, ValueProp } from '@lib/ui/props'
import { useRefetchQueries } from '@lib/ui/query/hooks/useRefetchQueries'
import { Text } from '@lib/ui/text'
import { getColor } from '@lib/ui/theme/getters'
import { useMutation } from '@tanstack/react-query'
import { useMemo } from 'react'
import styled, { css } from 'styled-components'

import { useSdkVault } from '../../../SdkVaultProvider'
import { useVaultBridge } from '../../../bridge/useVaultBridge'
import { useCurrentVault } from '@core/ui/vault/state/currentVault'
import { useAssertCurrentVaultId } from '@core/ui/storage/currentVaultId'

export const SdkChainItem = ({ value: coin }: ValueProp<Coin>) => {
  const currentCoins = useCurrentVaultNativeCoins()
  const currentVault = useCurrentVault()
  const sdkVault = useSdkVault()
  const bridge = useVaultBridge()
  const { createCoin, deleteCoin } = useCore()
  const vaultId = useAssertCurrentVaultId()
  const refetch = useRefetchQueries()

  const currentCoin = useMemo(() => {
    return currentCoins.find(c => areEqualCoins(c, coin))
  }, [currentCoins, coin])

  const isSelected = !!currentCoin

  const addChainMutation = useMutation({
    mutationFn: async () => {
      // Hydrate or use cached SDK vault (no password needed for address derivation)
      const vault = sdkVault ?? (await bridge.hydrateVault(currentVault))

      // SDK handles chain addition and address derivation
      await vault.addChain(coin.chain)
      const address = await vault.address(coin.chain)

      // Dual-write: create AccountCoin in extension storage
      const accountCoin = { ...coin, address }
      await createCoin({ vaultId, coin: accountCoin })
      await refetch([StorageKey.vaultsCoins])
    },
  })

  const removeChainMutation = useMutation({
    mutationFn: async () => {
      if (!currentCoin) return

      // Remove from SDK if vault is hydrated
      const vault = sdkVault ?? bridge.getCached(vaultId)
      if (vault) {
        await vault.removeChain(coin.chain)
      }

      // Remove from extension storage
      await deleteCoin({ vaultId, coinKey: extractAccountCoinKey(currentCoin) })
      await refetch([StorageKey.vaultsCoins])
    },
  })

  const isLoading = addChainMutation.isPending || removeChainMutation.isPending

  const handleClick = () => {
    if (isLoading) return
    if (isSelected) {
      removeChainMutation.mutate()
    } else {
      addChainMutation.mutate()
    }
  }

  return (
    <ChainCard
      onClick={handleClick}
      isSelected={isSelected}
      isLoading={isLoading}
    >
      <ChainIconWrapper isActive={isSelected}>
        <ChainEntityIcon
          value={getChainLogoSrc(coin.chain)}
          style={{ fontSize: 27.5 }}
        />
        {isSelected && (
          <CheckBadge color="primary" size={12}>
            <CheckmarkIcon />
          </CheckBadge>
        )}
      </ChainIconWrapper>
      <ChainNameWrapper>
        <Text cropped color="contrast" size={12} weight={500}>
          {coin.chain}
        </Text>
      </ChainNameWrapper>
    </ChainCard>
  )
}

const ChainNameWrapper = styled.div`
  min-width: 0;
  width: 100%;
  text-align: center;
`

const ChainCard = styled(UnstyledButton)<{
  isSelected: boolean
  isLoading: boolean
}>`
  ${vStack({
    gap: 11,
    alignItems: 'center',
  })};

  width: 74px;
`

const ChainIconWrapper = styled.div<IsActiveProp>`
  ${vStack({
    alignItems: 'center',
    justifyContent: 'center',
  })};
  position: relative;
  border-radius: 24px;
  background: rgba(11, 26, 58, 0.5);
  height: 74px;
  padding: 17px;
  opacity: ${({ isActive }) => (isActive ? 1 : 0.5)};

  ${({ isActive }) =>
    isActive &&
    css`
      border: 1.5px solid ${getColor('foregroundSuper')};
      background: ${getColor('foreground')};
    `}
`

const CheckBadge = styled(IconWrapper)`
  position: absolute;
  bottom: 0;
  right: 0;
  height: 24px;
  padding: 8px;
  border-radius: 40px 0 25px 0;
  background: ${getColor('foregroundSuper')};
  font-weight: 600;
`
