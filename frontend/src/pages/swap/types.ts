export enum SwapProtocolType {
  THORPriceOptimised = 'priceOptimised',
  THORTimeOptimised = 'timeOptimised',
  MAYA = 'maya',
  MAYA_STREAMING = 'mayaStreaming',
}

export interface SwapQuoteFee {
  affiliate: string;
  asset: string;
  liquidity: string;
  outbound: string;
  slippage_bps: number;
  total: string;
  totalInUsd: string;
  total_bps: number;
}

export interface SwapQuote {
  affiliateInPercentage: string;
  expected_amount_out: string;
  expected_amount_out_streaming: string;
  expiry: number;
  fees: SwapQuoteFee;
  inbound_address: string;
  max_streaming_quantity: number;
  memo: string;
  notes: string;
  outbound_delay_blocks: number;
  outbound_delay_seconds: number;
  recommended_min_amount_in: string;
  router?: string;
  slippage_bps: number;
  streaming_slippage_bps: number;
  streaming_swap_blocks: number;
  streaming_swap_seconds?: number;
  total_swap_seconds?: number;
  warning: string;
}

export type SwapQuoteParams = {
  fromAsset: string;
  toAsset: string;
  amount: string;
  destination: string;
  fromAddress: string;
  toleranceBps: number;
  fromAssetDecimal: number;
  toAssetDecimal: number;
  ethAddress?: string;
};

export interface SwapQuoteResponse {
  maya: {
    error: string;
    quote: SwapQuote | null;
  };
  mayaStreaming: {
    error: string;
    quote: SwapQuote | null;
  };
  oneInch: {
    error: string;
    quote: SwapQuote | null;
  };
  thorchain: {
    base: {
      error: string | null;
      quote: SwapQuote | null;
    };
    streaming: {
      quote: SwapQuote | null;
      error: string;
    };
  };
}
