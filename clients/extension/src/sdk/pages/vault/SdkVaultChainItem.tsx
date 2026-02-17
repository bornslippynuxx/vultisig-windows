import { ChainEntityIcon } from '@core/ui/chain/coin/icon/ChainEntityIcon'
import { useFormatFiatAmount } from '@core/ui/chain/hooks/useFormatFiatAmount'
import { getChainLogoSrc } from '@core/ui/chain/metadata/getChainLogoSrc'
import { BalanceVisibilityAware } from '@core/ui/vault/balance/visibility/BalanceVisibilityAware'
import { useHandleVaultChainItemPress } from '@core/ui/vault/page/components/useHandleVaultChainItemPress'
import { ChevronRightIcon } from '@lib/ui/icons/ChevronRightIcon'
import { HStack, VStack } from '@lib/ui/layout/Stack'
import { Panel } from '@lib/ui/panel/Panel'
import { Text } from '@lib/ui/text'
import { getColor } from '@lib/ui/theme/getters'
import type { Chain } from '@vultisig/sdk'
import styled from 'styled-components'

type SdkVaultChainItemProps = {
  chain: Chain
  formattedBalance: string
  symbol: string
  fiatValue: number
}

export const SdkVaultChainItem = ({
  chain,
  formattedBalance,
  symbol,
  fiatValue,
}: SdkVaultChainItemProps) => {
  const formatFiatAmount = useFormatFiatAmount()
  const { onClick } = useHandleVaultChainItemPress({ chain })

  return (
    <StyledPanel onClick={onClick}>
      <HStack fullWidth alignItems="center" gap={12}>
        <ChainEntityIcon
          value={getChainLogoSrc(chain as any)}
          style={{ fontSize: 32 }}
        />
        <VStack fullWidth alignItems="start" gap={4}>
          <HStack
            fullWidth
            alignItems="center"
            justifyContent="space-between"
            gap={20}
          >
            <Text color="contrast" size={14}>
              {chain}
            </Text>
            <HStack gap={8} alignItems="center">
              <VStack
                gap={4}
                justifyContent="space-between"
                alignItems="flex-end"
              >
                <Text
                  centerVertically
                  color="contrast"
                  weight="550"
                  size={14}
                >
                  <BalanceVisibilityAware>
                    {formatFiatAmount(fiatValue)}
                  </BalanceVisibilityAware>
                </Text>
                <Text color="shy" weight="500" size={12} centerVertically>
                  {formattedBalance} {symbol}
                </Text>
              </VStack>
              <ShyChevron>
                <ChevronRightIcon />
              </ShyChevron>
            </HStack>
          </HStack>
        </VStack>
      </HStack>
    </StyledPanel>
  )
}

const StyledPanel = styled(Panel)`
  cursor: pointer;
  padding: 12px;

  &:hover {
    background: ${getColor('foreground')};
  }
`

const ShyChevron = styled.div`
  color: ${getColor('textShy')};
  font-size: 16px;
  display: flex;
  align-items: center;
`
