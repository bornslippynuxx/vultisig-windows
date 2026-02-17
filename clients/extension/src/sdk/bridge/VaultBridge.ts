import type { Vault } from '@core/mpc/vault/Vault'
import { getVaultId } from '@core/mpc/vault/Vault'
import { decryptVaultAllKeyShares } from '@core/ui/passcodeEncryption/core/vaultKeyShares'
import type { Vultisig, VaultBase } from '@vultisig/sdk'

import { createVultContent } from './createVultContent'

type CacheEntry = {
  vault: VaultBase
  hasPassword: boolean
}

/**
 * Bridges extension Vault objects to SDK VaultBase instances.
 *
 * The extension stores vaults as raw Vault objects (with keyShares).
 * The SDK expects .vult file content (protobuf → base64).
 * This bridge converts between the two, caching hydrated vaults by ID.
 *
 * Cache tracks whether the vault was hydrated with a password.
 * Password-less hydration supports read-only operations (balance, address).
 * Signing flows re-hydrate with password when needed.
 */
export class VaultBridge {
  private readonly sdk: Vultisig
  private readonly cache = new Map<string, CacheEntry>()

  constructor(sdk: Vultisig) {
    this.sdk = sdk
  }

  /**
   * Hydrate an extension vault into an SDK VaultBase instance.
   *
   * 1. Check cache — return if cached with sufficient credentials
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
    const requestsPassword = !!(options?.passcode || options?.vaultPassword)

    const cached = this.cache.get(vaultId)
    if (cached && (!requestsPassword || cached.hasPassword)) {
      return cached.vault
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

    this.cache.set(vaultId, { vault: sdkVault, hasPassword: requestsPassword })
    return sdkVault
  }

  /**
   * Get a cached vault instance without re-hydrating.
   */
  getCached(vaultId: string): VaultBase | undefined {
    return this.cache.get(vaultId)?.vault
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
