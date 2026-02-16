import { SetupFastVaultPage as OriginalSetupFastVaultPage } from '@clients/extension/src/components/setup/SetupFastVaultPage'
import { VaultSecurityTypeProvider } from '@core/ui/mpc/keygen/create/state/vaultSecurityType'
import { KeygenOperationProvider } from '@core/ui/mpc/keygen/state/currentKeygenOperationType'
import { useCoreViewState } from '@core/ui/navigation/hooks/useCoreViewState'

import { SdkCreateFastVaultFlow } from './SdkCreateFastVaultFlow'

/**
 * SDK-backed fast vault setup page.
 *
 * For new vault creation: uses SDK's createFastVault() with email verification.
 * For key imports (seedphrase): falls back to the original MPC-based flow
 * since the SDK's seedphrase import requires additional integration.
 */
export const SdkSetupFastVaultPage = () => {
  const [state] = useCoreViewState<'setupFastVault'>()

  // Fall back to original flow for seedphrase imports
  if (state?.keyImportInput) {
    return <OriginalSetupFastVaultPage />
  }

  return (
    <VaultSecurityTypeProvider value="fast">
      <KeygenOperationProvider value={{ create: true }}>
        <SdkCreateFastVaultFlow />
      </KeygenOperationProvider>
    </VaultSecurityTypeProvider>
  )
}
