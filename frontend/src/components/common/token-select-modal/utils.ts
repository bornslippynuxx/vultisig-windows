import { UseWalletsBalances } from '../../../lib/hooks/use-wallet-balances';
import { ApiAsset } from '../../../lib/types/assets';
import {
  rawToBignumber,
  tokenRawAmountToNumber,
} from '../../../pages/swap/utils';
import { getSourceChain, tokenAmountToUSDPrice } from '../../../utils/crypto';
import { AssetFilterType } from './types';

export const handleSortAvailableTokens = (
  assets: ApiAsset[],
  chainFilter: string | null,
  tokenTypeFiler: AssetFilterType,
  search: string,
  allBalancesData?: UseWalletsBalances
) => {
  const filtered = assets.filter(asset => {
    // By Chain
    let isBelongToChain = true;
    if (chainFilter) {
      isBelongToChain =
        getSourceChain(asset.chain, asset.synth, asset.provider) ===
        chainFilter;
    }

    // By type
    let tabFilter;
    switch (tokenTypeFiler) {
      case AssetFilterType.ALL:
        tabFilter = true;
        break;
      case AssetFilterType.ERC20:
        tabFilter = asset.chain === 'ETH' && !asset.synth;
        break;
      case AssetFilterType.BEP20:
        tabFilter = 'BSC' === asset.chain && !asset.synth;
        break;
      case AssetFilterType.SYNTH:
        tabFilter = asset.synth;
        break;
      // case AssetFilterType.FAVOURITES:
      //   tabFilter = favouriteTokens[asset.chain]?.includes(asset.ticker);
      //   break;
      default:
        tabFilter = true;
    }

    // By search
    let includesSearchValue;
    if (search) {
      includesSearchValue = asset.ticker
        .toLowerCase()
        .includes(search.toLowerCase());
    } else {
      includesSearchValue = true;
    }

    return isBelongToChain && tabFilter && includesSearchValue;
  });
  const filteredTwice = filtered.map(asset => ({
    ...asset,
    balanceRaw: getTokenBalance(
      getSourceChain(asset.chain, asset.synth, asset.provider),
      asset.ticker,
      asset.contractAddress || '',
      asset.synth,
      asset.chain,
      allBalancesData
    ).tokenAmount,
    balanceUsd: getTokenBalance(
      getSourceChain(asset.chain, asset.synth, asset.provider),
      asset.ticker,
      asset.contractAddress || '',
      asset.synth,
      asset.chain,
      allBalancesData
    ).tokenAmountUsd,
  }));
  return filteredTwice.sort((a, b) => {
    return +b.balanceUsd - +a.balanceUsd;
  });
};

function getTokenBalance(
  chain: string,
  ticker: string,
  contractAddress: string,
  synth: boolean,
  synthChain: string,
  allBalancesData?: UseWalletsBalances
) {
  if (allBalancesData && allBalancesData?.chainsBalances[chain]) {
    const balanceItem = allBalancesData.chainsBalances[chain].allBalances.find(
      item => {
        if (item.asset.chain === 'ARB') {
          return (
            item.asset.ticker === ticker &&
            item.asset.contractAddress.toLowerCase() ===
              contractAddress.toLowerCase()
          );
        }
        if (synth) {
          return (
            item.asset.ticker === ticker && item.asset.chain === synthChain
          );
        }
        return item.asset.ticker === ticker;
      }
    );
    const balance = balanceItem ? balanceItem.rawAmount : '0';
    const decimals = balanceItem ? balanceItem.asset.decimals : '0';
    const price = balanceItem ? balanceItem.asset.usdPrice : '0';
    return {
      tokenAmount: decimals
        ? tokenRawAmountToNumber(balance, +decimals)
        : '0.00',
      tokenAmountUsd: decimals
        ? tokenAmountToUSDPrice(
            rawToBignumber(balance, +decimals).toString(),
            price
          ).toString()
        : '0.00',
    };
  }
  return {
    tokenAmount: '0.00',
    tokenAmountUsd: '0.00',
  };
}
