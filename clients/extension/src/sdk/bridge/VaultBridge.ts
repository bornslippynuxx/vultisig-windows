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
 * Uses SDK storage as the source of truth for vault data (including keyShares).
 * When a vault is imported via SdkImportVaultPage, the full .vult content
 * (with keyShares) is stored in SDK's ChromeExtensionStorage. This bridge
 * loads from SDK storage first, falling back to re-creating .vult content
 * from the extension vault only if the vault isn't found in SDK storage.
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
   * 2. Try loading from SDK storage (source of truth, has full keyShares)
   * 3. If not in SDK storage, fall back to creating .vult from extension vault
   * 4. Cache and return the VaultBase instance
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

    // Try to load from SDK storage first (has full keyShares from original import)
    const existingVault = await this.sdk.getVaultById(vaultId)

    if (existingVault) {
      if (options?.vaultPassword) {
        // Re-import with password using stored .vult content (has real keyShares)
        const storedVultContent = existingVault.data.vultFileContent
        const sdkVault = await this.sdk.importVault(
          storedVultContent,
          options.vaultPassword
        )
        this.cache.set(vaultId, { vault: sdkVault, hasPassword: true })
        return sdkVault
      }

      this.cache.set(vaultId, { vault: existingVault, hasPassword: false })
      return existingVault
    }

    // Fallback: create .vult from extension vault (only works if keyShares present)
    let resolvedVault = vault
    if (options?.passcode) {
      const decrypted = decryptVaultAllKeyShares({
        keyShares: vault.keyShares,
        chainKeyShares: vault.chainKeyShares,
        key: options.passcode,
      })
      resolvedVault = { ...vault, ...decrypted }
    }

    const vultContent = createVultContent(resolvedVault, options?.vaultPassword)

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
