import { hasServer } from '@core/mpc/devices/localPartyId'
import { FlowPageHeader } from '@core/ui/flow/FlowPageHeader'
import {
  customMessageDefaultChain,
  CustomMessageSupportedChain,
} from '@core/ui/mpc/keysign/customMessage/chains'
import { getCustomMessageHex } from '@core/ui/mpc/keysign/customMessage/getCustomMessageHex'
import { useCoreNavigate } from '@core/ui/navigation/hooks/useCoreNavigate'
import { useCurrentVault } from '@core/ui/vault/state/currentVault'
import { SignCustomMessagePage } from '@core/ui/vault/keysign/custom-message'
import { Button } from '@lib/ui/buttons/Button'
import { useStepNavigation } from '@lib/ui/hooks/useStepNavigation'
import { TextInput } from '@lib/ui/inputs/TextInput'
import { VStack, vStack } from '@lib/ui/layout/Stack'
import { PageContent } from '@lib/ui/page/PageContent'
import { PageFooter } from '@lib/ui/page/PageFooter'
import { Text } from '@lib/ui/text'
import { getColor } from '@lib/ui/theme/getters'
import { extractErrorMsg } from '@lib/utils/error/extractErrorMsg'
import { useMutation } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import { useSdkVault } from '../../../SdkVaultProvider'
import { useVaultBridge } from '../../../bridge/useVaultBridge'

const steps = ['form', 'verify'] as const

export const SdkSignCustomMessagePage = () => {
  const vault = useCurrentVault()

  // Secure vaults fall back to legacy keysign pipeline
  if (!hasServer(vault.signers)) {
    return <SignCustomMessagePage />
  }

  return <SdkSignCustomMessageFlow />
}

const SdkSignCustomMessageFlow = () => {
  const { t } = useTranslation()
  const { step, toNextStep, toPreviousStep } = useStepNavigation({ steps })
  const navigate = useCoreNavigate()

  const [method, setMethod] = useState('')
  const [message, setMessage] = useState('')

  const vault = useCurrentVault()
  const sdkVault = useSdkVault()
  const bridge = useVaultBridge()

  const chain: CustomMessageSupportedChain = customMessageDefaultChain

  const isDisabled = useMemo(() => {
    if (!method) return t('method_required')
    if (!message) return t('message_required')
  }, [method, message, t])

  const signMutation = useMutation({
    mutationFn: async () => {
      const v = sdkVault ?? (await bridge.hydrateVault(vault))
      const hash = getCustomMessageHex({ chain, message, method })
      return v.signBytes({ data: hash, chain })
    },
  })

  // After successful signing, show signature result
  if (signMutation.isSuccess) {
    const signature =
      typeof signMutation.data === 'object' && signMutation.data !== null
        ? (signMutation.data as { signature?: string }).signature ??
          String(signMutation.data)
        : String(signMutation.data)

    return (
      <VStack fullHeight>
        <FlowPageHeader title={t('signature')} />
        <PageContent gap={24} flexGrow scrollable>
          <ReviewItem>
            <Text size={12} color="shy" weight={500}>
              {t('signature')}
            </Text>
            <Text
              size={14}
              weight={500}
              style={{ wordBreak: 'break-all' }}
            >
              {signature}
            </Text>
          </ReviewItem>
        </PageContent>
        <PageFooter>
          <Button onClick={() => navigate({ id: 'vault' })}>
            {t('done')}
          </Button>
        </PageFooter>
      </VStack>
    )
  }

  const isFillingForm = step === 'form'

  return (
    <VStack fullHeight>
      <FlowPageHeader
        onBack={!isFillingForm ? toPreviousStep : undefined}
        title={isFillingForm ? t('sign_message') : t('verify')}
      />
      <PageContent gap={24} flexGrow scrollable>
        <VStack gap={16}>
          {isFillingForm ? (
            <>
              <StyledTextInput
                value={method}
                onValueChange={setMethod}
                placeholder={t('signing_method')}
              />
              <StyledTextInput
                value={message}
                onValueChange={setMessage}
                placeholder={t('message_to_sign')}
              />
            </>
          ) : (
            <>
              <ReviewItem>
                <Text size={12} color="shy" weight={500}>
                  {t('signing_method')}
                </Text>
                <Text size={14} weight={500}>
                  {method}
                </Text>
              </ReviewItem>
              <ReviewItem>
                <Text size={12} color="shy" weight={500}>
                  {t('message_to_sign')}
                </Text>
                <Text size={14} weight={500}>
                  {message}
                </Text>
              </ReviewItem>
            </>
          )}
        </VStack>
        {signMutation.error && (
          <Text color="danger" size={12}>
            {extractErrorMsg(signMutation.error)}
          </Text>
        )}
      </PageContent>
      <PageFooter>
        {isFillingForm ? (
          <Button disabled={isDisabled} onClick={toNextStep}>
            {t('continue')}
          </Button>
        ) : (
          <Button
            loading={signMutation.isPending}
            onClick={() => signMutation.mutate()}
          >
            {t('sign')}
          </Button>
        )}
      </PageFooter>
    </VStack>
  )
}

const StyledTextInput = styled(TextInput)`
  font-weight: 500;
  padding-left: 16px;
  border: 1px solid ${getColor('foregroundExtra')};

  &::placeholder {
    font-weight: 500;
    font-size: 16px;
  }
`

const ReviewItem = styled.div`
  ${vStack({
    gap: 12,
  })};

  padding: 16px 20px;
  border-radius: 12px;
  border: 1px solid ${getColor('foregroundExtra')};
  background: rgba(11, 26, 58, 0.5);
  min-width: 0;
`
