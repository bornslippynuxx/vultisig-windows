import { DappsButton } from '@clients/extension/src/components/dapps-button/DappsButton'
import { ExtensionDeveloperOptions } from '@clients/extension/src/components/developer-options'
import { ExpandView } from '@clients/extension/src/components/expand-view'
import { ExpandViewGuard } from '@clients/extension/src/components/expand-view-guard'
import { Prioritize } from '@clients/extension/src/components/prioritize'
import { ReshareFastVault } from '@clients/extension/src/components/settings/reshare/ReshareFastVault'
import { ReshareSecureVault } from '@clients/extension/src/components/settings/reshare/ReshareSecureVault'
import { SdkSetupFastVaultPage } from '@clients/extension/src/sdk/vault/SdkSetupFastVaultPage'
import { SetupSecureVaultPage } from '@clients/extension/src/components/setup/SetupSecureVaultPage'
import { JoinKeygenPage } from '@clients/extension/src/mpc/keygen/join/JoinKeygenPage'
import { JoinKeysignPage } from '@clients/extension/src/mpc/keysign/join/JoinKeysignPage'
import { AppViewId } from '@clients/extension/src/navigation/AppView'
import { ConnectedDappsPage } from '@clients/extension/src/pages/connected-dapps'
import { SetupVaultPageController } from '@clients/extension/src/pages/setup-vault/SetupVaultPageController'
import { SdkStartKeysignView } from '@clients/extension/src/sdk/signing/SdkStartKeysignView'
import { getVaultId } from '@core/mpc/vault/Vault'
import { SharedViewId, sharedViews } from '@core/ui/navigation/sharedViews'
import { OnboardingPage } from '@core/ui/onboarding/components/OnboardingPage'
import { IncompleteOnboardingOnly } from '@core/ui/onboarding/IncompleteOnboardingOnly'
import { ResponsivenessProvider } from '@core/ui/providers/ResponsivenessProvider'
import { SettingsPage } from '@core/ui/settings'
import { useCurrentVaultId } from '@core/ui/storage/currentVaultId'
import { useVaults } from '@core/ui/storage/vaults'
import { ImportVaultPage } from '@core/ui/vault/import/components/ImportVaultPage'
import { ImportSeedphrasePage } from '@core/ui/vault/import/seedphrase/ImportSeedphrasePage'
import { Views } from '@lib/ui/navigation/Views'

import { VaultPage } from '../sdk/pages/vault/page/components/VaultPage'

const ExtensionVaultPage = () => {
  const vaults = useVaults()
  const currentVaultId = useCurrentVaultId()
  if (!vaults.some(v => getVaultId(v) === currentVaultId)) return null
  return <VaultPage primaryControls={<DappsButton />} />
}

const appCustomViews: Views<Exclude<AppViewId, SharedViewId>> = {
  connectedDapps: ConnectedDappsPage,
  importSeedphrase: ImportSeedphrasePage,
  importVault: () => (
    <ExpandViewGuard>
      <ImportVaultPage />
    </ExpandViewGuard>
  ),
  joinKeygen: JoinKeygenPage,
  joinKeysign: JoinKeysignPage,
  keysign: SdkStartKeysignView,
  migrateVault: () => null,
  onboarding: () => (
    <IncompleteOnboardingOnly>
      <OnboardingPage />
    </IncompleteOnboardingOnly>
  ),
  reshareVaultFast: ReshareFastVault,
  reshareVaultSecure: ReshareSecureVault,
  settings: () => (
    <SettingsPage
      insiderOptions={<ExtensionDeveloperOptions />}
      prioritize={<Prioritize />}
      expandView={<ExpandView />}
    />
  ),
  setupFastVault: SdkSetupFastVaultPage,
  setupSecureVault: SetupSecureVaultPage,
  setupVault: () => (
    <ExpandViewGuard>
      <ResponsivenessProvider>
        <SetupVaultPageController />
      </ResponsivenessProvider>
    </ExpandViewGuard>
  ),
}

export const views: Views<AppViewId> = {
  ...sharedViews,
  ...appCustomViews,
  vault: ExtensionVaultPage, // Override the shared vault view
}
