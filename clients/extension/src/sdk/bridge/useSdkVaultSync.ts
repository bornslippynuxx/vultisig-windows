import { useCurrentVaultId } from '@core/ui/storage/currentVaultId'
import { useCurrentVault } from '@core/ui/vault/state/currentVault'
import { useEffect, useRef } from 'react'

import { useSetSdkVault } from '../SdkVaultProvider'
import { useVaultBridge } from './useVaultBridge'

/**
 * Syncs SDK vault state with the extension's current vault selection.
 *
 * When the user switches vaults, this:
 * 1. Invalidates the previous vault's cache
 * 2. Clears the SDK vault context
 * 3. Auto-hydrates the new vault (password-less for read-only operations)
 *
 * Password-less hydration enables balance, address, and value queries
 * via the SDK hooks layer. Signing flows upgrade to password-based
 * hydration on demand through VaultBridge.
 */
export const useSdkVaultSync = () => {
  const currentVaultId = useCurrentVaultId()
  const vault = useCurrentVault()
  const setSdkVault = useSetSdkVault()
  const bridge = useVaultBridge()
  const prevVaultIdRef = useRef<string | null>(null)

  // Keep a ref to the latest vault object so the effect
  // only re-runs on vault ID change, not vault reference change
  const vaultRef = useRef(vault)
  vaultRef.current = vault

  useEffect(() => {
    // Invalidate previous vault's cache
    if (prevVaultIdRef.current && currentVaultId !== prevVaultIdRef.current) {
      bridge.invalidate(prevVaultIdRef.current)
    }
    prevVaultIdRef.current = currentVaultId

    if (!currentVaultId) {
      setSdkVault(null)
      return
    }

    // Check if already cached (instant, no loading flash)
    const cached = bridge.getCached(currentVaultId)
    if (cached) {
      setSdkVault(cached)
      return
    }

    // Not cached — clear and hydrate asynchronously
    setSdkVault(null)

    let cancelled = false
    bridge
      .hydrateVault(vaultRef.current)
      .then(sdkVault => {
        if (!cancelled) setSdkVault(sdkVault)
      })
      .catch(() => {
        // Hydration may fail if keyShares are passcode-encrypted.
        // SDK vault stays null; signing flows will hydrate with password.
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVaultId, bridge, setSdkVault])
}
