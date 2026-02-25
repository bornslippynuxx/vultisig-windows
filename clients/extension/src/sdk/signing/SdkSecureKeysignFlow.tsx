import type { KeysignSignature } from '@core/mpc/keysign/KeysignSignature'
import {
  KeysignAction,
  KeysignActionProvider as BaseKeysignActionProvider,
} from '@core/ui/mpc/keysign/action/state/keysignAction'
import { KeysignMessagePayloadProvider } from '@core/ui/mpc/keysign/state/keysignMessagePayload'
import { useCoreViewState } from '@core/ui/navigation/hooks/useCoreViewState'
import { useCurrentVault } from '@core/ui/vault/state/currentVault'
import { chainPromises } from '@lib/utils/promise/chainPromises'
import type { Signature, VaultBase } from '@vultisig/sdk'
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react'

import { useSdkVault } from '../SdkVaultProvider'
import { useVaultBridge } from '../bridge/useVaultBridge'

import { toKeysignSignature } from './convertSignature'
import { SdkSecureKeysignSigningStep } from './SdkSecureKeysignSigningStep'

export type SecureSigningPhase =
  | 'preparing'
  | 'waiting_for_devices'
  | 'signing'

export type SecureSigningState = {
  qrPayload: string | null
  deviceProgress: { joined: number; required: number }
  phase: SecureSigningPhase
}

const SecureSigningStateContext = createContext<SecureSigningState>({
  qrPayload: null,
  deviceProgress: { joined: 0, required: 0 },
  phase: 'preparing',
})

export const useSecureSigningState = () => useContext(SecureSigningStateContext)

/**
 * SDK-backed secure vault keysign flow.
 *
 * Uses vault.sign() with all message hashes in a single relay session,
 * avoiding multiple QR scans for multi-message transactions (e.g., UTXO).
 *
 * The vault events (qrCodeReady, deviceJoined) drive the UI phases:
 *   preparing → waiting_for_devices (QR displayed) → signing → success/error
 */
export const SdkSecureKeysignFlow = () => {
  const [{ keysignPayload }] = useCoreViewState<'keysign'>()
  const vault = useCurrentVault()
  const sdkVault = useSdkVault()
  const bridge = useVaultBridge()
  const sdkVaultRef = useRef<VaultBase | null>(sdkVault)

  const [signingState, setSigningState] = useState<SecureSigningState>({
    qrPayload: null,
    deviceProgress: { joined: 0, required: 0 },
    phase: 'preparing',
  })

  // Ref to the keysign payload for passing as QR context
  const keysignPayloadRef = useRef(keysignPayload)

  const keysignAction: KeysignAction = useCallback(
    async ({ msgs, chain }) => {
      // Lazily hydrate the vault (no password needed for secure vaults —
      // the extension vault already has keyShares in memory)
      if (!sdkVaultRef.current) {
        sdkVaultRef.current = await bridge.hydrateVault(vault)
      }
      const v = sdkVaultRef.current

      setSigningState(prev => ({ ...prev, phase: 'waiting_for_devices' }))

      // Register event listeners for QR and device progress
      const unsubQr = v.on('qrCodeReady', ({ qrPayload }) => {
        setSigningState(prev => ({
          ...prev,
          qrPayload,
          phase: 'waiting_for_devices',
        }))
      })
      const unsubDevice = v.on(
        'deviceJoined',
        ({ totalJoined, required }) => {
          setSigningState(prev => ({
            ...prev,
            deviceProgress: { joined: totalJoined, required },
            phase:
              totalJoined >= required ? 'signing' : 'waiting_for_devices',
          }))
        }
      )

      try {
        // Extract KeysignPayload protobuf for QR context (so mobile
        // app can show transaction details when scanning)
        const msgPayload = keysignPayloadRef.current
        const transaction =
          'keysign' in msgPayload ? msgPayload.keysign : undefined

        // Sign ALL messages in a single relay session via vault.sign()
        const signature = await v.sign({
          chain,
          messageHashes: msgs,
          transaction,
        })

        // Convert SDK Signature → extension KeysignSignature[]
        return sdkSignatureToKeysignSignatures(signature, msgs)
      } finally {
        unsubQr()
        unsubDevice()
      }
    },
    [vault, bridge]
  )

  return (
    <SecureSigningStateContext.Provider value={signingState}>
      <BaseKeysignActionProvider value={keysignAction}>
        <KeysignMessagePayloadProvider value={keysignPayload}>
          <SdkSecureKeysignSigningStep />
        </KeysignMessagePayloadProvider>
      </BaseKeysignActionProvider>
    </SecureSigningStateContext.Provider>
  )
}

/**
 * Convert an SDK Signature into extension KeysignSignature[].
 *
 * For single-message transactions (EVM, Solana, Cosmos): uses the
 * primary signature fields including recovery ID.
 *
 * For multi-message transactions (UTXO): uses the per-message signatures
 * array. Recovery ID is not available per-message, but UTXO compilation
 * only needs the DER signature.
 */
function sdkSignatureToKeysignSignatures(
  signature: Signature,
  msgs: string[]
): KeysignSignature[] {
  // Single message — use the standard converter (preserves recovery ID)
  if (msgs.length === 1) {
    return [toKeysignSignature(signature, msgs[0])]
  }

  // Multi-message — use per-message signatures array from vault.sign()
  if (!signature.signatures || signature.signatures.length !== msgs.length) {
    throw new Error(
      `Expected ${msgs.length} signatures but got ${signature.signatures?.length ?? 0}`
    )
  }

  return msgs.map((msg, i) => ({
    msg: Buffer.from(msg, 'hex').toString('base64'),
    r: signature.signatures![i].r,
    s: signature.signatures![i].s,
    der_signature: signature.signatures![i].der,
    // recovery_id not needed per-message for UTXO (uses DER for compilation)
  }))
}
