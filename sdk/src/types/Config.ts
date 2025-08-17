import { ChainKind } from '@core/chain/ChainKind'

export interface SDKConfig {
  serverUrl?: string
  theme?: 'light' | 'dark'
  supportedChains?: ChainKind[]
  apiKey?: string
}