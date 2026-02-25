import { getVaultId } from '@core/mpc/vault/Vault'
import { useCore } from '@core/ui/state/core'
import { StorageKey } from '@core/ui/storage/StorageKey'
import { useVaults } from '@core/ui/storage/vaults'
import { useCurrentVault } from '@core/ui/vault/state/currentVault'
import { useRefetchQueries } from '@lib/ui/query/hooks/useRefetchQueries'
import { useMutation } from '@tanstack/react-query'

import { useSdkVault } from '../../../SdkVaultProvider'
import { useVaultBridge } from '../../../bridge/useVaultBridge'

export const useSdkBackupVaultMutation = ({
  onSuccess,
}: {
  onSuccess?: () => void
}) => {
  const currentVault = useCurrentVault()
  const sdkVault = useSdkVault()
  const bridge = useVaultBridge()
  const { saveFile, updateVault } = useCore()
  const refetchQueries = useRefetchQueries()
  const vaultId = getVaultId(currentVault)

  return useMutation({
    mutationFn: async ({ password }: { password?: string }) => {
      // Hydrate or use cached SDK vault
      const vault = sdkVault ?? (await bridge.hydrateVault(currentVault))

      // SDK export (handles serialization + optional encryption)
      const { filename, data } = await vault.export(password)

      // Download the backup file
      const blob = new Blob([data], { type: 'application/octet-stream' })
      await saveFile({ name: filename, blob })

      // Dual-write: mark as backed up in extension storage
      await updateVault({ vaultId, fields: { isBackedUp: true } })
      await refetchQueries([StorageKey.vaults])
    },
    onSuccess,
  })
}
