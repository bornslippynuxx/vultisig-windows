import { defaultChains } from '@core/chain/Chain'
import { chainFeeCoin } from '@core/chain/coin/chainFeeCoin'
import { passwordLengthConfig } from '@core/config/password'
import { getVaultId, isKeyImportVault } from '@core/mpc/vault/Vault'
import { FlowPageHeader } from '@core/ui/flow/FlowPageHeader'
import { useCoreNavigate } from '@core/ui/navigation/hooks/useCoreNavigate'
import { useCore } from '@core/ui/state/core'
import { StorageKey } from '@core/ui/storage/StorageKey'
import { useVaultOrders, useVaults } from '@core/ui/storage/vaults'
import { BackupFileDropzone } from '@core/ui/vault/import/components/BackupFileDropzone'
import { UploadedBackupFile } from '@core/ui/vault/import/components/UploadedBackupFile'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@lib/ui/buttons/Button'
import { getFormProps } from '@lib/ui/form/utils/getFormProps'
import { PasswordInput } from '@lib/ui/inputs/PasswordInput'
import { VStack } from '@lib/ui/layout/Stack'
import { PageContent } from '@lib/ui/page/PageContent'
import { PageFooter } from '@lib/ui/page/PageFooter'
import { useRefetchQueries } from '@lib/ui/query/hooks/useRefetchQueries'
import { Text } from '@lib/ui/text'
import { shouldBePresent } from '@lib/utils/assert/shouldBePresent'
import { extractErrorMsg } from '@lib/utils/error/extractErrorMsg'
import { getLastItemOrder } from '@lib/utils/order/getLastItemOrder'
import { getRecordKeys } from '@lib/utils/record/getRecordKeys'
import { useMutation } from '@tanstack/react-query'
import { TFunction } from 'i18next'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { sdkVaultToExtensionVault } from '../../../bridge/sdkVaultToExtensionVault'
import { useVultisigSdk } from '../../../VultisigSdkProvider'

type ImportStep =
  | { id: 'upload' }
  | { id: 'password'; content: string }

export const SdkImportVaultPage = () => {
  const { t } = useTranslation()
  const sdk = useVultisigSdk()
  const navigate = useCoreNavigate()
  const { createVault, createCoins } = useCore()
  const refetch = useRefetchQueries()
  const vaults = useVaults()
  const vaultOrders = useVaultOrders()

  const [step, setStep] = useState<ImportStep>({ id: 'upload' })
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<Error | null>(null)

  const importMutation = useMutation({
    mutationFn: async ({
      content,
      password,
    }: {
      content: string
      password?: string
    }) => {
      // Import via SDK (handles decryption, parsing, storage)
      const sdkVault = await sdk.importVault(content, password)

      // Check for duplicates against existing extension vaults
      const newVaultId = sdkVault.id
      if (vaults.some(v => getVaultId(v) === newVaultId)) {
        throw new Error(t('vault_already_exists'))
      }

      // Check GG20 restriction (extension only supports DKLS/Schnorr)
      if (sdkVault.data.libType === 'GG20') {
        throw new Error(t('extension_vault_import_restriction'))
      }

      // Convert to extension vault format
      const order = getLastItemOrder(vaultOrders)
      const extVault = sdkVaultToExtensionVault(sdkVault, order)
      extVault.isBackedUp = true

      // Save to extension storage
      await createVault(extVault)
      await refetch([StorageKey.vaults])

      // Determine which chains to create coins for
      const chainsToCreate = isKeyImportVault(extVault)
        ? getRecordKeys(shouldBePresent(extVault.chainPublicKeys))
        : defaultChains

      // Create default coins using SDK address derivation
      const coins = await Promise.all(
        chainsToCreate.map(async chain => {
          const address = await sdkVault.address(chain)
          return { ...chainFeeCoin[chain], address }
        })
      )

      await createCoins({ vaultId: getVaultId(extVault), coins })
      await refetch([StorageKey.vaultsCoins])
    },
    onSuccess: () => navigate({ id: 'vault' }),
  })

  const handleFileSelected = async (selectedFile: File) => {
    setFile(selectedFile)
    setFileError(null)
    importMutation.reset()

    try {
      const content = await selectedFile.text()

      if (sdk.isVaultEncrypted(content)) {
        setStep({ id: 'password', content })
      } else {
        importMutation.mutate({ content })
      }
    } catch {
      setFileError(new Error(t('invalid_file_format')))
    }
  }

  if (step.id === 'password') {
    return (
      <ImportPasswordStep
        onSubmit={password =>
          importMutation.mutate({ content: step.content, password })
        }
        isPending={importMutation.isPending}
        error={importMutation.error}
        onReset={importMutation.reset}
        onBack={() => {
          setStep({ id: 'upload' })
          setFile(null)
          importMutation.reset()
        }}
      />
    )
  }

  return (
    <>
      <FlowPageHeader
        title={t('import_vault')}
        onBack={() => navigate({ id: 'vault' })}
      />
      <PageContent>
        <VStack gap={20} flexGrow>
          {file ? (
            <UploadedBackupFile value={file} />
          ) : (
            <BackupFileDropzone
              onFinish={handleFileSelected}
              onError={setFileError}
            />
          )}
          {(fileError || importMutation.error) && (
            <Text centerHorizontally color="danger">
              {extractErrorMsg(fileError || importMutation.error!)}
            </Text>
          )}
        </VStack>
        {file && !importMutation.error && (
          <Button loading={importMutation.isPending} disabled>
            {t('import_vault')}
          </Button>
        )}
      </PageContent>
    </>
  )
}

// Password form for encrypted vault imports

const createPasswordSchema = (t: TFunction) => {
  const message = t('password_pattern_error', passwordLengthConfig)

  return z.object({
    password: z
      .string()
      .min(passwordLengthConfig.min, message)
      .max(passwordLengthConfig.max, message),
  })
}

type PasswordSchema = z.infer<ReturnType<typeof createPasswordSchema>>

const ImportPasswordStep = ({
  onSubmit,
  isPending,
  error,
  onReset,
  onBack,
}: {
  onSubmit: (password: string) => void
  isPending: boolean
  error: Error | null
  onReset: () => void
  onBack: () => void
}) => {
  const { t } = useTranslation()

  const schema = useMemo(() => createPasswordSchema(t), [t])

  const {
    formState: { errors, isValid },
    handleSubmit,
    register,
  } = useForm<PasswordSchema>({
    mode: 'onChange',
    resolver: zodResolver(schema),
  })

  return (
    <VStack
      as="form"
      onSubmit={handleSubmit(({ password }) => onSubmit(password))}
      fullHeight
    >
      <FlowPageHeader title={t('password')} onBack={onBack} />
      <PageContent flexGrow scrollable>
        <PasswordInput
          {...register('password', {
            onChange: () => {
              if (error) onReset()
            },
          })}
          error={errors.password?.message}
          label={t('vault_password')}
          placeholder={t('enter_password')}
          validation={errors.password ? 'invalid' : undefined}
        />
      </PageContent>
      <PageFooter gap={16}>
        <Button disabled={!isValid} loading={isPending} type="submit">
          {t('continue')}
        </Button>
        {error && (
          <Text color="danger" size={12}>
            {t('incorrect_password')}
          </Text>
        )}
      </PageFooter>
    </VStack>
  )
}
