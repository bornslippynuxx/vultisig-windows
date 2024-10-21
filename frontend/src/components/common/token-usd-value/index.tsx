import { Asset } from '@xchainjs/xchain-util';
import BigNumber from 'bignumber.js';

import { useTokenPriceUsd } from '../../../lib/hooks/use-token-price-usd';
import useAssets from '../../../lib/hooks/useAssets';
import { thousands } from '../../../pages/swap/utils';

interface TokenUsdValueProps {
  amount: string;
  token: Asset;
}

export default function TokenUsdValue({ amount, token }: TokenUsdValueProps) {
  const { data: assetsData } = useAssets();
  const getTokenToFetch = () => {
    const asset = assetsData?.find(
      asset => asset.chain === token.chain && asset.ticker === token.ticker
    );

    return `${asset?.symbol}`;
  };
  const priceData = useTokenPriceUsd([getTokenToFetch()]);
  const price = priceData[0].data?.price ? priceData[0].data.price : '1.23';
  return (
    <span className="font-medium text-neutral-300">
      $
      {amount
        ? thousands(
            new BigNumber(amount).multipliedBy(new BigNumber(price)).toFixed(2),
            { separator: ',', forceAtLeastTwoDigits: true }
          )
        : '0.00'}
    </span>
  );
}
