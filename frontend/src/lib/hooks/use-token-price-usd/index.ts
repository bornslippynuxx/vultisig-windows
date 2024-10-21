import { useQueries, useQueryClient } from '@tanstack/react-query';

import { ThorwalletApi } from '../../../services/Thorwallet';
import { queryUrl } from '../../utils/query/queryUrl';

export const useTokenPriceUsd = (tickers: string[]) => {
  const queryClient = useQueryClient();

  const filteredTickers = [...new Set(tickers)];
  return useQueries({
    queries: filteredTickers.map(ticker => ({
      queryKey: ['price', ticker],
      queryFn: async () => {
        const priceExists = queryClient.getQueryData(['price', ticker]);
        if (priceExists) {
          const cache = queryClient.getQueryState(['price', ticker]);
          if (cache && new Date().getTime() - cache.dataUpdatedAt > 60000) {
            const endpoint = ThorwalletApi.fetchTokenPrices(ticker);
            const result =
              await queryUrl<Record<string, { usd: number }>>(endpoint);
            return {
              price: +result[ticker].usd,
              updatedAt: new Date().getTime(),
            };
          }
        }
        const endpoint = ThorwalletApi.fetchTokenPrices(ticker);
        const result =
          await queryUrl<Record<string, { usd: number }>>(endpoint);
        return {
          price: +result[ticker].usd,
          updatedAt: new Date().getTime(),
        };
      },
      keepPreviousData: true,
      retry: 0,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    })),
  });
};
