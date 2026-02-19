import { ReshareSecureVaultFlow } from '@core/ui/mpc/keygen/reshare/ReshareSecureVaultFlow'
import { ReshareVaultFlowProviders } from '@core/ui/mpc/keygen/reshare/ReshareVaultFlowProviders'
import { KeygenOperationProvider } from '@core/ui/mpc/keygen/state/currentKeygenOperationType'

import { SdkReshareKeygenActionProvider } from './SdkReshareKeygenActionProvider'

/**
 * SDK-backed secure vault reshare.
 *
 * Same structure as the original ReshareSecureVault but swaps
 * ReshareVaultKeygenActionProvider → SdkReshareKeygenActionProvider.
 * All core UI (ReshareSecureVaultFlow) remains unchanged.
 */
export const SdkReshareSecureVault = () => (
  <ReshareVaultFlowProviders>
    <KeygenOperationProvider value={{ reshare: 'regular' }}>
      <SdkReshareKeygenActionProvider>
        <ReshareSecureVaultFlow />
      </SdkReshareKeygenActionProvider>
    </KeygenOperationProvider>
  </ReshareVaultFlowProviders>
)
