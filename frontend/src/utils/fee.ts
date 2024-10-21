import { FeeData } from '@ethersproject/providers';
import BigNumber from 'bignumber.js';

import {
  FeeSpeedKey,
  FeeType,
  GasFeeResponse,
  SendFee,
} from '../lib/types/fee';
import {
  nativeTokenForChain,
  tokenAmountToRaw,
  tokenRawAmountToNumber,
} from '../pages/swap/utils';
import { tokenRawAmountToUSDPrice } from './assets';
import { getJsonRpcProvider } from './json-provider';

export const prepareTxFee = async (fee: GasFeeResponse): Promise<SendFee> => {
  if (fee.chainId) {
    // Todo move RPC fee call to backend
    const provider = getJsonRpcProvider(fee.chainId);
    const blockChainFees: FeeData = await provider.getFeeData();

    return {
      chainId: fee.chainId,
      type: FeeType.EVM_FEES,
      gasLimit: `${Math.trunc(
        new BigNumber(fee.baseFee).multipliedBy(1.2).toNumber()
      )}`,
      gasPrices: {
        [FeeSpeedKey.Average]: new BigNumber(
          blockChainFees.gasPrice?.toString() || '0'
        )
          .times(1.1)
          .toFixed(0),
        [FeeSpeedKey.Fast]: new BigNumber(
          blockChainFees.gasPrice?.toString() || '0'
        )
          .times(1.1)
          .toFixed(0),
        [FeeSpeedKey.Fastest]: new BigNumber(
          blockChainFees.gasPrice?.toString() || '0'
        )
          .times(1.1)
          .toFixed(0),
      },
      baseFee: blockChainFees.maxFeePerGas?.toString() as string,
    };
  }
  if (fee.type !== FeeType.RADIX) {
    return {
      type: FeeType.FEES,
      isUTXOChain: true,
      fees: {
        [FeeSpeedKey.Average]: +fee.gasFees.average.toString(),
        [FeeSpeedKey.Fast]: +fee.gasFees.fast.toString(),
        [FeeSpeedKey.Fastest]: +fee.gasFees.fastest.toString(),
      },
      rates: fee.rates
        ? {
            [FeeSpeedKey.Average]: +fee.rates.average.toString(),
            [FeeSpeedKey.Fast]: +fee.rates.fast.toString(),
            [FeeSpeedKey.Fastest]: +fee.rates.fastest.toString(),
          }
        : undefined,
      baseFee: fee.baseFee.toString(),
    };
  }
  return {
    type: FeeType.RADIX,
    fees: {
      [FeeSpeedKey.Average]: +fee.gasFees.average.toString(),
      [FeeSpeedKey.Fast]: +fee.gasFees.fast.toString(),
      [FeeSpeedKey.Fastest]: +fee.gasFees.fastest.toString(),
    },
    baseFee: fee.baseFee.toString(),
  };
};

export const calculateFeeRaw = (fee: SendFee) => {
  if (fee.type === FeeType.EVM_FEES) {
    return new BigNumber(fee.gasLimit as string)
      .multipliedBy(new BigNumber(fee.gasPrices?.average as string))
      .toString();
  }
  if (fee.type === FeeType.FEES) {
    return new BigNumber(fee.fees?.average as number).toString();
  }
  if (fee.type === FeeType.RADIX) {
    return tokenAmountToRaw(fee.baseFee, 18);
  }
};

export const prepareMaxAmount = (
  amount: string,
  decimals: number,
  feeAmount: string,
  rawBalance: string
) => {
  const rawAmount = tokenAmountToRaw(amount, decimals);
  const feeAmountWithMultiplier = Math.trunc(
    new BigNumber(feeAmount).multipliedBy(new BigNumber(1.2)).toNumber()
  );
  if (new BigNumber(rawAmount).isEqualTo(new BigNumber(rawBalance))) {
    return new BigNumber(rawAmount)
      .minus(new BigNumber(feeAmountWithMultiplier))
      .toString();
  }
  if (
    new BigNumber(rawAmount).isLessThan(new BigNumber(rawBalance)) &&
    new BigNumber(rawBalance)
      .minus(new BigNumber(rawAmount))
      .isLessThan(new BigNumber(feeAmount))
  ) {
    return new BigNumber(rawBalance)
      .minus(new BigNumber(feeAmountWithMultiplier))
      .toString();
  }
  return rawAmount;
};

export const checkIsFeeNotEnoughForSend = (
  fee: SendFee,
  chainTicker: string,
  ticker: string,
  amountToSend: string,
  nativeTokenBalance: string
) => {
  if (fee.type === FeeType.EVM_FEES) {
    const totalFee = new BigNumber(fee.gasLimit as string)
      .multipliedBy(new BigNumber(fee.gasPrices?.average as string))
      .toString();
    const totalFeeWithAmount = new BigNumber(totalFee).plus(
      new BigNumber(
        nativeTokenForChain[chainTicker] === ticker ? amountToSend : 0
      )
    );
    return new BigNumber(new BigNumber(nativeTokenBalance)).isLessThan(
      totalFeeWithAmount
    );
  }
  const totalFee = new BigNumber(fee.fees?.average || '0').plus(
    new BigNumber(
      nativeTokenForChain[chainTicker] === ticker ? amountToSend : 0
    )
  );
  return new BigNumber(nativeTokenBalance).isLessThan(totalFee);
};

export const calculateSendFee = (fee: SendFee, decimals: number) => {
  if (fee.type === FeeType.EVM_FEES) {
    return tokenRawAmountToNumber(
      new BigNumber(fee.gasLimit as string)
        .multipliedBy(new BigNumber(fee.gasPrices?.average as string))
        .toString(),
      decimals,
      10
    );
  }
  if (fee.type === FeeType.FEES) {
    return tokenRawAmountToNumber(
      new BigNumber(fee.fees?.average as number).toString(),
      decimals
    );
  }
  if (fee.type === FeeType.RADIX) {
    return fee.baseFee;
  }
  return '0';
};

export const calculateSendFeeAmount = (
  fee: SendFee,
  price: string,
  decimals: number
) => {
  if (fee.type === FeeType.EVM_FEES) {
    return tokenRawAmountToUSDPrice(
      new BigNumber(fee.gasLimit as string)
        .multipliedBy(new BigNumber(fee.gasPrices?.average as string))
        .toString(),
      decimals,
      price
    );
  }
  if (fee.type === FeeType.FEES) {
    return tokenRawAmountToUSDPrice(
      new BigNumber(fee.fees?.average as number).toString(),
      decimals,
      price
    );
  }
  if (fee.type === FeeType.RADIX) {
    return tokenRawAmountToUSDPrice(
      tokenAmountToRaw(fee.baseFee, decimals),
      decimals,
      price
    );
  }
  return '0.00';
};
