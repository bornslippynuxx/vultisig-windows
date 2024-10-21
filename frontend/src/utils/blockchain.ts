import BigNumber from 'bignumber.js';
import { Contract, ethers, InterfaceAbi } from 'ethers';

import { ethRpcs } from '../lib/types/blockchain';
import { ERC20ABI } from '../lib/utils/blockchian/erc20abi';
import { prepareNumberWithSeparators } from '../pages/swap/utils';

export const getContractAllowance = async ({
  contractAddress,
  chainId,
  address,
  router,
}: {
  contractAddress: string;
  chainId: number;
  router: string;
  address: string;
}): Promise<string> => {
  if (!router) throw new Error('router address not found');

  return getERC20Allowance({
    spender: router,
    chainId,
    owner: address,
    contractAddress,
  });
};

export const getERC20Allowance = async ({
  chainId,
  owner,
  spender,
  contractAddress,
}: {
  chainId: number;
  spender: string;
  owner: string;
  contractAddress: string;
}): Promise<string> => {
  const provider = new ethers.JsonRpcProvider(ethRpcs[chainId].rpcUrl);
  const contract = new Contract(
    contractAddress.toLowerCase(),
    ERC20ABI as InterfaceAbi,
    provider
  );
  const result = await contract.allowance(
    owner.toLowerCase(),
    spender.toLowerCase()
  );
  return result.toString();
};

export const calculateTokenAmountUsd = (amount: string, price?: number) => {
  return prepareNumberWithSeparators(
    new BigNumber(amount).multipliedBy(new BigNumber(price || 0)).toFixed(2)
  );
};
