import { useCurrentHexEncryptionKey } from '@core/ui/mpc/state/currentHexEncryptionKey'
import { useIsInitiatingDevice } from '@core/ui/mpc/state/isInitiatingDevice'
import { useMpcLocalPartyId } from '@core/ui/mpc/state/mpcLocalPartyId'
import { useMpcServerUrl } from '@core/ui/mpc/state/mpcServerUrl'
import { useMpcSessionId } from '@core/ui/mpc/state/mpcSession'
import {
  useKeygenVault,
  useKeygenVaultName,
} from '@core/ui/mpc/keygen/state/keygenVault'
import { useKeygenOperation } from '@core/ui/mpc/keygen/state/currentKeygenOperationType'
import {
  KeygenAction,
  KeygenActionProvider,
} from '@core/ui/mpc/keygen/state/keygenAction'
import { useDklsInboundSequenceNoState } from '@core/ui/mpc/keygen/reshare/state/dklsInboundSequenceNo'
import { useVaultOrders } from '@core/ui/storage/vaults'
import { ChildrenProp } from '@lib/ui/props'
import { getLastItemOrder } from '@lib/utils/order/getLastItemOrder'
import { useCallback } from 'react'

import { useVultisigSdk } from '../VultisigSdkProvider'

/**
 * SDK-backed keygen action provider for vault reshare.
 *
 * Replaces core's ReshareVaultKeygenActionProvider. Instead of running
 * DKLS/Schnorr directly, delegates to sdk.performReshare() which
 * encapsulates the same MPC logic in the SDK service layer.
 *
 * Works for both fast and secure vault reshares — the keygen action
 * (DKLS + Schnorr reshare) is identical; only the surrounding UI differs.
 */
export const SdkReshareKeygenActionProvider = ({
  children,
}: ChildrenProp) => {
  const sdk = useVultisigSdk()
  const serverUrl = useMpcServerUrl()
  const encryptionKeyHex = useCurrentHexEncryptionKey()
  const sessionId = useMpcSessionId()
  const localPartyId = useMpcLocalPartyId()
  const isInitiatingDevice = useIsInitiatingDevice()
  const keygenVault = useKeygenVault()
  const operation = useKeygenOperation()
  const vaultOrders = useVaultOrders()
  const vaultName = useKeygenVaultName()
  const [, setDklsInboundSequenceNo] = useDklsInboundSequenceNoState()

  const keygenAction: KeygenAction = useCallback(
    async ({ onStepChange, signers }) => {
      const existingVault =
        'existingVault' in keygenVault
          ? keygenVault.existingVault
          : undefined

      return sdk.performReshare({
        existingVault,
        operation,
        isInitiatingDevice,
        serverUrl,
        sessionId,
        localPartyId,
        signers,
        encryptionKeyHex,
        vaultName,
        vaultOrder: getLastItemOrder(vaultOrders),
        onStepChange,
        onDklsInboundSequenceNoChange: setDklsInboundSequenceNo,
      })
    },
    [
      sdk,
      keygenVault,
      operation,
      isInitiatingDevice,
      serverUrl,
      sessionId,
      localPartyId,
      encryptionKeyHex,
      vaultName,
      vaultOrders,
      setDklsInboundSequenceNo,
    ]
  )

  return (
    <KeygenActionProvider value={keygenAction}>
      {children}
    </KeygenActionProvider>
  )
}
