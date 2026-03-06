import type { Chain } from '@core/chain/Chain'
import { ScanResultChainItem } from '@core/ui/vault/import/seedphrase/scanResult/ScanResultChainItem'
import { ScanResultHeader } from '@core/ui/vault/import/seedphrase/scanResult/ScanResultHeader'
import { Button } from '@lib/ui/buttons/Button'
import { SparkledPenIcon } from '@lib/ui/icons/SparkledPenIcon'
import { VStack } from '@lib/ui/layout/Stack'
import { Text } from '@lib/ui/text'
import { useTranslation } from 'react-i18next'

type Props = {
  selectedChains: Chain[]
  onFinish: () => void
  onCustomize: () => void
  onSelectManually: () => void
}

export const SdkScanResultStep = ({
  selectedChains,
  onFinish,
  onCustomize,
  onSelectManually,
}: Props) => {
  const { t } = useTranslation()

  if (selectedChains.length === 0) {
    return (
      <VStack alignItems="center" justifyContent="center" gap={32} flexGrow>
        <VStack alignItems="center" gap={24}>
          <ScanResultHeader
            kind="negative"
            title={t('no_active_chains_found')}
            description={t('no_active_chains_found_description')}
          />
          <Text centerHorizontally color="supporting" size={13}>
            {t('active_chains_warning')}
          </Text>
        </VStack>
        <Button onClick={onSelectManually}>{t('next')}</Button>
      </VStack>
    )
  }

  return (
    <VStack alignItems="center" gap={32} flexGrow>
      <ScanResultHeader
        kind="positive"
        title={t('active_chains_found', { count: selectedChains.length })}
        description={t('active_chains_warning')}
      />

      <VStack fullWidth gap={12}>
        {selectedChains.map(chain => (
          <ScanResultChainItem key={chain} value={chain} />
        ))}
      </VStack>

      <VStack fullWidth gap={20} style={{ marginTop: 'auto' }}>
        <Button onClick={onFinish}>{t('next')}</Button>
        <Button
          kind="link"
          onClick={onCustomize}
          icon={<SparkledPenIcon />}
        >
          {t('customize_chains')}
        </Button>
      </VStack>
    </VStack>
  )
}
