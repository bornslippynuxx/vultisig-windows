export interface WalletBalance {
  asset: WalletAsset;
  amount: string;
  rawAmount: string;
}

export interface WalletAsset {
  chain: string;
  chainId?: number;
  ticker: string;
  symbol: string;
  icon: string;
  name: string;
  decimals: number;
  contractAddress: string;
  usdPrice: string;
  isSynthetic?: boolean;
}

export interface WalletWithBalance {
  totalInUsd: string;
  nativeTokenForChain: WalletBalance;
  balances: WalletBalance[];
  allBalances: WalletBalance[];
}

export interface GetBalanceResponse {
  balances: WalletBalance[];
  totalInUsd: string;
}
