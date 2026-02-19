import { VaultSetupForm } from '@core/ui/mpc/keygen/create/VaultSetupForm'
import { CreateVaultSuccessScreen } from '@core/ui/mpc/keygen/create/CreateVaultSuccessScreen'
import type { FastVaultCreationInput } from '@core/ui/mpc/keygen/create/VaultCreationInput'
import type { KeyImportInput } from '@core/ui/mpc/keygen/keyimport/state/keyImportInput'
import { useCore } from '@core/ui/state/core'
import { useCoreNavigate } from '@core/ui/navigation/hooks/useCoreNavigate'
import { FlowPendingPageContent } from '@lib/ui/flow/FlowPendingPageContent'
import { FlowErrorPageContent } from '@core/ui/flow/FlowErrorPageContent'
import { PageHeader } from '@lib/ui/page/PageHeader'
import { PageContent } from '@lib/ui/page/PageContent'
import { PageHeaderBackButton } from '@core/ui/flow/PageHeaderBackButton'
import { Button } from '@lib/ui/buttons/Button'
import { VStack } from '@lib/ui/layout/Stack'
import { Text } from '@lib/ui/text'
import {
  MultiCharacterInput,
  MultiCharacterInputProps,
} from '@lib/ui/inputs/MultiCharacterInput'
import type { VaultBase, VaultCreationStep } from '@vultisig/sdk'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'

import { useVultisigSdk } from '../VultisigSdkProvider'
import { sdkVaultToExtensionVault } from '../bridge/sdkVaultToExtensionVault'
import { useCreateVaultMutation } from '@core/ui/vault/mutations/useCreateVaultMutation'
import { useVaults } from '@core/ui/storage/vaults'
import { getLastItemOrder } from '@lib/utils/order/getLastItemOrder'

type FlowStep = 'form' | 'creating' | 'verifying' | 'success'

const EMAIL_CODE_LENGTH = 4

type Props = {
  keyImportInput?: KeyImportInput
}

/**
 * SDK-backed fast vault creation flow.
 *
 * Replaces the core CreateFastVaultFlow. Instead of managing MPC sessions
 * and server registration separately, delegates to the SDK which handles
 * the full vault creation lifecycle.
 *
 * Supports both new vault creation and seedphrase import:
 * - New vault: sdk.createFastVault()
 * - Seedphrase: sdk.createFastVaultFromSeedphrase()
 *
 * Steps:
 * 1. VaultSetupForm - collect name, email, password
 * 2. SDK vault creation (with or without seedphrase)
 * 3. Email verification - user enters 4-digit code
 * 4. sdk.verifyVault() - persist vault + sync to extension storage
 * 5. Success screen with Rive animation
 */
export const SdkCreateFastVaultFlow = ({ keyImportInput }: Props) => {
  const { t } = useTranslation()
  const { goBack } = useCore()
  const navigate = useCoreNavigate()
  const sdk = useVultisigSdk()
  const vaults = useVaults()
  const { mutateAsync: createVaultInStorage } = useCreateVaultMutation()

  const [step, setStep] = useState<FlowStep>('form')
  const [formInput, setFormInput] = useState<FastVaultCreationInput | null>(
    null
  )
  const [vaultId, setVaultId] = useState<string | null>(null)
  const [progress, setProgress] = useState<VaultCreationStep | null>(null)
  const [error, setError] = useState<Error | null>(null)

  // Step 2: Create vault via SDK
  const handleFormSubmit = useCallback(
    async (input: FastVaultCreationInput) => {
      setFormInput(input)
      setStep('creating')
      setError(null)

      try {
        let id: string
        if (keyImportInput) {
          id = await sdk.createFastVaultFromSeedphrase({
            mnemonic: keyImportInput.mnemonic,
            chains: keyImportInput.chains,
            usePhantomSolanaPath: keyImportInput.usePhantomSolanaPath,
            name: input.name,
            password: input.password,
            email: input.email,
            onProgress: setProgress,
          })
        } else {
          id = await sdk.createFastVault({
            name: input.name,
            password: input.password,
            email: input.email,
            onProgress: setProgress,
          })
        }
        setVaultId(id)
        setStep('verifying')
      } catch (err) {
        setError(err as Error)
        setStep('creating') // stay on creating step to show error
      }
    },
    [sdk, keyImportInput]
  )

  // Step 4: Verify and save
  const verifyMutation = useMutation({
    mutationFn: async (code: string) => {
      if (!vaultId) throw new Error('No vault ID')

      // Verify with SDK
      const sdkVault: VaultBase = await sdk.verifyVault(vaultId, code)

      // Sync to extension storage
      const order = getLastItemOrder(vaults.map(v => v.order))
      const extensionVault = sdkVaultToExtensionVault(sdkVault, order)
      await createVaultInStorage(extensionVault)

      return sdkVault
    },
    onSuccess: () => {
      setStep('success')
    },
  })

  // Email verification auto-submit
  const [emailCode, setEmailCode] = useState<string | null>('')

  useEffect(() => {
    if (
      emailCode?.length === EMAIL_CODE_LENGTH &&
      !verifyMutation.isPending &&
      !verifyMutation.isSuccess &&
      !verifyMutation.error
    ) {
      verifyMutation.mutate(emailCode)
    }
  }, [emailCode, verifyMutation])

  const inputState = useMemo<MultiCharacterInputProps['validation']>(() => {
    if (verifyMutation.isSuccess) return 'valid'
    if (verifyMutation.isPending) return 'loading'
    if (verifyMutation.error) return 'invalid'
    return 'idle'
  }, [verifyMutation.isSuccess, verifyMutation.isPending, verifyMutation.error])

  // Render based on current step
  switch (step) {
    case 'form':
      return (
        <VaultSetupForm
          vaultSecurityType="fast"
          onBack={goBack}
          onSubmit={handleFormSubmit}
        />
      )

    case 'creating':
      return (
        <>
          <PageHeader
            title={t('fastVaultSetup.connectingWithServer')}
            hasBorder
          />
          {error ? (
            <FlowErrorPageContent
              title={t('failed_to_connect_with_server')}
              error={error}
              action={
                <Button onClick={() => setStep('form')}>{t('back')}</Button>
              }
            />
          ) : (
            <FlowPendingPageContent
              title={
                progress?.message || `${t('connecting_to_server')}...`
              }
              message={t('fastVaultSetup.takeMinute')}
            />
          )}
        </>
      )

    case 'verifying':
      return (
        <VStack fullHeight>
          <PageHeader
            primaryControls={
              <PageHeaderBackButton onClick={() => setStep('form')} />
            }
            title={t('email')}
            hasBorder
          />
          <PageContent gap={48} flexGrow scrollable>
            <VStack gap={4}>
              <Text size={24}>
                {t('fastVaultSetup.backup.enterCode')}
              </Text>
              <Text size={14} color="shy">
                {t('fastVaultSetup.backup.codeInfo')}
              </Text>
            </VStack>
            <VStack gap={8}>
              <MultiCharacterInput
                value={emailCode}
                onChange={value => {
                  setEmailCode(value)
                  verifyMutation.reset()
                }}
                validation={inputState}
                length={EMAIL_CODE_LENGTH}
              />
              <Text size={12} color="shy">
                {t('fastVaultSetup.backup.sentTo', {
                  email: formInput?.email,
                })}
              </Text>
            </VStack>
          </PageContent>
        </VStack>
      )

    case 'success':
      return (
        <CreateVaultSuccessScreen
          onFinish={() => navigate({ id: 'vault' })}
        />
      )
  }
}
