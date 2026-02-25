import { SwapQuote } from '@core/chain/swap/quote/SwapQuote'
import { FromAmountProvider } from '@core/ui/vault/swap/state/fromAmount'
import { ValueTransfer } from '@lib/ui/base/ValueTransfer'

import { SwapForm } from '@core/ui/vault/swap/form/SwapForm'

import { SdkSwapVerify } from './SdkSwapVerify'

export const SdkSwapPage = () => {
  return (
    <FromAmountProvider initialValue={null}>
      <ValueTransfer<SwapQuote>
        from={({ onFinish }) => <SwapForm onFinish={onFinish} />}
        to={({ value, onBack }) => (
          <SdkSwapVerify swapQuote={value} onBack={onBack} />
        )}
      />
    </FromAmountProvider>
  )
}
