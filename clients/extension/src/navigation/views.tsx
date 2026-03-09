import { DappsButton } from '@clients/extension/src/components/dapps-button/DappsButton'
import { ExtensionDeveloperOptions } from '@clients/extension/src/components/developer-options'
import { ExpandView } from '@clients/extension/src/components/expand-view'
import { ExpandViewGuard } from '@clients/extension/src/components/expand-view-guard'
import { Prioritize } from '@clients/extension/src/components/prioritize'
import { SdkSetupFastVaultPage } from '@clients/extension/src/sdk/vault/SdkSetupFastVaultPage'
import { SdkSetupSecureVaultPage } from '@clients/extension/src/sdk/keygen/SdkSetupSecureVaultPage'
import { SdkReshareFastVault } from '@clients/extension/src/sdk/reshare/SdkReshareFastVault'
import { SdkReshareSecureVault } from '@clients/extension/src/sdk/reshare/SdkReshareSecureVault'
import { SingleKeygenFastVault } from '@clients/extension/src/components/settings/singleKeygen/SingleKeygenFastVault'
import { SingleKeygenSecureVault } from '@clients/extension/src/components/settings/singleKeygen/SingleKeygenSecureVault'
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
import { SdkImportSeedphrasePage } from '../sdk/pages/vault/import/seedphrase/SdkImportSeedphrasePage'
import { useNavigate } from '@lib/ui/navigation/hooks/useNavigate'
import { Views } from '@lib/ui/navigation/Views'
import { useEffect } from 'react'

import { ManageSidePanel } from '../components/side-panel/ManageSidePanel'

import { VaultPage } from '../sdk/pages/vault/page/components/VaultPage'
import { SdkVaultBackupFlow } from '../sdk/pages/vault/backup/SdkVaultBackupFlow'
import { SdkManageVaultChainsPage } from '../sdk/pages/vault/chain/SdkManageVaultChainsPage'
import { SdkManageVaultChainCoinsPage } from '../sdk/pages/vault/chain/coin/SdkManageVaultChainCoinsPage'
import { SdkImportVaultPage } from '../sdk/pages/vault/import/SdkImportVaultPage'
import { SdkSignCustomMessagePage } from '../sdk/pages/vault/keysign/SdkSignCustomMessagePage'
import { SdkSendPage } from '../sdk/pages/vault/send/SdkSendPage'
import { SdkSwapPage } from '../sdk/pages/vault/swap/SdkSwapPage'
import { SdkDeleteVaultPage } from '../sdk/pages/vault/settings/SdkDeleteVaultPage'
import { SdkVaultRenamePage } from '../sdk/pages/vault/settings/SdkVaultRenamePage'
import { SdkAddressBookPage } from '../sdk/pages/addressBook/SdkAddressBookPage'
import { SdkCreateAddressBookItemPage } from '../sdk/pages/addressBook/SdkCreateAddressBookItemPage'
import { SdkUpdateAddressBookItemPage } from '../sdk/pages/addressBook/SdkUpdateAddressBookItemPage'

const ExtensionVaultPage = () => {
  const vaults = useVaults()
  const currentVaultId = useCurrentVaultId()
  const navigate = useNavigate()

  useEffect(() => {
    if (vaults.length === 0) {
      navigate({ id: 'newVault' }, { replace: true })
    }
  }, [vaults.length, navigate])

  if (vaults.length === 0) return null
  if (!vaults.some(v => getVaultId(v) === currentVaultId)) return null

  return <VaultPage primaryControls={<DappsButton />} />
}

const appCustomViews: Views<Exclude<AppViewId, SharedViewId>> = {
  connectedDapps: ConnectedDappsPage,
  importSeedphrase: SdkImportSeedphrasePage,
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
  singleKeygenFast: SingleKeygenFastVault,
  singleKeygenSecure: SingleKeygenSecureVault,
  settings: () => (
    <SettingsPage
      insiderOptions={<ExtensionDeveloperOptions />}
      prioritize={<Prioritize />}
      expandView={<ExpandView />}
      sidePanel={<ManageSidePanel />}
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
  swap: SdkSwapPage, // SDK-backed swap flow (payload construction)
  addressBook: SdkAddressBookPage, // SDK-backed address book list
  createAddressBookItem: SdkCreateAddressBookItemPage, // SDK-backed address book create
  updateAddressBookItem: SdkUpdateAddressBookItemPage, // SDK-backed address book update
}
