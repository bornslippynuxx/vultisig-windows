import { useCurrentVaultId } from '@core/ui/storage/currentVaultId'
import { useEffect, useRef } from 'react'

import { useSetSdkVault } from '../SdkVaultProvider'
import { useVaultBridge } from './useVaultBridge'

/**
 * Syncs SDK vault state with the extension's current vault selection.
 *
 * When the user switches vaults, this clears the SDK vault context
 * and invalidates the bridge cache so stale data isn't reused.
 * Individual flows (signing, creation) hydrate the SDK vault on demand
 * with the appropriate credentials.
 */
export const useSdkVaultSync = () => {
  const currentVaultId = useCurrentVaultId()
  const setSdkVault = useSetSdkVault()
  const bridge = useVaultBridge()
  const prevVaultIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (currentVaultId !== prevVaultIdRef.current) {
      if (prevVaultIdRef.current) {
        bridge.invalidate(prevVaultIdRef.current)
      }
      setSdkVault(null)
      prevVaultIdRef.current = currentVaultId
    }
  }, [currentVaultId, bridge, setSdkVault])
}
