import { KeysignActionProvider } from '@core/ui/mpc/keysign/action/KeysignActionProvider'
import { KeysignSigningStep } from '@core/ui/mpc/keysign/KeysignSigningStep'
import { KeysignMessagePayloadProvider } from '@core/ui/mpc/keysign/state/keysignMessagePayload'
import { StartKeysignFlow } from '@core/ui/mpc/keysign/start/StartKeysignFlow'
import { StartKeysignProviders } from '@core/ui/mpc/keysign/start/StartKeysignProviders'
import { useCoreViewState } from '@core/ui/navigation/hooks/useCoreViewState'
import { useCurrentVaultSecurityType } from '@core/ui/vault/state/currentVault'

import { SdkKeysignActionProvider } from './SdkKeysignActionProvider'
import { SdkSecureKeysignFlow } from './SdkSecureKeysignFlow'

/**
 * SDK-backed keysign entry point.
 *
 * Routes to the appropriate signing flow based on vault type and requested
 * security mode:
 *
 * - Secure vaults: SDK-backed relay signing via SdkSecureKeysignFlow.
 *   The SDK's RelaySigningService handles QR generation, device pairing,
 *   and MPC coordination internally. All messages are signed in a single
 *   relay session.
 *
 * - Fast vaults (normal): SDK-backed server signing via SdkFastKeysignFlow.
 *   The SDK's signBytes() handles VultiServer coordination and 2-of-2 MPC.
 *
 * - Fast vaults (hold-to-sign paired mode): Falls back to the core MPC flow
 *   for relay-based signing. The SDK doesn't yet support relay signing for
 *   fast vaults, so we keep the legacy path for this edge case.
 */
export const SdkStartKeysignView = () => {
  const [{ securityType }] = useCoreViewState<'keysign'>()
  const vaultType = useCurrentVaultSecurityType()

  // Secure vault → SDK relay signing (QR + device pairing)
  if (vaultType === 'secure') {
    return <SdkSecureKeysignFlow />
  }

  // Fast vault in paired signing mode (hold-to-sign) → legacy MPC flow
  if (securityType === 'secure') {
    return (
      <StartKeysignProviders>
        <StartKeysignFlow keysignActionProvider={KeysignActionProvider} />
      </StartKeysignProviders>
    )
  }

  // Fast vault normal mode → SDK server signing
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
