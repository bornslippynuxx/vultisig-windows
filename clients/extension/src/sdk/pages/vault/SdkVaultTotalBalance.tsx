import { fiatCurrencySymbolRecord } from '@core/config/FiatCurrency'
import { useFormatFiatAmount } from '@core/ui/chain/hooks/useFormatFiatAmount'
import { useFiatCurrency } from '@core/ui/storage/fiatCurrency'
import { BalanceVisibilityAware } from '@core/ui/vault/balance/visibility/BalanceVisibilityAware'
import { HStack, VStack } from '@lib/ui/layout/Stack'
import { Spinner } from '@lib/ui/loaders/Spinner'
import { Text } from '@lib/ui/text'
import { useTranslation } from 'react-i18next'

import { useSdkTotalValue } from '../../hooks'

/**
 * Displays the total portfolio value fetched via the SDK.
 * Shows a spinner while loading, error text on failure,
 * and the formatted fiat amount on success.
 */
export const SdkVaultTotalBalance = () => {
  const { t } = useTranslation()
  const fiatCurrency = useFiatCurrency()
  const formatFiatAmount = useFormatFiatAmount()
  const { data, isPending, isError } = useSdkTotalValue()

  if (isError) {
    return (
      <VStack alignItems="center" gap={12}>
        <Text color="danger" size={14}>
          {t('failed_to_load')}
        </Text>
      </VStack>
    )
  }

  if (isPending || !data) {
    return (
      <VStack alignItems="center" gap={12}>
        <HStack gap={6} alignItems="center">
          <Text color="contrast" size={28}>
            {fiatCurrencySymbolRecord[fiatCurrency]}
          </Text>
          <Spinner size="1.5em" />
        </HStack>
      </VStack>
    )
  }

  return (
    <VStack alignItems="center" gap={12}>
      <Text color="contrast" size={28} centerVertically>
        <BalanceVisibilityAware size="l">
          {formatFiatAmount(parseFloat(data.amount))}
        </BalanceVisibilityAware>
      </Text>
    </VStack>
  )
}
