import type { Chain } from '@core/chain/Chain'
import { Button } from '@lib/ui/buttons/Button'
import { VStack } from '@lib/ui/layout/Stack'
import { Spinner } from '@lib/ui/loaders/Spinner'
import { PageContent } from '@lib/ui/page/PageContent'
import { Text } from '@lib/ui/text'
import type { ChainDiscoveryProgress } from '@vultisig/sdk'
import { useEffect, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { useVultisigSdk } from '../../../../VultisigSdkProvider'

type Props = {
  mnemonic: string
  onComplete: (chains: Chain[], usePhantomSolanaPath: boolean) => void
  onSelectManually: () => void
}

export const SdkScanningChainsStep = ({
  mnemonic,
  onComplete,
  onSelectManually,
}: Props) => {
  const { t } = useTranslation()
  const sdk = useVultisigSdk()
  const [progress, setProgress] = useState<ChainDiscoveryProgress | null>(null)
  const calledRef = useRef(false)

  useEffect(() => {
    if (calledRef.current) return
    calledRef.current = true

    let cancelled = false

    sdk
      .discoverChainsFromSeedphrase(mnemonic, undefined, p => {
        if (!cancelled) setProgress(p)
      })
      .then(result => {
        if (!cancelled) {
          const chainsWithBalance = result.results
            .filter(r => r.hasBalance)
            .map(r => r.chain)
          onComplete(chainsWithBalance, result.usePhantomSolanaPath)
        }
      })
      .catch(() => {
        // On error, let user select manually
        if (!cancelled) onSelectManually()
      })

    return () => {
      cancelled = true
    }
  }, [mnemonic, sdk, onComplete, onSelectManually])

  const progressText = progress
    ? `${progress.chainsProcessed}/${progress.chainsTotal}`
    : null

  return (
    <PageContent alignItems="center" justifyContent="center" gap={24} flexGrow>
      <Spinner size={24} />
      <VStack alignItems="center" gap={12}>
        <Text centerHorizontally color="contrast" size={22} weight={600}>
          {t('scanning_for_chains')}
        </Text>
        <Text centerHorizontally color="supporting" size={14}>
          <Trans
            i18nKey="scanning_for_chains_subtitle"
            components={{
              highlight: <Text as="span" color="regular" />,
            }}
          />
        </Text>
        {progressText && (
          <Text centerHorizontally color="shy" size={13}>
            {progressText}
          </Text>
        )}
      </VStack>
      <VStack style={{ marginTop: 'auto' }} fullWidth>
        <Button kind="outlined" onClick={onSelectManually}>
          {t('select_chains_manually')}
        </Button>
      </VStack>
    </PageContent>
  )
}
