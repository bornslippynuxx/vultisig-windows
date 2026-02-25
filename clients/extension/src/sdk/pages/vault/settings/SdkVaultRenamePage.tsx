import { getVaultId } from '@core/mpc/vault/Vault'
import { PageHeaderBackButton } from '@core/ui/flow/PageHeaderBackButton'
import { useCore } from '@core/ui/state/core'
import { StorageKey } from '@core/ui/storage/StorageKey'
import { useVaults } from '@core/ui/storage/vaults'
import { useCurrentVault } from '@core/ui/vault/state/currentVault'
import { zodResolver } from '@hookform/resolvers/zod'
import { ActionInsideInteractiveElement } from '@lib/ui/base/ActionInsideInteractiveElement'
import { Button } from '@lib/ui/buttons/Button'
import { IconButton, iconButtonSize } from '@lib/ui/buttons/IconButton'
import {
  textInputHeight,
  textInputHorizontalPadding,
} from '@lib/ui/css/textInput'
import { CloseIcon } from '@lib/ui/icons/CloseIcon'
import { TextInput } from '@lib/ui/inputs/TextInput'
import { VStack } from '@lib/ui/layout/Stack'
import { PageContent } from '@lib/ui/page/PageContent'
import { PageFooter } from '@lib/ui/page/PageFooter'
import { PageHeader } from '@lib/ui/page/PageHeader'
import { useRefetchQueries } from '@lib/ui/query/hooks/useRefetchQueries'
import { Text } from '@lib/ui/text'
import { useMutation } from '@tanstack/react-query'
import { TFunction } from 'i18next'
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useTheme } from 'styled-components'
import { z } from 'zod'

import { useSdkVault } from '../../../SdkVaultProvider'
import { useVaultBridge } from '../../../bridge/useVaultBridge'

type CreateSchemaInput = {
  t: TFunction
  existingNames: string[]
  currentName: string
}

const createSchema = ({ t, existingNames, currentName }: CreateSchemaInput) => {
  return z.object({
    name: z
      .string()
      .min(2, t('vault_rename_page_name_error'))
      .max(50, t('vault_rename_page_name_error'))
      .refine(
        name =>
          name === currentName ||
          !existingNames.some(
            existingName => existingName.toLowerCase() === name.toLowerCase()
          ),
        { message: t('vault_name_already_exists') }
      ),
  })
}

type Schema = z.infer<ReturnType<typeof createSchema>>

export const SdkVaultRenamePage = () => {
  const { t } = useTranslation()
  const { goBack, updateVault } = useCore()
  const { colors } = useTheme()
  const currentVault = useCurrentVault()
  const vaults = useVaults()
  const sdkVault = useSdkVault()
  const bridge = useVaultBridge()
  const refetchQueries = useRefetchQueries()

  const vaultId = getVaultId(currentVault)

  const existingNames = useMemo(() => vaults.map(vault => vault.name), [vaults])

  const schema = useMemo(
    () => createSchema({ t, existingNames, currentName: currentVault.name }),
    [t, existingNames, currentVault.name]
  )

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid, isDirty },
  } = useForm<Schema>({
    defaultValues: { name: currentVault.name },
    mode: 'onBlur',
    resolver: zodResolver(schema),
  })

  const renameMutation = useMutation({
    mutationFn: async ({ name }: Schema) => {
      // Hydrate or use cached SDK vault (no password needed for rename)
      const vault = sdkVault ?? (await bridge.hydrateVault(currentVault))

      // SDK rename (validates, persists to SDK storage, emits event)
      await vault.rename(name)

      // Dual-write: update extension storage so vault list stays in sync
      await updateVault({ vaultId, fields: { name } })
      await refetchQueries([StorageKey.vaults])

      // Invalidate bridge cache since vault name changed
      bridge.invalidate(vaultId)
    },
  })

  const onSubmit = (data: Schema) => {
    if (isDirty) {
      renameMutation.mutate(data)
    }
  }

  useEffect(() => {
    if (renameMutation.isSuccess) goBack()
  }, [renameMutation.isSuccess, goBack])

  return (
    <VStack as="form" onSubmit={handleSubmit(onSubmit)} fullHeight>
      <PageHeader
        primaryControls={<PageHeaderBackButton />}
        title={t('rename_vault')}
        hasBorder
      />
      <PageContent gap={12} flexGrow scrollable>
        <ActionInsideInteractiveElement
          render={() => <TextInput {...register('name')} />}
          action={
            <IconButton
              style={{
                color: colors.textShy.toCssValue(),
              }}
              onClick={() => setValue('name', '')}
            >
              <CloseIcon />
            </IconButton>
          }
          actionPlacerStyles={{
            bottom: (textInputHeight - iconButtonSize.md) / 2,
            right: textInputHorizontalPadding,
          }}
        />
        {typeof errors.name?.message === 'string' && (
          <Text color="danger" size={12}>
            {errors.name.message}
          </Text>
        )}
        {renameMutation.error && (
          <Text color="danger" size={12}>
            {renameMutation.error.message}
          </Text>
        )}
      </PageContent>
      <PageFooter>
        <Button
          disabled={!isValid || !isDirty}
          loading={renameMutation.isPending}
          type="submit"
        >
          {t('save')}
        </Button>
      </PageFooter>
    </VStack>
  )
}
