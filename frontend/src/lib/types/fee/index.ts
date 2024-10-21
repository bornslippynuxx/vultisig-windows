export type GasRequestTransactionType =
  | 'transfer'
  | 'deposit'
  | 'allowance'
  | 'stake-v2'
  | 'withdraw-v2'
  | 'harvest-v2';

export enum FeeSpeedKey {
  Average = 'average',
  Fast = 'fast',
  Fastest = 'fastest',
}

export enum FeeType {
  EVM_FEES = 'evm-fess',
  COSMOS_FEES = 'cosmos-fees',
  FEES = 'fees',
  RADIX = 'radix-fees',
}

export interface SendFeeRequestParams {
  senderAddress: string;
  recipientAddress?: string;
  amount?: string;
  asset: {
    chain: string;
    ticker: string;
    contractAddress?: string;
    isSynth: boolean;
  };
  txType: GasRequestTransactionType;
  memo?: string;
  inboundAddress?: string;
  router?: string;
}

export interface GasFeeResponse {
  gasFees: {
    average: number;
    fast: number;
    fastest: number;
  };
  rates?: {
    average: number;
    fast: number;
    fastest: number;
  };
  baseFee: number;
  chainId?: number;
  type: string;
}

export interface SendFee {
  type: FeeType;
  baseFee: string;
  fees?: Record<FeeSpeedKey, number>;
  isUTXOChain?: boolean;
  rates?: Record<FeeSpeedKey, number> | null;
  chainId?: number;
  gasLimit?: string;
  gasPrices?: Record<FeeSpeedKey, string>;
}
