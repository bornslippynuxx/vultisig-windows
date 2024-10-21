import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { InfuraProvider } from 'ethers';

import { ethRpcs, SupportedChainIds } from '../lib/types/blockchain';

export const getJsonRpcProvider = (
  chainId: number,
  rpcUrl?: string,
  networkName?: string
): StaticJsonRpcProvider => {
  const provider = getJsonRpcProviderRaw(chainId, rpcUrl, networkName);

  return provider;
};

const getJsonRpcProviderRaw = (
  chainId: number,
  rpcUrl?: string,
  networkName?: string
): StaticJsonRpcProvider => {
  if (chainId === SupportedChainIds.ETH) {
    return new InfuraProvider(
      'homestead',
      '20128c7e01f64e0cbc5d9fccc162a0d6'
    ) as unknown as StaticJsonRpcProvider;
  }

  const rpcInfo = ethRpcs[chainId];

  if (rpcInfo) {
    return new StaticJsonRpcProvider(rpcInfo.rpcUrl, {
      chainId,
      name: networkName || rpcInfo.networkName,
    });
  }

  if (rpcUrl) {
    return new StaticJsonRpcProvider(rpcUrl, {
      chainId,
      name: networkName || 'Custom Network',
    });
  }

  throw new Error(`Unknown Chain ID ${chainId}, rpc URL must be set`);
};
