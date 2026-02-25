import { passwordLengthConfig } from '@core/config/password'
import { FlowPageHeader } from '@core/ui/flow/FlowPageHeader'
import { useCoreNavigate } from '@core/ui/navigation/hooks/useCoreNavigate'
import { zodResolver } from '@hookform/resolvers/zod'
import { StepTransition } from '@lib/ui/base/StepTransition'
import { Button } from '@lib/ui/buttons/Button'
import { centerContent } from '@lib/ui/css/centerContent'
import { sameDimensions } from '@lib/ui/css/sameDimensions'
import { FileWarningIcon } from '@lib/ui/icons/FileWarningIcon'
import { FolderLockIcon } from '@lib/ui/icons/FolderLockIcon'
import { LockKeyholeOpenIcon } from '@lib/ui/icons/LockKeyholeOpenIcon'
import { UserLockIcon } from '@lib/ui/icons/UserLockIcon'
import { InfoItem } from '@lib/ui/info/InfoItem'
import { PasswordInput } from '@lib/ui/inputs/PasswordInput'
import { VStack } from '@lib/ui/layout/Stack'
import { FitPageContent } from '@lib/ui/page/PageContent'
import { PageContent } from '@lib/ui/page/PageContent'
import { PageFooter } from '@lib/ui/page/PageFooter'
import { OnBackProp } from '@lib/ui/props'
import { InfoBlock } from '@lib/ui/status/InfoBlock'
import { Text } from '@lib/ui/text'
import { getColor } from '@lib/ui/theme/getters'
import { TFunction } from 'i18next'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { Trans, useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { z } from 'zod'

import { useSdkBackupVaultMutation } from './useSdkBackupVaultMutation'

const IconContainer = styled.div`
  ${sameDimensions(64)};
  ${centerContent};
  font-size: 32px;
  border-radius: 16px;
  align-self: center;
  background: ${getColor('foregroundExtra')};
`

const infoItems = [
  {
    icon: <LockKeyholeOpenIcon />,
    i18nKey: 'backup_password_info_secure_without_password',
  },
  {
    icon: <FolderLockIcon />,
    i18nKey: 'backup_password_info_encrypt_with_password',
  },
  {
    icon: <FileWarningIcon />,
    i18nKey: 'backup_password_info_cannot_be_reset',
  },
] as const

const SdkBackupWithoutPassword = ({
  onFinish,
  onPasswordRequest,
  onBack,
}: {
  onFinish: () => void
  onPasswordRequest: () => void
} & Partial<OnBackProp>) => {
  const { t } = useTranslation()
  const { mutate: backupVault, isPending } = useSdkBackupVaultMutation({
    onSuccess: onFinish,
  })

  return (
    <VStack fullHeight>
      <FlowPageHeader title={t('backup')} onBack={onBack} />
      <FitPageContent contentMaxWidth={360}>
        <VStack gap={68} justifyContent="center">
          <VStack gap={36}>
            <IconContainer>
              <UserLockIcon />
            </IconContainer>
            <VStack alignItems="center" gap={16}>
              <Text size={22} centerHorizontally>
                {t('backup_password_confirmation_title')}
              </Text>
              {infoItems.map(({ i18nKey, icon }) => (
                <InfoItem key={i18nKey} icon={icon}>
                  <Trans i18nKey={i18nKey} components={{ b: <b /> }} />
                </InfoItem>
              ))}
            </VStack>
          </VStack>
          <VStack gap={12}>
            <Button loading={isPending} onClick={() => backupVault({})}>
              {t('backup_without_password')}
            </Button>
            <Button
              disabled={isPending}
              kind="secondary"
              onClick={onPasswordRequest}
            >
              {t('backup_with_password')}
            </Button>
          </VStack>
        </VStack>
      </FitPageContent>
    </VStack>
  )
}

const createPasswordSchema = (t: TFunction) => {
  const message = t('password_pattern_error', passwordLengthConfig)

  return z
    .object({
      password: z
        .string()
        .min(passwordLengthConfig.min, message)
        .max(passwordLengthConfig.max, message),
      confirmPassword: z.string(),
    })
    .refine(data => data.password === data.confirmPassword, {
      message: t('password_do_not_match'),
      path: ['confirmPassword'],
    })
}

type PasswordSchema = z.infer<ReturnType<typeof createPasswordSchema>>

const SdkBackupWithPassword = ({
  onFinish,
  onBack,
}: {
  onFinish: () => void
  onBack: () => void
}) => {
  const { t } = useTranslation()
  const schema = useMemo(() => createPasswordSchema(t), [t])

  const { error, isPending, mutate } = useSdkBackupVaultMutation({
    onSuccess: onFinish,
  })

  const {
    formState: { errors, isValid },
    handleSubmit,
    register,
  } = useForm<PasswordSchema>({
    mode: 'onBlur',
    resolver: zodResolver(schema),
  })

  const onSubmit = ({ password }: PasswordSchema) => {
    mutate({ password })
  }

  return (
    <VStack as="form" onSubmit={handleSubmit(onSubmit)} fullHeight>
      <FlowPageHeader title={t('backup')} onBack={onBack} />
      <PageContent gap={16} flexGrow scrollable>
        <Text size={16} weight="600">
          {t('vault_backup_page_password_protection')}
        </Text>
        <VStack gap={8}>
          <PasswordInput
            {...register('password')}
            error={errors.password?.message}
            placeholder={t('enter_password')}
            validation={
              isValid ? 'valid' : errors.password ? 'invalid' : undefined
            }
          />
          <PasswordInput
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
            placeholder={t('reenter_password')}
            validation={
              isValid ? 'valid' : errors.confirmPassword ? 'invalid' : undefined
            }
          />
        </VStack>
      </PageContent>
      <PageFooter gap={16}>
        <InfoBlock>{t('vault_backup_page_password_info')}</InfoBlock>
        <Button disabled={!isValid} loading={isPending} type="submit">
          {isPending
            ? t('vault_backup_page_submit_loading_button_text')
            : t('save')}
        </Button>
        {error?.message && (
          <Text color="danger" size={12}>
            {error.message}
          </Text>
        )}
      </PageFooter>
    </VStack>
  )
}

export const SdkVaultBackupFlow = ({
  onBack,
}: Partial<OnBackProp>) => {
  const navigate = useCoreNavigate()
  const onFinish = () => navigate({ id: 'vault' })

  return (
    <StepTransition
      from={({ onFinish: onPasswordRequest }) => (
        <SdkBackupWithoutPassword
          onFinish={onFinish}
          onPasswordRequest={onPasswordRequest}
          onBack={onBack}
        />
      )}
      to={({ onBack }) => (
        <SdkBackupWithPassword onFinish={onFinish} onBack={onBack} />
      )}
    />
  )
}
