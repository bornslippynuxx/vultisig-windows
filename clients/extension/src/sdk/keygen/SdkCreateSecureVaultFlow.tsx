import { VaultSetupForm } from '@core/ui/mpc/keygen/create/VaultSetupForm'
import { CreateVaultSuccessScreen } from '@core/ui/mpc/keygen/create/CreateVaultSuccessScreen'
import type { SecureVaultCreationInput } from '@core/ui/mpc/keygen/create/VaultCreationInput'
import type { KeyImportInput } from '@core/ui/mpc/keygen/keyimport/state/keyImportInput'
import { useCore } from '@core/ui/state/core'
import { useCoreNavigate } from '@core/ui/navigation/hooks/useCoreNavigate'
import { FlowErrorPageContent } from '@core/ui/flow/FlowErrorPageContent'
import { Button } from '@lib/ui/buttons/Button'
import type { VaultCreationStep } from '@vultisig/sdk'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useVultisigSdk } from '../VultisigSdkProvider'
import { sdkVaultToExtensionVault } from '../bridge/sdkVaultToExtensionVault'
import { useCreateVaultMutation } from '@core/ui/vault/mutations/useCreateVaultMutation'
import { useVaults } from '@core/ui/storage/vaults'
import { getLastItemOrder } from '@lib/utils/order/getLastItemOrder'
import { SecureVaultCreationProgress } from './SecureVaultCreationProgress'

type FlowStep = 'form' | 'creating' | 'success'

type Props = {
  deviceCount?: number
  keyImportInput?: KeyImportInput
}

/**
 * SDK-backed secure vault creation flow.
 *
 * Uses sdk.createSecureVault() or sdk.createSecureVaultFromSeedphrase()
 * to manage the entire lifecycle: session params, QR code, peer discovery,
 * DKLS + Schnorr keygen, and completion signaling.
 *
 * Steps:
 * 1. VaultSetupForm - collect name (secure vault only needs name)
 * 2. SDK creates session → QR code displayed → peers join → keygen runs
 * 3. Vault saved to extension storage
 * 4. Success screen with Rive animation
 */
export const SdkCreateSecureVaultFlow = ({
  deviceCount,
  keyImportInput,
}: Props) => {
  const { t } = useTranslation()
  const { goBack } = useCore()
  const navigate = useCoreNavigate()
  const sdk = useVultisigSdk()
  const vaults = useVaults()
  const { mutateAsync: createVaultInStorage } = useCreateVaultMutation()

  const [step, setStep] = useState<FlowStep>('form')
  const [qrPayload, setQrPayload] = useState<string | null>(null)
  const [devicesJoined, setDevicesJoined] = useState(0)
  const devicesRequired = deviceCount ?? 2
  const [progress, setProgress] = useState<VaultCreationStep | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const handleFormSubmit = useCallback(
    async (input: SecureVaultCreationInput) => {
      setStep('creating')
      setError(null)

      try {
        const sharedCallbacks = {
          onQRCodeReady: setQrPayload,
          onDeviceJoined: (_id: string, total: number) =>
            setDevicesJoined(total),
          onProgress: setProgress,
        }

        let result: { vault: { data: any }; vaultId: string }

        if (keyImportInput) {
          result = await sdk.createSecureVaultFromSeedphrase({
            mnemonic: keyImportInput.mnemonic,
            chains: keyImportInput.chains,
            usePhantomSolanaPath: keyImportInput.usePhantomSolanaPath,
            name: input.name,
            devices: devicesRequired,
            ...sharedCallbacks,
          })
        } else {
          result = await sdk.createSecureVault({
            name: input.name,
            password: '',
            devices: devicesRequired,
            ...sharedCallbacks,
          })
        }

        // Save to extension storage
        const order = getLastItemOrder(vaults.map(v => v.order))
        const extensionVault = sdkVaultToExtensionVault(
          result.vault as any,
          order
        )
        await createVaultInStorage(extensionVault)

        setStep('success')
      } catch (err) {
        setError(err as Error)
      }
    },
    [
      sdk,
      keyImportInput,
      devicesRequired,
      vaults,
      createVaultInStorage,
    ]
  )

  switch (step) {
    case 'form':
      return (
        <VaultSetupForm
          vaultSecurityType="secure"
          onBack={goBack}
          onSubmit={handleFormSubmit}
        />
      )

    case 'creating':
      if (error) {
        return (
          <FlowErrorPageContent
            title={t('failed_to_connect_with_server')}
            error={error}
            action={
              <Button
                onClick={() => {
                  setError(null)
                  setStep('form')
                }}
              >
                {t('back')}
              </Button>
            }
          />
        )
      }
      return (
        <SecureVaultCreationProgress
          qrPayload={qrPayload}
          devicesJoined={devicesJoined}
          devicesRequired={devicesRequired}
          progress={progress}
        />
      )

    case 'success':
      return (
        <CreateVaultSuccessScreen
          onFinish={() => navigate({ id: 'vault' })}
        />
      )
  }
}
