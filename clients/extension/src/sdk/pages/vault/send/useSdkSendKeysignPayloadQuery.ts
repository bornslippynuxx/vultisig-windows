import { FeeSettings } from '@core/mpc/keysign/chainSpecific/FeeSettings'
import { BuildKeysignPayloadError } from '@core/mpc/keysign/error'
import { useCurrentVault } from '@core/ui/vault/state/currentVault'
import { noRefetchQueryOptions } from '@lib/ui/query/utils/options'
import { shouldBePresent } from '@lib/utils/assert/shouldBePresent'
import { useQuery } from '@tanstack/react-query'

import { useSdkVault } from '../../../SdkVaultProvider'
import { useVaultBridge } from '../../../bridge/useVaultBridge'
import { useSendAmount } from '@core/ui/vault/send/state/amount'
import { useSendMemo } from '@core/ui/vault/send/state/memo'
import { useSendReceiver } from '@core/ui/vault/send/state/receiver'
import { useCurrentSendCoin } from '@core/ui/vault/send/state/sendCoin'

type UseSdkSendKeysignPayloadQueryProps = {
  feeSettings?: FeeSettings
}

export const useSdkSendKeysignPayloadQuery = ({
  feeSettings,
}: UseSdkSendKeysignPayloadQueryProps = {}) => {
  const coin = useCurrentSendCoin()
  const [receiver] = useSendReceiver()
  const [memo] = useSendMemo()
  const [amount] = useSendAmount()

  const vault = useCurrentVault()
  const sdkVault = useSdkVault()
  const bridge = useVaultBridge()

  return useQuery({
    queryKey: [
      'sdkSendTxKeysignPayload',
      coin,
      receiver,
      amount?.toString(),
      memo,
      feeSettings,
    ],
    queryFn: async () => {
      const v = sdkVault ?? (await bridge.hydrateVault(vault))
      return v.prepareSendTx({
        coin,
        receiver,
        amount: shouldBePresent(amount),
        memo,
        feeSettings,
      })
    },
    ...noRefetchQueryOptions,
    retry: (failureCount, error) => {
      if (error instanceof BuildKeysignPayloadError) return false
      // SDK wraps BuildKeysignPayloadError in VaultError as cause
      if ((error as Error)?.cause instanceof BuildKeysignPayloadError)
        return false
      return failureCount < 3
    },
  })
}
