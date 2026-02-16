import { Vultisig } from '@vultisig/sdk'
import { ChildrenProp } from '@lib/ui/props'
import { createContext, useContext, useMemo } from 'react'

import { SdkVaultProvider } from './SdkVaultProvider'

const VultisigSdkContext = createContext<Vultisig | null>(null)

export const VultisigSdkProvider = ({ children }: ChildrenProp) => {
  const sdk = useMemo(() => new Vultisig(), [])

  return (
    <VultisigSdkContext.Provider value={sdk}>
      <SdkVaultProvider>{children}</SdkVaultProvider>
    </VultisigSdkContext.Provider>
  )
}

export const useVultisigSdk = () => {
  const sdk = useContext(VultisigSdkContext)
  if (!sdk) {
    throw new Error('useVultisigSdk must be used within VultisigSdkProvider')
  }
  return sdk
}
