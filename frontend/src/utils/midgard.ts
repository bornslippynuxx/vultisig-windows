import BigNumber from 'bignumber.js';

const MIDGARD_DECIMAL = 8;

const CACAO_DECIMAL = 10;

export const formatMidgardNumber = (
  value: string,
  isMaya?: boolean
): BigNumber =>
  new BigNumber(value).div(10 ** (isMaya ? CACAO_DECIMAL : MIDGARD_DECIMAL));
