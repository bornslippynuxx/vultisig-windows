import { getVaultId } from '@core/mpc/vault/Vault'
import { useCurrentVault } from '@core/ui/vault/state/currentVault'
import { useEffect, useRef } from 'react'

import { useVultisigSdk } from '../VultisigSdkProvider'

const DEVICE_TOKEN_KEY = 'vultisig_push_device_token'

/**
 * Generates or retrieves a stable device token for push notification registration.
 * Stored in chrome.storage.local so it persists across popup sessions.
 */
async function getOrCreateDeviceToken(): Promise<string> {
  const result = await chrome.storage.local.get(DEVICE_TOKEN_KEY)
  if (result[DEVICE_TOKEN_KEY]) {
    return result[DEVICE_TOKEN_KEY]
  }
  const token = crypto.randomUUID()
  await chrome.storage.local.set({ [DEVICE_TOKEN_KEY]: token })
  return token
}

/**
 * Registers the current vault's device for push notifications.
 *
 * On mount and vault switch, calls sdk.notifications.registerDevice()
 * with the vault ID, party name, and a stable device token.
 * The server upserts on the composite key (vault_id, party_name, token),
 * so re-registration is idempotent.
 */
export const useNotificationRegistration = () => {
  const sdk = useVultisigSdk()
  const vault = useCurrentVault()
  const vaultId = getVaultId(vault)
  const partyName = vault.localPartyId
  const registeredRef = useRef<string | null>(null)

  useEffect(() => {
    // Skip if already registered for this vault
    if (registeredRef.current === vaultId) return

    let cancelled = false

    const register = async () => {
      try {
        const token = await getOrCreateDeviceToken()
        if (cancelled) return

        await sdk.notifications.registerDevice({
          vaultId,
          partyName,
          token,
          deviceType: 'web',
        })

        if (!cancelled) {
          registeredRef.current = vaultId
        }
      } catch (error) {
        // Non-fatal — notifications are supplementary
        console.warn('[Vultisig] Failed to register for notifications:', error)
      }
    }

    register()

    return () => {
      cancelled = true
    }
  }, [sdk, vaultId, partyName])
}
