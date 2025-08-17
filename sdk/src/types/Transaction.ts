export interface TransactionData {
  from: string
  to: string
  value?: string
  amount?: string
  data?: string
  gasLimit?: string
  maxPriorityFeePerGas?: string
  maxFeePerGas?: string
  chain?: string
}

export interface SignedTransaction {
  hash: string
  rawTransaction: string
  signature: string
}

export interface MessageSigningData {
  message: string
  address: string
  chain: string
}