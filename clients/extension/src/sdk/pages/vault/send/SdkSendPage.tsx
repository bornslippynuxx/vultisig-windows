import { useCoreViewState } from '@core/ui/navigation/hooks/useCoreViewState'
import { useCore } from '@core/ui/state/core'
import { SendForm } from '@core/ui/vault/send/form/SendForm'
import { SendFormFieldsStateProvider } from '@core/ui/vault/send/state/formFields'
import { SendReceiverProvider } from '@core/ui/vault/send/state/receiver'
import { Match } from '@lib/ui/base/Match'
import { useStepNavigation } from '@lib/ui/hooks/useStepNavigation'

import { SdkSendVerify } from './SdkSendVerify'

const sendSteps = ['form', 'verify'] as const

export const SdkSendPage = () => {
  const { goBack } = useCore()
  const { step, toPreviousStep, toNextStep } = useStepNavigation({
    steps: sendSteps,
    onExit: goBack,
  })
  const [{ address }] = useCoreViewState<'send'>()

  return (
    <SendFormFieldsStateProvider>
      <SendReceiverProvider initialValue={address ?? ''}>
        <Match
          value={step}
          form={() => <SendForm onFinish={toNextStep} />}
          verify={() => <SdkSendVerify onBack={toPreviousStep} />}
        />
      </SendReceiverProvider>
    </SendFormFieldsStateProvider>
  )
}
