import { FastVaultReshareFlow } from '@core/ui/mpc/keygen/reshare/fast/FastVaultReshareFlow'
import { ReshareVaultFlowProviders } from '@core/ui/mpc/keygen/reshare/ReshareVaultFlowProviders'
import { KeygenOperationProvider } from '@core/ui/mpc/keygen/state/currentKeygenOperationType'
import { EmailProvider } from '@core/ui/state/email'
import { PasswordProvider } from '@core/ui/state/password'

import { SdkReshareKeygenActionProvider } from './SdkReshareKeygenActionProvider'

/**
 * SDK-backed fast vault reshare.
 *
 * Same structure as the original ReshareFastVault but swaps
 * ReshareVaultKeygenActionProvider → SdkReshareKeygenActionProvider.
 * All core UI (FastVaultReshareFlow) remains unchanged.
 */
export const SdkReshareFastVault = () => (
  <ReshareVaultFlowProviders>
    <PasswordProvider initialValue="">
      <EmailProvider initialValue="">
        <KeygenOperationProvider value={{ reshare: 'regular' }}>
          <SdkReshareKeygenActionProvider>
            <FastVaultReshareFlow />
          </SdkReshareKeygenActionProvider>
        </KeygenOperationProvider>
      </EmailProvider>
    </PasswordProvider>
  </ReshareVaultFlowProviders>
)
