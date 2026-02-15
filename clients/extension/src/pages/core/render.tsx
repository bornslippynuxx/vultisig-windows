import { VultisigSdkProvider } from '@clients/extension/src/sdk/VultisigSdkProvider'
import { ExtensionQueryClientProvider } from '@core/extension/ExtensionQueryClientProvider'
import { ReactNode, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

export const renderExtensionPage = (node: ReactNode) => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ExtensionQueryClientProvider>
        <VultisigSdkProvider>{node}</VultisigSdkProvider>
      </ExtensionQueryClientProvider>
    </StrictMode>
  )
}
