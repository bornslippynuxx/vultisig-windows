import { TxHashProvider } from '@core/ui/chain/state/txHash'
import { TxOverviewPanel } from '@core/ui/chain/tx/TxOverviewPanel'
import { TxOverviewChainDataRow } from '@core/ui/chain/tx/TxOverviewRow'
import { FullPageFlowErrorState } from '@core/ui/flow/FullPageFlowErrorState'
import { useKeysignMutation } from '@core/ui/mpc/keysign/action/mutations/useKeysignMutation'
import { KeysignCustomMessageInfo } from '@core/ui/mpc/keysign/custom/KeysignCustomMessageInfo'
import { KeysignSigningState } from '@core/ui/mpc/keysign/flow/KeysignSigningState'
import { useKeysignMessagePayload } from '@core/ui/mpc/keysign/state/keysignMessagePayload'
import { KeysignTxOverview } from '@core/ui/mpc/keysign/tx/KeysignTxOverview'
import { SwapKeysignTxOverview } from '@core/ui/mpc/keysign/tx/swap/SwapKeysignTxOverview'
import { TxSuccess } from '@core/ui/mpc/keysign/tx/TxSuccess'
import { useCore } from '@core/ui/state/core'
import { MatchRecordUnion } from '@lib/ui/base/MatchRecordUnion'
import { StepTransition } from '@lib/ui/base/StepTransition'
import { Button } from '@lib/ui/buttons/Button'
import { VStack } from '@lib/ui/layout/Stack'
import { PageContent } from '@lib/ui/page/PageContent'
import { PageFooter } from '@lib/ui/page/PageFooter'
import { PageHeader } from '@lib/ui/page/PageHeader'
import { MatchQuery } from '@lib/ui/query/components/MatchQuery'
import { FramedQrCode } from '@lib/ui/qr/FramedQrCode'
import { Text } from '@lib/ui/text'
import { getLastItem } from '@lib/utils/array/getLastItem'
import { getRecordUnionValue } from '@lib/utils/record/union/getRecordUnionValue'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { useSecureSigningState } from './SdkSecureKeysignFlow'

/**
 * Secure vault keysign signing step with QR-aware pending state.
 *
 * Fork of KeysignSigningStep that replaces the pending spinner with:
 * - QR code display when waiting for paired device(s) to join
 * - Device join progress indicator
 * - Standard signing spinner once all devices have joined
 *
 * Success and error rendering is identical to KeysignSigningStep.
 */
export const SdkSecureKeysignSigningStep = () => {
  const { t } = useTranslation()
  const { version, goHome } = useCore()
  const payload = useKeysignMessagePayload()
  const { mutate: startKeysign, ...mutationStatus } =
    useKeysignMutation(payload)
  const { qrPayload, deviceProgress, phase } = useSecureSigningState()

  useEffect(startKeysign, [startKeysign])

  return (
    <MatchQuery
      value={mutationStatus}
      success={result => (
        <>
          <PageHeader title={t('overview')} hasBorder />
          <MatchRecordUnion
            value={payload}
            handlers={{
              keysign: payload => {
                const { swapPayload } = payload
                const isSwapTx = swapPayload && swapPayload.value
                const txs = getRecordUnionValue(result, 'txs')

                return (
                  <TxHashProvider value={getLastItem(txs).hash}>
                    {isSwapTx ? (
                      <PageContent alignItems="center" scrollable>
                        <SwapKeysignTxOverview
                          txHashes={txs.map(tx => tx.hash)}
                          value={payload}
                        />
                      </PageContent>
                    ) : (
                      <StepTransition
                        from={({ onFinish: onSeeTxDetails }) => (
                          <>
                            <PageContent alignItems="center" scrollable>
                              <VStack gap={16} maxWidth={576} fullWidth>
                                <TxSuccess
                                  value={payload}
                                  onSeeTxDetails={onSeeTxDetails}
                                />
                              </VStack>
                            </PageContent>
                            <PageFooter alignItems="center">
                              <VStack maxWidth={576} fullWidth>
                                <Button onClick={goHome}>{t('done')}</Button>
                              </VStack>
                            </PageFooter>
                          </>
                        )}
                        to={() => (
                          <>
                            <PageContent alignItems="center" scrollable>
                              <VStack gap={16} maxWidth={576} fullWidth>
                                <KeysignTxOverview />
                              </VStack>
                            </PageContent>
                            <PageFooter alignItems="center">
                              <VStack maxWidth={576} fullWidth>
                                <Button onClick={goHome}>
                                  {t('complete')}
                                </Button>
                              </VStack>
                            </PageFooter>
                          </>
                        )}
                      />
                    )}
                  </TxHashProvider>
                )
              },
              custom: payload => (
                <>
                  <PageContent scrollable>
                    <TxOverviewPanel>
                      <KeysignCustomMessageInfo value={payload} />
                      <TxOverviewChainDataRow>
                        <span>{t('signature')}</span>
                        <span>{getRecordUnionValue(result, 'signature')}</span>
                      </TxOverviewChainDataRow>
                    </TxOverviewPanel>
                  </PageContent>
                  <PageFooter>
                    <Button onClick={goHome}>{t('complete')}</Button>
                  </PageFooter>
                </>
              ),
            }}
          />
        </>
      )}
      error={error => (
        <FullPageFlowErrorState error={error} title={t('signing_error')} />
      )}
      pending={() => (
        <>
          <PageHeader
            title={
              phase === 'waiting_for_devices'
                ? t('scan_qr')
                : t('keysign')
            }
            hasBorder
          />
          <PageContent scrollable>
            {phase === 'waiting_for_devices' && qrPayload ? (
              <VStack
                flexGrow
                alignItems="center"
                justifyContent="center"
                gap={24}
              >
                <FramedQrCode value={qrPayload} />
                <Text color="supporting" size={14}>
                  {t('devices_on_same_wifi')}
                </Text>
                {deviceProgress.required > 0 && (
                  <Text weight="500" size={16} color="contrast">
                    {deviceProgress.joined}/{deviceProgress.required}{' '}
                    {t('devices')}
                  </Text>
                )}
              </VStack>
            ) : (
              <KeysignSigningState />
            )}
          </PageContent>
          <PageFooter alignItems="center">
            <Text color="shy" size={12}>
              {t('version')} {version}
            </Text>
          </PageFooter>
        </>
      )}
    />
  )
}
