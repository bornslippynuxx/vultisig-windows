import { VaultSecurityTypeProvider } from '@core/ui/mpc/keygen/create/state/vaultSecurityType'
import { KeygenOperationProvider } from '@core/ui/mpc/keygen/state/currentKeygenOperationType'
import { useCoreViewState } from '@core/ui/navigation/hooks/useCoreViewState'

import { SdkCreateFastVaultFlow } from './SdkCreateFastVaultFlow'

/**
 * SDK-backed fast vault setup page.
 *
 * Handles both new vault creation and seedphrase import via SDK:
 * - New vault: sdk.createFastVault() with email verification
 * - Seedphrase: sdk.createFastVaultFromSeedphrase() with email verification
 */
export const SdkSetupFastVaultPage = () => {
  const [state] = useCoreViewState<'setupFastVault'>()

  return (
    <VaultSecurityTypeProvider value="fast">
      <KeygenOperationProvider
        value={
          state?.keyImportInput ? { keyimport: true } : { create: true }
        }
      >
        <SdkCreateFastVaultFlow keyImportInput={state?.keyImportInput} />
      </KeygenOperationProvider>
    </VaultSecurityTypeProvider>
  )
}
