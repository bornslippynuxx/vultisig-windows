import BigNumber from 'bignumber.js';

import { SynthProvider } from '../lib/types/assets';

export function convertSymbolToImagePath(symbol: string) {
  switch (symbol) {
    case 'ETH':
      return 'Ethereum';
    case 'BTC':
      return 'Bitcoin';
    case 'BCH':
      return 'Bitcoin-Cash';
    case 'LTC':
      return 'Litecoin';
    case 'BNB':
      return 'BNB';
    case 'AVAX':
      return 'Avalanche';
    case 'THOR':
      return 'THORChain';
    case 'GAIA':
      return 'Gaia';
    case 'KUJI':
      return 'Kujira';
    case 'ARB':
      return 'Arbitrum';
    case 'XRD':
      return 'Radix';
    case 'MAYA':
      return 'MayaChain';
    case 'DOGE':
      return 'Dogecoin';
    case 'Dash':
      return 'Dash';
    case 'BSC':
      return 'BSC';
    default:
      return symbol;
  }
}

export function convertSymbolToAssetName(symbol: string) {
  switch (symbol) {
    case 'ETH':
      return 'Ethereum';
    case 'BTC':
      return 'Bitcoin';
    case 'BCH':
      return 'Bitcoin Cash';
    case 'LTC':
      return 'Litecoin';
    case 'BNB':
      return 'Binance';
    case 'AVAX':
      return 'Avalanche';
    case 'THOR':
      return 'THORChain';
    case 'GAIA':
      return 'Cosmos';
    case 'KUJI':
      return 'KUJIRA';
    case 'ARB':
      return 'Arbitrum One';
    case 'XRD':
      return 'Radix';
    case 'MAYA':
      return 'MAYAChain';
    default:
      return symbol;
  }
}

export const getSourceChain = (
  chain: string,
  isSynth: boolean,
  provider?: SynthProvider[]
): string => {
  if (provider?.length && isSynth) {
    return provider[0] === 'THORCHAIN' ? 'THOR' : 'MAYA';
  }
  return chain;
};

export const tokenAmountToUSDPrice = (amount: string, price: string) => {
  return parseFloat(
    new BigNumber(amount)
      .multipliedBy(new BigNumber(price))
      .toNumber()
      .toFixed(2)
  );
};

export const nativeTokenDecimals: { [key: string]: number } = {
  AVAX: 18,
  ETH: 18,
  BSC: 18,
  BTC: 8,
  BCH: 8,
  LTC: 8,
  BNB: 8,
  GAIA: 6,
  DOGE: 8,
  THOR: 8,
  MAYA: 10,
  DASH: 8,
  KUJI: 6,
  XRD: 18,
  ARB: 18,
};

export function formatWalletAddress(
  address: string,
  startDigits?: number,
  lastDigits?: number
): string {
  if (address.length < 32) {
    return address;
  }
  const addressStartDigits = startDigits || 6;
  const part1 = address.substring(0, addressStartDigits);
  const part2 = address.substring(
    address.length - (lastDigits || 8),
    address.length
  );
  return `${part1}...${part2}`;
}
