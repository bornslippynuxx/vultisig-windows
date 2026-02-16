import { create, toBinary } from '@bufbuild/protobuf'
import { toCommVault } from '@core/mpc/types/utils/commVault'
import { VaultContainerSchema } from '@core/mpc/types/vultisig/vault/v1/vault_container_pb'
import { VaultSchema } from '@core/mpc/types/vultisig/vault/v1/vault_pb'
import type { Vault } from '@core/mpc/vault/Vault'
import { encryptWithAesGcm } from '@lib/utils/encryption/aesGcm/encryptWithAesGcm'

/**
 * Converts an extension Vault to base64-encoded .vult file content.
 * Pure function — replicates createBackup() from useBackupVaultMutation.ts
 * without React hooks.
 *
 * @param vault - Extension vault (must have decrypted keyShares if passcode-encrypted)
 * @param password - Optional password to encrypt the .vult content
 * @returns Base64-encoded .vult file content ready for sdk.importVault()
 */
export const createVultContent = (
  vault: Vault,
  password?: string
): string => {
  const commVault = toCommVault(vault)
  const vaultData = toBinary(VaultSchema, commVault)

  const vaultContainer = create(VaultContainerSchema, {
    version: BigInt(1),
    vault: Buffer.from(vaultData).toString('base64'),
  })

  if (password) {
    vaultContainer.isEncrypted = true
    const encryptedVault = encryptWithAesGcm({
      key: password,
      value: Buffer.from(vaultData),
    })
    vaultContainer.vault = encryptedVault.toString('base64')
  } else {
    vaultContainer.isEncrypted = false
  }

  const vaultContainerData = toBinary(VaultContainerSchema, vaultContainer)
  return Buffer.from(vaultContainerData).toString('base64')
}
