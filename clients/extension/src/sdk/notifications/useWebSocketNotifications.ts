import { getVaultId } from '@core/mpc/vault/Vault'
import { parseDeeplink } from '@core/ui/deeplink/core'
import { useProcessSignTransactionMutation } from '@core/ui/deeplink/mutations/useProcessSignTransactionMutation'
import { useCurrentVault } from '@core/ui/vault/state/currentVault'
import type { SigningNotification } from '@vultisig/sdk'
import { useCallback, useEffect, useRef } from 'react'

import { useVultisigSdk } from '../VultisigSdkProvider'

const DEVICE_TOKEN_KEY = 'vultisig_push_device_token'

/**
 * Maintains a WebSocket connection for real-time signing notifications
 * while the popup is open.
 *
 * When a notification arrives (another device initiated signing),
 * parses the deeplink and navigates to the join keysign flow.
 *
 * Lifecycle:
 * - Popup opens → connect WebSocket
 * - Notification received → parse deeplink → navigate to joinKeysign
 * - Popup closes → disconnect WebSocket
 *
 * The server persists messages in Redis Streams (60s TTL) and re-delivers
 * unacked messages on reconnect, so brief disconnections are safe.
 */
export const useWebSocketNotifications = () => {
  const sdk = useVultisigSdk()
  const vault = useCurrentVault()
  const vaultId = getVaultId(vault)
  const partyName = vault.localPartyId
  const { mutate: processSignTransaction } =
    useProcessSignTransactionMutation()
  const processRef = useRef(processSignTransaction)
  processRef.current = processSignTransaction

  const handleNotification = useCallback(
    async (notification: SigningNotification) => {
      try {
        const parsed = await parseDeeplink(notification.qrCodeData)

        if ('signTransaction' in parsed) {
          processRef.current(parsed.signTransaction)
        }
      } catch (error) {
        console.warn(
          '[Vultisig] Failed to process signing notification:',
          error
        )
      }
    },
    []
  )

  useEffect(() => {
    let cancelled = false

    const connect = async () => {
      // Get the device token (same one used for registration)
      const result = await chrome.storage.local.get(DEVICE_TOKEN_KEY)
      const token = result[DEVICE_TOKEN_KEY]
      if (!token || cancelled) return

      // Register signing request handler
      const unsubscribe = sdk.notifications.onSigningRequest(
        (notification) => {
          handleNotification(notification)
        }
      )

      // Connect WebSocket
      sdk.notifications.connect({ vaultId, partyName, token })

      // Return cleanup via cancelled flag check
      return unsubscribe
    }

    let unsubscribe: (() => void) | undefined

    connect()
      .then((unsub) => {
        if (cancelled) {
          unsub?.()
          sdk.notifications.disconnect()
        } else {
          unsubscribe = unsub
        }
      })
      .catch((error) => {
        console.warn(
          '[Vultisig] Failed to connect WebSocket notifications:',
          error
        )
      })

    return () => {
      cancelled = true
      unsubscribe?.()
      sdk.notifications.disconnect()
    }
  }, [sdk, vaultId, partyName, handleNotification])
}
