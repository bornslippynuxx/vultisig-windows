import { fiatCurrencySymbolRecord } from '@core/config/FiatCurrency'
import { getVaultId } from '@core/mpc/vault/Vault'
import { PageHeaderBackButton } from '@core/ui/flow/PageHeaderBackButton'
import { useCoreNavigate } from '@core/ui/navigation/hooks/useCoreNavigate'
import { useFiatCurrency } from '@core/ui/storage/fiatCurrency'
import { useCurrentVault } from '@core/ui/vault/state/currentVault'
import { Button } from '@lib/ui/buttons/Button'
import { IconWrapper } from '@lib/ui/icons/IconWrapper'
import { TriangleAlertIcon } from '@lib/ui/icons/TriangleAlertIcon'
import { Checkbox } from '@lib/ui/inputs/checkbox/Checkbox'
import { HStack, hStack, VStack } from '@lib/ui/layout/Stack'
import { PageContent } from '@lib/ui/page/PageContent'
import { PageFooter } from '@lib/ui/page/PageFooter'
import { PageHeader } from '@lib/ui/page/PageHeader'
import { Text } from '@lib/ui/text'
import { getColor } from '@lib/ui/theme/getters'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import { useSdkVault } from '../../../SdkVaultProvider'
import { useVaultBridge } from '../../../bridge/useVaultBridge'
import { useVaultTotalBalanceQuery } from '../../../adapters/useVaultTotalBalanceQuery'
import { useCore } from '@core/ui/state/core'
import { StorageKey } from '@core/ui/storage/StorageKey'
import { useRefetchQueries } from '@lib/ui/query/hooks/useRefetchQueries'

const terms = [
  'vault_delete_page_term_1',
  'vault_delete_page_term_2',
  'vault_delete_page_term_3',
] as const

export const SdkDeleteVaultPage = () => {
  const { t } = useTranslation()
  const [termsAccepted, setTermsAccepted] = useState(terms.map(() => false))
  const { data: vaultBalance } = useVaultTotalBalanceQuery()
  const navigate = useCoreNavigate()
  const currency = useFiatCurrency()
  const vault = useCurrentVault()
  const sdkVault = useSdkVault()
  const bridge = useVaultBridge()
  const { deleteVault } = useCore()
  const refetchQueries = useRefetchQueries()
  const isDisabled = !termsAccepted.every(Boolean)

  const vaultId = getVaultId(vault)

  const deleteMutation = useMutation({
    mutationFn: async () => {
      // Delete from SDK storage if vault is hydrated
      const cachedVault = sdkVault ?? bridge.getCached(vaultId)
      if (cachedVault) {
        await cachedVault.delete()
      }

      // Delete from extension storage
      await deleteVault(vaultId)
      await refetchQueries([StorageKey.vaults])

      // Clear bridge cache
      bridge.invalidate(vaultId)
    },
    onSuccess: () => navigate({ id: 'vault' }),
  })

  const handleConfirm = () => {
    if (!isDisabled && !deleteMutation.isPending) {
      deleteMutation.mutate()
    }
  }

  const toggleCheckbox = (index: number) => {
    setTermsAccepted(prev =>
      prev.map((value, i) => (i === index ? !value : value))
    )
  }

  return (
    <VStack fullHeight>
      <PageHeader
        primaryControls={<PageHeaderBackButton />}
        title={t('vault_delete_page_header_title')}
        hasBorder
      />
      <PageContent gap={24} flexGrow scrollable>
        <GradientBackground />
        <VStack alignItems="center" gap={14}>
          <IconWrapper size={24} color="danger">
            <TriangleAlertIcon />
          </IconWrapper>
          <VStack gap={8}>
            <Text color="danger" size={22} weight={500} centerHorizontally>
              {t('vault_delete_page_header_title')}
            </Text>
            <Text color="shy" size={13} weight={500} centerHorizontally>
              {t('vault_delete_page_header_subtitle')}
            </Text>
          </VStack>
        </VStack>
        <VStack gap={12}>
          <Item>
            <Text size={13} weight={500}>
              {t('vault_name')}:
            </Text>
            <Text size={14} weight={500}>
              {vault.name}
            </Text>
          </Item>
          <Item>
            <Text size={13} weight={500}>
              {t('vault_value')}:
            </Text>
            <Text size={14} weight={500}>
              {`${vaultBalance} ${fiatCurrencySymbolRecord[currency]}`}
            </Text>
          </Item>

          <HStack gap={12} alignItems="center">
            <VItem>
              <Text size={13} weight={500}>
                {t('vault_part')}:
              </Text>
              <Text size={14} weight={500}>
                {`${t('share')} ${vault.signers.indexOf(vault.localPartyId) + 1}-${t('of')}-${vault.signers.length}`}
              </Text>
            </VItem>
            <VItem>
              <Text size={13} weight={500}>
                {t('vault_delete_page_device_id')}:
              </Text>
              <Text cropped size={14} weight={500} color="shy">
                {vault.localPartyId}
              </Text>
            </VItem>
          </HStack>
          <HStack gap={12} alignItems="center">
            <VItem>
              <Text size={13} weight={500}>
                {t('vault_details_page_vault_ECDSA')}:
              </Text>
              <Text cropped size={14} weight={500} color="shy">
                {vault.publicKeys.ecdsa}
              </Text>
            </VItem>
            <VItem>
              <Text size={13} weight={500}>
                {t('vault_details_page_vault_EDDSA')}:
              </Text>
              <Text cropped size={14} weight={500} color="shy">
                {vault.publicKeys.eddsa}
              </Text>
            </VItem>
          </HStack>
        </VStack>
        <VStack gap={8}>
          {terms.map((term, index) => (
            <Checkbox
              key={index}
              onChange={() => toggleCheckbox(index)}
              label={t(term)}
              value={termsAccepted[index]}
            />
          ))}
        </VStack>
        {deleteMutation.error?.message && (
          <Text color="danger" size={12}>
            {deleteMutation.error.message}
          </Text>
        )}
      </PageContent>
      <PageFooter>
        <Button
          disabled={isDisabled}
          loading={deleteMutation.isPending}
          onClick={handleConfirm}
          status="danger"
        >
          {t('delete')}
        </Button>
      </PageFooter>
    </VStack>
  )
}

const Item = styled.div`
  padding: 20px;

  ${hStack({
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  })};

  border-radius: 12px;
  border: 1px solid ${getColor('foregroundExtra')};
  background: rgba(11, 26, 58, 0.5);
  min-width: 0;
`

const VItem = styled(Item)`
  display: block;
  flex: 1;
`

const GradientBackground = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 300px;
  height: 300px;
  border-radius: 512px;
  background: linear-gradient(
    82deg,
    rgba(211, 40, 41, 0.1) 8.02%,
    rgba(255, 92, 92, 0.1) 133.75%
  );
  filter: blur(126.94499969482422px);
  pointer-events: none;
  z-index: 0;
`
