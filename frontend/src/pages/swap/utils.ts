import { Asset } from '@xchainjs/xchain-util';
import BigNumber from 'bignumber.js';

import { formatMidgardNumber } from '../../utils/midgard';

export const convertSeconds = (streaming?: number, swap?: number): string => {
  const seconds = streaming ? streaming + (swap || 0) : swap;
  if (seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (!minutes && !hours) {
      return `${seconds}s`;
    }

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }
  return '~4s';
};

export const getSignAndString = (data: string[]) => {
  const result = '';
  const power = Number(data[1]) + 1;
  return { result, power };
};

export const getSignAndReplacedString = (
  value: string | number,
  data: string[]
) => {
  const sign = Number(value) < 0 ? '-' : '';
  const str = data[0].replace('.', '');

  return { sign, str };
};

export const handleRemoveExponent = (value: string | number) => {
  const data = String(value).split(/[eE]/);

  if (data.length === 1) {
    return data[0];
  }

  let { result, power } = getSignAndString(data);

  const { sign, str } = getSignAndReplacedString(value, data);

  if (power < 0) {
    result = `${sign}0.`;

    // eslint-disable-next-line no-plusplus
    while (power++) {
      result += '0';
    }

    // eslint-disable-next-line
    return result + str.replace(/^\-/, '');
  }

  power -= str.length;

  // eslint-disable-next-line no-plusplus
  while (power--) {
    result += '0';
  }

  return `${str}${result}`;
};

export const getOutputAssetAmount = (amount: string, isMaya?: boolean) => {
  return formatMidgardNumber(amount, isMaya).toString();
};

export const rawToBignumber = (rawAmount: string, decimal: number) => {
  return new BigNumber(rawAmount).div(new BigNumber(10).pow(decimal));
};

export const thousands = (
  num: number | string,
  options: {
    separator: string;
    forceAtLeastTwoDigits: boolean;
    sliceDigits?: number;
  }
): string => {
  const { separator } = options;
  if (!num) {
    return '0';
  }

  const parts = String(num || num === 0 ? num : '').split('.');

  if (parts.length) {
    parts[0] = (parts[0] as string).replace(
      /(\d)(?=(\d{3})+\b)/g,
      '$1' + (separator || '.')
    );
  }

  // Render a number such as 1950.5 as "1'950.5"
  if (parts.length === 2 && options.forceAtLeastTwoDigits) {
    return `${parts[0]}.${(parts[1] as string).padEnd(2, '0')}`;
  }

  if (parts.length === 2 && options.sliceDigits) {
    return `${parts[0]}.${
      parts[1]?.substring(0, options.sliceDigits) as string
    }`;
  }

  if (options.forceAtLeastTwoDigits) {
    return `${parts[0]}.${''.padEnd(2, '0')}`;
  }

  return parts.join('.');
};

export const prepareNumberWithSeparators = (
  val: number | string,
  forcedSlice?: number
) => {
  return +val
    ? thousands(val, {
        separator: ',',
        forceAtLeastTwoDigits: false,
        sliceDigits: forcedSlice ? forcedSlice : +val > 999 ? 2 : 6,
      })
    : '0.00';
};

export const tokenRawAmountToNumber = (
  rawAmount: string,
  decimal: number,
  forcedSlice?: number
) => {
  const bn = rawToBignumber(rawAmount, decimal);
  return prepareNumberWithSeparators(
    handleRemoveExponent(bn.toNumber()),
    forcedSlice
  );
};

export const tokenAmountToRaw = (amount: string, decimals: number) => {
  return handleRemoveExponent(
    new BigNumber(amount)
      .multipliedBy(new BigNumber(10).pow(decimals))
      .toString()
  );
};

export const nativeTokenForChain: { [key: string]: string } = {
  AVAX: 'AVAX',
  BCH: 'BCH',
  BNB: 'BNB',
  BSC: 'BNB',
  BTC: 'BTC',
  DASH: 'DASH',
  DOGE: 'DOGE',
  ETH: 'ETH',
  GAIA: 'ATOM',
  KUJI: 'KUJI',
  LTC: 'LTC',
  MAYA: 'CACAO',
  THOR: 'RUNE',
  ARB: 'ETH',
  XRD: 'XRD',
};

export const isEvmErc20Asset = (asset: Asset): boolean => {
  return (
    ['ETH', 'AVAX', 'BSC', 'ARB'].includes(asset.chain) &&
    nativeTokenForChain[asset.chain] !== asset.ticker
  );
};
