import { DappsButton } from '@clients/extension/src/components/dapps-button/DappsButton'
import { ExtensionDeveloperOptions } from '@clients/extension/src/components/developer-options'
import { ExpandView } from '@clients/extension/src/components/expand-view'
import { ExpandViewGuard } from '@clients/extension/src/components/expand-view-guard'
import { Prioritize } from '@clients/extension/src/components/prioritize'
import { SdkSetupFastVaultPage } from '@clients/extension/src/sdk/vault/SdkSetupFastVaultPage'
import { SdkSetupSecureVaultPage } from '@clients/extension/src/sdk/keygen/SdkSetupSecureVaultPage'
import { SdkReshareFastVault } from '@clients/extension/src/sdk/reshare/SdkReshareFastVault'
import { SdkReshareSecureVault } from '@clients/extension/src/sdk/reshare/SdkReshareSecureVault'
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
import { ImportSeedphrasePage } from '@core/ui/vault/import/seedphrase/ImportSeedphrasePage'
import { Views } from '@lib/ui/navigation/Views'

import { VaultPage } from '../sdk/pages/vault/page/components/VaultPage'
import { SdkVaultBackupFlow } from '../sdk/pages/vault/backup/SdkVaultBackupFlow'
import { SdkManageVaultChainsPage } from '../sdk/pages/vault/chain/SdkManageVaultChainsPage'
import { SdkManageVaultChainCoinsPage } from '../sdk/pages/vault/chain/coin/SdkManageVaultChainCoinsPage'
import { SdkImportVaultPage } from '../sdk/pages/vault/import/SdkImportVaultPage'
import { SdkSignCustomMessagePage } from '../sdk/pages/vault/keysign/SdkSignCustomMessagePage'
import { SdkSendPage } from '../sdk/pages/vault/send/SdkSendPage'
import { SdkDeleteVaultPage } from '../sdk/pages/vault/settings/SdkDeleteVaultPage'
import { SdkVaultRenamePage } from '../sdk/pages/vault/settings/SdkVaultRenamePage'

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
      <SdkImportVaultPage />
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
  reshareVaultFast: SdkReshareFastVault,
  reshareVaultSecure: SdkReshareSecureVault,
  settings: () => (
    <SettingsPage
      insiderOptions={<ExtensionDeveloperOptions />}
      prioritize={<Prioritize />}
      expandView={<ExpandView />}
    />
  ),
  setupFastVault: SdkSetupFastVaultPage,
  setupSecureVault: SdkSetupSecureVaultPage,
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
  renameVault: SdkVaultRenamePage, // SDK-backed vault rename
  deleteVault: SdkDeleteVaultPage, // SDK-backed vault delete
  vaultBackup: SdkVaultBackupFlow, // SDK-backed vault backup
  manageVaultChains: SdkManageVaultChainsPage, // SDK-backed chain management
  manageVaultChainCoins: SdkManageVaultChainCoinsPage, // SDK-backed token management
  signCustomMessage: SdkSignCustomMessagePage, // SDK-backed custom message signing
  send: SdkSendPage, // SDK-backed send flow (payload construction)
}
