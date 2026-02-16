import type { Vault } from '@core/mpc/vault/Vault'
import { getVaultId } from '@core/mpc/vault/Vault'
import { decryptVaultAllKeyShares } from '@core/ui/passcodeEncryption/core/vaultKeyShares'
import type { Vultisig, VaultBase } from '@vultisig/sdk'

import { createVultContent } from './createVultContent'

/**
 * Bridges extension Vault objects to SDK VaultBase instances.
 *
 * The extension stores vaults as raw Vault objects (with keyShares).
 * The SDK expects .vult file content (protobuf → base64).
 * This bridge converts between the two, caching hydrated vaults by ID.
 */
export class VaultBridge {
  private readonly sdk: Vultisig
  private readonly cache = new Map<string, VaultBase>()

  constructor(sdk: Vultisig) {
    this.sdk = sdk
  }

  /**
   * Hydrate an extension vault into an SDK VaultBase instance.
   *
   * 1. Check cache for already-hydrated vault
   * 2. If passcode is set, decrypt keyShares first
   * 3. Generate .vult content from the vault
   * 4. Import into SDK via sdk.importVault()
   * 5. Cache and return the VaultBase instance
   *
   * @param vault - Extension vault object
   * @param options.passcode - Passcode to decrypt keyShares (if encrypted)
   * @param options.vaultPassword - Password to encrypt the .vult file (for fast vaults)
   */
  async hydrateVault(
    vault: Vault,
    options?: { passcode?: string; vaultPassword?: string }
  ): Promise<VaultBase> {
    const vaultId = getVaultId(vault)

    const cached = this.cache.get(vaultId)
    if (cached) {
      return cached
    }

    // Decrypt keyShares if passcode is active
    let resolvedVault = vault
    if (options?.passcode) {
      const decrypted = decryptVaultAllKeyShares({
        keyShares: vault.keyShares,
        chainKeyShares: vault.chainKeyShares,
        key: options.passcode,
      })
      resolvedVault = { ...vault, ...decrypted }
    }

    // Convert to .vult content
    const vultContent = createVultContent(resolvedVault, options?.vaultPassword)

    // Import into SDK (saves to SDK storage + creates VaultBase)
    const sdkVault = await this.sdk.importVault(
      vultContent,
      options?.vaultPassword
    )

    this.cache.set(vaultId, sdkVault)
    return sdkVault
  }

  /**
   * Get a cached vault instance without re-hydrating.
   */
  getCached(vaultId: string): VaultBase | undefined {
    return this.cache.get(vaultId)
  }

  /**
   * Invalidate a cached vault (e.g., after vault update or deletion).
   */
  invalidate(vaultId: string): void {
    this.cache.delete(vaultId)
  }

  /**
   * Clear all cached vaults.
   */
  clear(): void {
    this.cache.clear()
  }
}
