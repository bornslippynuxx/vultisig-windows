import { hasServer } from '@core/mpc/devices/localPartyId'
import { getVaultId } from '@core/mpc/vault/Vault'
import { FastVaultPasswordVerification } from '@core/ui/mpc/fast/FastVaultPasswordVerification'
import { BottomNavigation } from '@core/ui/vault/components/BottomNavigation'
import { VaultOverviewPrimaryActions } from '@core/ui/vault/page/components/VaultOverviewPrimaryActions'
import { VaultSelector } from '@core/ui/vault/page/components/VaultSelector'
import { useCurrentVault } from '@core/ui/vault/state/currentVault'
import { VStack } from '@lib/ui/layout/Stack'
import { Spinner } from '@lib/ui/loaders/Spinner'
import { PageContent } from '@lib/ui/page/PageContent'
import { PageHeader } from '@lib/ui/page/PageHeader'
import type { ReactNode } from 'react'
import styled from 'styled-components'

import { useSdkVault } from '../SdkVaultProvider'
import { SdkVaultChainList } from './vault/SdkVaultChainList'
import { SdkVaultTotalBalance } from './vault/SdkVaultTotalBalance'

type SdkVaultPageProps = {
  primaryControls?: ReactNode
}

/**
 * SDK-backed VaultPage replacement.
 *
 * Uses SDK hooks for balance/value data instead of core's balance resolvers.
 * Reuses core UI components for layout and navigation (VaultSelector,
 * BottomNavigation, VaultOverviewPrimaryActions).
 *
 * When the SDK vault is not yet hydrated (e.g., first load or passcode-locked),
 * shows a loading spinner. Once hydrated, renders the full portfolio view.
 */
export const SdkVaultPage = ({ primaryControls }: SdkVaultPageProps) => {
  const vault = useCurrentVault()
  const sdkVault = useSdkVault()
  const isFastVault = hasServer(vault.signers)
  const vaultId = getVaultId(vault)

  return (
    <Wrapper justifyContent="space-between" flexGrow>
      <VStack flexGrow>
        <PageHeader
          hasBorder
          primaryControls={primaryControls}
          title={<VaultSelector value={vault} />}
        />
        {sdkVault ? (
          <SdkVaultContent />
        ) : (
          <PageContent
            scrollable
            gap={32}
            flexGrow
            style={{ justifyContent: 'center', alignItems: 'center' }}
          >
            <Spinner size="2em" />
          </PageContent>
        )}
        {isFastVault && <FastVaultPasswordVerification key={vaultId} />}
      </VStack>
      <BottomNavigation />
    </Wrapper>
  )
}

/**
 * Inner content rendered only when SDK vault is hydrated.
 * All SDK hooks are safe to use here (vault is guaranteed non-null).
 */
const SdkVaultContent = () => {
  return (
    <PageContent scrollable gap={32} flexGrow>
      <VStack gap={24} alignItems="center">
        <SdkVaultTotalBalance />
        <VaultOverviewPrimaryActions />
      </VStack>
      <SdkVaultChainList />
    </PageContent>
  )
}

const Wrapper = styled(VStack)`
  position: relative;
`
