export const SupportedChainIds = {
  ETH: 1 as const,
  BSC: 56 as const,
  ARB: 42161 as const,
  AVAX: 43114 as const,
  zkSync: 324 as const,
};

export const ethRpcs: {
  [key in number]: { rpcUrl: string; networkName: string };
} = {
  [SupportedChainIds.ETH]: {
    rpcUrl: 'https://mainnet.infura.io',
    networkName: 'Ethereum',
  },
  [SupportedChainIds.AVAX]: {
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    networkName: 'Avalanche',
  },
  [SupportedChainIds.BSC]: {
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    networkName: 'BNB Smart Chain',
  },
  [SupportedChainIds.zkSync]: {
    rpcUrl: 'https://mainnet.era.zksync.io',
    networkName: 'zkSync',
  },
  [SupportedChainIds.ARB]: {
    rpcUrl:
      'https://arbitrum-mainnet.infura.io/v3/18bcd31ac9ad4046aae780b4028232c2',
    networkName: 'Arbitrum One',
  },
};
