import {
  KeysignAction,
  KeysignActionProvider as BaseKeysignActionProvider,
} from '@core/ui/mpc/keysign/action/state/keysignAction'
import { useCoreViewState } from '@core/ui/navigation/hooks/useCoreViewState'
import { useCurrentVault } from '@core/ui/vault/state/currentVault'
import { ChildrenProp } from '@lib/ui/props'
import { chainPromises } from '@lib/utils/promise/chainPromises'
import type { VaultBase } from '@vultisig/sdk'
import { useCallback, useRef } from 'react'

import { useVaultBridge } from '../bridge/useVaultBridge'

import { toKeysignSignature } from './convertSignature'

/**
 * SDK-backed keysign action provider for fast vaults.
 *
 * Replaces the core KeysignActionProvider. Instead of managing MPC sessions
 * directly, delegates to the SDK's vault.signBytes() which handles server
 * coordination, relay, and MPC internally.
 *
 * The vault is lazily hydrated (extension Vault → .vult → SDK VaultBase)
 * on first sign request and cached for subsequent messages.
 */
export const SdkKeysignActionProvider = ({ children }: ChildrenProp) => {
  const vault = useCurrentVault()
  const [{ password }] = useCoreViewState<'keysign'>()
  const bridge = useVaultBridge()
  const sdkVaultRef = useRef<VaultBase | null>(null)

  const keysignAction: KeysignAction = useCallback(
    async ({ msgs, chain }) => {
      // Lazily hydrate the vault (cached by VaultBridge after first call)
      if (!sdkVaultRef.current) {
        sdkVaultRef.current = await bridge.hydrateVault(vault, {
          vaultPassword: password,
        })
      }
      const sdkVault = sdkVaultRef.current

      // Sign each message via SDK (each call creates its own MPC session)
      return chainPromises(
        msgs.map(
          msgHex => async () => {
            const signature = await sdkVault.signBytes({
              data: msgHex,
              chain,
            })
            return toKeysignSignature(signature, msgHex)
          }
        )
      )
    },
    [vault, password, bridge]
  )

  return (
    <BaseKeysignActionProvider value={keysignAction}>
      {children}
    </BaseKeysignActionProvider>
  )
}
