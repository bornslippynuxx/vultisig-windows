import { Asset } from '@xchainjs/xchain-util';
import BigNumber from 'bignumber.js';

import { ApiAsset, SynthProvider } from '../lib/types/assets';
import {
  prepareNumberWithSeparators,
  rawToBignumber,
} from '../pages/swap/utils';

export const getAssetImage = (token: Asset, assets?: ApiAsset[]) => {
  return (
    assets?.find(
      asset => asset.chain === token.chain && asset.ticker === token.ticker
    )?.icon || ''
  );
};

export const normalizePossibleInvalidTokenName = (ticker: string) => {
  const hasSpaces = !!ticker.split(' ').length;
  const hasDefis = !!ticker.split('-').length;
  if (hasSpaces || hasDefis) {
    return ticker.split(`${hasDefis ? '-' : ' '}`)[0];
  }
  return ticker;
};

export const apiAssetToAsset = (asset: ApiAsset): Asset => {
  return {
    ticker: asset.ticker,
    chain: asset.chain,
    symbol: asset.symbol,
    synth: asset.synth,
  };
};

export const getSynthProvider = (
  chain: string,
  synth: boolean
): SynthProvider | undefined => {
  if (synth) {
    if (chain === 'THOR') {
      return 'THORCHAIN' as SynthProvider;
    }
    if (chain === 'MAYA') {
      return 'MAYA' as SynthProvider;
    }
  }
};

export const tokenRawAmountToUSDPrice = (
  rawAmount: string,
  decimal: number,
  price: string
) => {
  const bn = rawToBignumber(rawAmount, decimal);

  return prepareNumberWithSeparators(
    parseFloat(bn.multipliedBy(new BigNumber(price)).toNumber().toFixed(2))
  );
};
