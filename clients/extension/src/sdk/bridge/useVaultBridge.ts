import { useMemo } from 'react'

import { useVultisigSdk } from '../VultisigSdkProvider'

import { VaultBridge } from './VaultBridge'

/**
 * React hook returning a memoized VaultBridge instance.
 * Stable across re-renders — only recreated if the SDK instance changes.
 */
export const useVaultBridge = (): VaultBridge => {
  const sdk = useVultisigSdk()
  return useMemo(() => new VaultBridge(sdk), [sdk])
}
