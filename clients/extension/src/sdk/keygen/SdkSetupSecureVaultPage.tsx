import { VaultSecurityTypeProvider } from '@core/ui/mpc/keygen/create/state/vaultSecurityType'
import { useCoreViewState } from '@core/ui/navigation/hooks/useCoreViewState'

import { SdkCreateSecureVaultFlow } from './SdkCreateSecureVaultFlow'

/**
 * SDK-backed secure vault setup page.
 *
 * Routes to SdkCreateSecureVaultFlow which handles both:
 * - New vault creation: sdk.createSecureVault()
 * - Seedphrase import: sdk.createSecureVaultFromSeedphrase()
 */
export const SdkSetupSecureVaultPage = () => {
  const [state] = useCoreViewState<'setupSecureVault'>()

  return (
    <VaultSecurityTypeProvider value="secure">
      <SdkCreateSecureVaultFlow
        deviceCount={state?.deviceCount}
        keyImportInput={state?.keyImportInput}
      />
    </VaultSecurityTypeProvider>
  )
}
