import {
  peerOption,
  peerOptionActive,
} from '@core/ui/mpc/devices/peers/option/PeerOptionContainer'
import { PeerPlaceholder } from '@core/ui/mpc/devices/peers/PeerPlaceholder'
import { PeersContainer } from '@core/ui/mpc/devices/peers/PeersContainer'
import { PeersManagerFrame } from '@core/ui/mpc/devices/peers/PeersManagerFrame'
import { PeersPageContentFrame } from '@core/ui/mpc/devices/peers/PeersPageContentFrame'
import { FlowPendingPageContent } from '@lib/ui/flow/FlowPendingPageContent'
import { VStack } from '@lib/ui/layout/Stack'
import { FitPageContent } from '@lib/ui/page/PageContent'
import { PageFormFrame } from '@lib/ui/page/PageFormFrame'
import { PageHeader } from '@lib/ui/page/PageHeader'
import { FramedQrCode } from '@lib/ui/qr/FramedQrCode'
import { Text } from '@lib/ui/text'
import { range } from '@lib/utils/array/range'
import type { VaultCreationStep } from '@vultisig/sdk'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

const ThisDeviceContainer = styled.div`
  ${peerOption}
  ${peerOptionActive}
  border-color: rgba(19, 200, 157, 0.25);
`

const JoinedDeviceContainer = styled.div`
  ${peerOption}
  ${peerOptionActive}
`

type Props = {
  qrPayload: string | null
  devicesJoined: number
  devicesRequired: number
  progress: VaultCreationStep | null
}

/**
 * Progress display for secure vault creation.
 *
 * Shows QR code with device list while waiting for peers to join,
 * then shows keygen progress once all devices are ready.
 * Layout matches the legacy KeygenPeerDiscoveryStep.
 */
export const SecureVaultCreationProgress = ({
  qrPayload,
  devicesJoined,
  devicesRequired,
  progress,
}: Props) => {
  const { t } = useTranslation()

  // Show keygen progress once keygen has started
  const isKeygen =
    progress?.step === 'keygen' || progress?.step === 'complete'

  if (qrPayload && !isKeygen) {
    // Peer slots (excluding the initiating device)
    const peerSlots = devicesRequired - 1
    // How many peers have actually joined (subtract initiating device)
    const peersJoined = Math.max(0, devicesJoined - 1)

    return (
      <>
        <PageHeader title={t('scan_qr')} hasBorder />
        <FitPageContent>
          <PageFormFrame>
            <PeersPageContentFrame>
              <FramedQrCode value={qrPayload} />
              <PeersManagerFrame>
                <Text color="contrast" size={22} weight="500">
                  {t('devices')} ({devicesJoined}/{devicesRequired})
                </Text>
                <PeersContainer>
                  <ThisDeviceContainer>
                    <VStack>
                      <Text color="contrast" size={14} weight="500">
                        {t('this_device')}
                      </Text>
                    </VStack>
                  </ThisDeviceContainer>
                  {range(peerSlots).map(index =>
                    index < peersJoined ? (
                      <JoinedDeviceContainer key={index}>
                        <Text color="contrast" size={14} weight="500">
                          Device {index + 2}
                        </Text>
                      </JoinedDeviceContainer>
                    ) : (
                      <PeerPlaceholder key={index}>
                        {t('scan_with_device_index', {
                          index: index + 2,
                        })}
                      </PeerPlaceholder>
                    )
                  )}
                </PeersContainer>
              </PeersManagerFrame>
            </PeersPageContentFrame>
            <VStack alignItems="center" gap={8}>
              <Text color="shy" size={14}>
                {t('waitingOnDevices')}
              </Text>
            </VStack>
          </PageFormFrame>
        </FitPageContent>
      </>
    )
  }

  return (
    <>
      <PageHeader title={t('creating_vault')} hasBorder />
      <FlowPendingPageContent
        title={progress?.message ?? `${t('creating_vault')}...`}
      />
    </>
  )
}
