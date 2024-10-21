import {
  DefaultError,
  UndefinedInitialDataOptions,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { ApiAsset, SwapPairsAsset } from '../../types/assets';
import { useThorwalletApi } from '../use-thorwallet-api';

export function useSwapPairs(token: ApiAsset) {
  const queryClient = useQueryClient();
  const { getSwapPairs } = useThorwalletApi();

  const pairsExist = queryClient.getQueryData([
    'swapPairs',
    `${token.chain}.${token.ticker}${
      token.provider ? `${token.provider[0]}` : ''
    }`,
  ]);
  return useQuery({
    queryKey: [
      'swapPairs',
      `${token.chain}.${token.ticker}${
        token.provider ? `${token.provider[0]}` : ''
      }`,
    ],
    queryFn: async () => {
      if (!pairsExist) {
        const pairs = await getSwapPairs(
          token.chain,
          token.ticker,
          token.synth,
          token.contractAddress,
          token.provider
        );
        return prepareSwapPairs(pairs);
      }
    },
    keepPreviousData: true,
    retry: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: Infinity,
  } as UndefinedInitialDataOptions<unknown, DefaultError, ApiAsset[]>);
}

const prepareSwapPairs = (data: SwapPairsAsset[]): ApiAsset[] => {
  return data
    .filter(asset => asset.chain !== 'BNB')
    .map(asset => {
      if (asset.provider) {
        return {
          ...asset,
          synth: true,
          provider: [asset.provider],
        };
      }
      return {
        ...asset,
        synth: false,
        provider: undefined,
      };
    });
};
