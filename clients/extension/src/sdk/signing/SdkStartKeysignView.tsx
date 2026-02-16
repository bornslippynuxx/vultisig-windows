import { KeysignActionProvider } from '@core/ui/mpc/keysign/action/KeysignActionProvider'
import { KeysignSigningStep } from '@core/ui/mpc/keysign/KeysignSigningStep'
import { KeysignMessagePayloadProvider } from '@core/ui/mpc/keysign/state/keysignMessagePayload'
import { StartKeysignFlow } from '@core/ui/mpc/keysign/start/StartKeysignFlow'
import { StartKeysignProviders } from '@core/ui/mpc/keysign/start/StartKeysignProviders'
import { useCoreViewState } from '@core/ui/navigation/hooks/useCoreViewState'

import { SdkKeysignActionProvider } from './SdkKeysignActionProvider'

/**
 * SDK-backed keysign entry point.
 *
 * - Fast vaults: skips MPC session setup entirely. The SDK's signBytes()
 *   handles server coordination, relay, and MPC internally. Renders
 *   KeysignSigningStep directly with SDK-backed action.
 *
 * - Secure vaults: falls back to the original MPC-based flow (QR code,
 *   device discovery, relay session) since the SDK's secure signing
 *   requires a different integration pattern.
 */
export const SdkStartKeysignView = () => {
  const [{ securityType }] = useCoreViewState<'keysign'>()

  if (securityType === 'secure') {
    return (
      <StartKeysignProviders>
        <StartKeysignFlow keysignActionProvider={KeysignActionProvider} />
      </StartKeysignProviders>
    )
  }

  return <SdkFastKeysignFlow />
}

const SdkFastKeysignFlow = () => {
  const [{ keysignPayload }] = useCoreViewState<'keysign'>()

  return (
    <SdkKeysignActionProvider>
      <KeysignMessagePayloadProvider value={keysignPayload}>
        <KeysignSigningStep />
      </KeysignMessagePayloadProvider>
    </SdkKeysignActionProvider>
  )
}
