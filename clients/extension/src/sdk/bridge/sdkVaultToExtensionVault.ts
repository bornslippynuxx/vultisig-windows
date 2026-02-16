import type { MpcLib } from '@core/mpc/mpcLib'
import type { Vault } from '@core/mpc/vault/Vault'
import type { VaultBase } from '@vultisig/sdk'

import { hasServer } from '@core/mpc/devices/localPartyId'

/**
 * Convert an SDK VaultBase instance to the extension's Vault type.
 *
 * Since the SDK manages keyShares internally (encrypted in .vult content),
 * the extension Vault is created with empty keyShares. This is safe because:
 * - Signing goes through the SDK's signBytes() (SdkKeysignActionProvider)
 * - Backup uses the SDK's .vultFileContent directly
 *
 * @param sdkVault - VaultBase instance (FastVault or SecureVault)
 * @param order - Display order for the vault list
 * @returns Extension Vault object ready for storage
 */
export function sdkVaultToExtensionVault(
  sdkVault: VaultBase,
  order: number
): Vault {
  const data = sdkVault.data

  return {
    name: data.name,
    publicKeys: { ecdsa: data.publicKeys.ecdsa, eddsa: data.publicKeys.eddsa },
    signers: [...data.signers],
    createdAt: data.createdAt,
    hexChainCode: data.hexChainCode,
    keyShares: {
      ecdsa: '',
      eddsa: '',
    },
    localPartyId: data.localPartyId,
    resharePrefix: undefined,
    libType: data.libType as MpcLib,
    isBackedUp: false,
    order,
    lastPasswordVerificationTime: hasServer([...data.signers])
      ? Date.now()
      : undefined,
    chainPublicKeys: data.chainPublicKeys
      ? { ...data.chainPublicKeys }
      : undefined,
    chainKeyShares: data.chainKeyShares
      ? { ...data.chainKeyShares }
      : undefined,
  }
}
