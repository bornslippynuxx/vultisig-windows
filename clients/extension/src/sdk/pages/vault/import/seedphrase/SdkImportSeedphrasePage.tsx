import { Chain } from '@core/chain/Chain'
import { PageHeaderBackButton } from '@core/ui/flow/PageHeaderBackButton'
import { useCore } from '@core/ui/state/core'
import { VStack } from '@lib/ui/layout/Stack'
import { fitPageContent } from '@lib/ui/page/PageContent'
import { PageHeader } from '@lib/ui/page/PageHeader'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import { SdkCreateFastVaultFlow } from '../../../../vault/SdkCreateFastVaultFlow'
import { SdkEnterSeedphraseStep } from './SdkEnterSeedphraseStep'
import { SdkScanningChainsStep } from './SdkScanningChainsStep'
import { SdkScanResultStep } from './SdkScanResultStep'
import { SdkSelectChainsStep } from './SdkSelectChainsStep'

type Step = 'input' | 'scanning' | 'scanResult' | 'chains' | 'fastVault'

const backSteps: Record<Step, Step | null> = {
  input: null,
  scanning: 'input',
  scanResult: 'input',
  chains: 'input',
  fastVault: null, // handled by SdkCreateFastVaultFlow
}

const stepTitles: Partial<Record<Step, string>> = {
  scanning: 'import_seedphrase',
  chains: 'select_chains',
}

const Container = styled.div`
  ${fitPageContent({
    contentMaxWidth: 360,
  })}
  min-height: fit-content;
`

export const SdkImportSeedphrasePage = () => {
  const { t } = useTranslation()
  const { goBack } = useCore()

  const [step, setStep] = useState<Step>('input')
  const [mnemonic, setMnemonic] = useState('')
  const [selectedChains, setSelectedChains] = useState<Chain[]>([])
  const [usePhantomSolanaPath, setUsePhantomSolanaPath] = useState(false)

  // When step is 'fastVault', render the SDK vault creation flow
  if (step === 'fastVault') {
    return (
      <SdkCreateFastVaultFlow
        keyImportInput={{
          mnemonic,
          chains: selectedChains,
          usePhantomSolanaPath,
        }}
      />
    )
  }

  const handleBack = () => {
    const prevStep = backSteps[step]
    if (prevStep) {
      if (prevStep === 'input') {
        setSelectedChains([])
        setUsePhantomSolanaPath(false)
      }
      setStep(prevStep)
    } else {
      goBack()
    }
  }

  const titleKey = stepTitles[step]

  const renderStep = () => {
    switch (step) {
      case 'input':
        return (
          <SdkEnterSeedphraseStep
            mnemonic={mnemonic}
            onMnemonicChange={setMnemonic}
            onSubmit={(cleaned: string) => {
              setMnemonic(cleaned)
              setStep('scanning')
            }}
          />
        )
      case 'scanning':
        return (
          <SdkScanningChainsStep
            mnemonic={mnemonic}
            onComplete={(chains, phantomPath) => {
              setSelectedChains(chains)
              setUsePhantomSolanaPath(phantomPath)
              setStep('scanResult')
            }}
            onSelectManually={() => {
              setSelectedChains([])
              setStep('chains')
            }}
          />
        )
      case 'scanResult':
        return (
          <SdkScanResultStep
            selectedChains={selectedChains}
            onFinish={() => setStep('fastVault')}
            onCustomize={() => setStep('chains')}
            onSelectManually={() => setStep('chains')}
          />
        )
      case 'chains':
        return (
          <SdkSelectChainsStep
            selectedChains={selectedChains}
            onSelectedChainsChange={setSelectedChains}
            onFinish={() => setStep('fastVault')}
          />
        )
    }
  }

  return (
    <VStack fullHeight>
      <PageHeader
        primaryControls={<PageHeaderBackButton onClick={handleBack} />}
        title={titleKey ? t(titleKey as any) : undefined}
      />
      <Container>{renderStep()}</Container>
    </VStack>
  )
}
