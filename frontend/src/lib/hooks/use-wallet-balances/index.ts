import {
  useQueries,
  useQueryClient,
  UseQueryResult,
} from '@tanstack/react-query';
import BigNumber from 'bignumber.js';

import {
  nativeTokenForChain,
  prepareNumberWithSeparators,
} from '../../../pages/swap/utils';
import { getSynthProvider } from '../../../utils/assets';
import { convertSymbolToImagePath } from '../../../utils/crypto';
import { useAssertCurrentVaultAddreses } from '../../../vault/state/useCurrentVault';
import { GetBalanceResponse, WalletWithBalance } from '../../types/balances';
import { getFreshBalancesMap } from './get-balaces';

export type UseWalletsBalances = {
  chainsBalances: Record<string, WalletWithBalance>;
  totalBalance: string;
};

export const getFreshBalances = async (chain: string, wallet: string) => {
  return getFreshBalancesMap[chain](wallet);
};

export function useWalletsBalances(): UseWalletsBalances {
  const queryClient = useQueryClient();
  const chainsConnected = [
    'ETH',
    'AVAX',
    'BSC',
    'BTC',
    'BCH',
    'LTC',
    'GAIA',
    'DOGE',
    'THOR',
    'MAYA',
    'DASH',
    'KUJI',
    'ARB',
  ];

  const addresses = useAssertCurrentVaultAddreses();

  return useQueries({
    queries: chainsConnected.map((chain: string) => ({
      queryKey: [
        'balance',
        `${chain}-${addresses[convertSymbolToImagePath(chain) as keyof typeof addresses]}`,
      ],
      queryFn: async () => {
        const fetchedBalance = await getFreshBalances(
          chain,
          addresses[convertSymbolToImagePath(chain) as keyof typeof addresses]
        );
        console.log(fetchedBalance);
        return {
          [chain]: {
            ...fetchedBalance,
          },
        };
      },
      enabled: !!Object.keys(addresses).length,
      retry: 0,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      staleTime: Infinity,
    })),
    combine: (
      results: UseQueryResult<Record<string, GetBalanceResponse>>[]
    ) => {
      if (results.length) {
        const tokensWithBalances: any[] = [];
        const chainsBalances: Record<string, unknown> = {};
        let totalBalance = new BigNumber('0');
        results.forEach(({ data }) => {
          if (data) {
            const chain = Object.keys(data)[0];
            data[chain].balances.forEach(balance => {
              const provider = getSynthProvider(
                chain,
                balance.asset.isSynthetic || false
              );
              tokensWithBalances.push({
                id: balance.asset.symbol,
                chain: balance.asset.chain,
                ticker: balance.asset.ticker,
                icon: balance.asset.icon,
                name: balance.asset.name,
                decimals: balance.asset.decimals,
                contractAddress: balance.asset.contractAddress || null,
                chainId: balance.asset.chainId || null,
                provider: provider ? [provider] : undefined,
                synth: balance.asset.isSynthetic || false,
              });
            });
            queryClient.setQueryData(
              ['availableTokensForSend'],
              tokensWithBalances
            );
            chainsBalances[chain] = {
              nativeTokenForChain: data[chain].balances.find(
                item => item.asset.ticker === nativeTokenForChain[chain]
              ),
              balances: data[chain].balances.filter(
                item => item.asset.ticker !== nativeTokenForChain[chain]
              ),
              allBalances: data[chain].balances,
            };
            totalBalance = totalBalance.plus(
              new BigNumber(data[chain].totalInUsd)
            );
          }
        });
        return {
          chainsBalances,
          totalBalance: prepareNumberWithSeparators(totalBalance.toNumber(), 2),
        };
      }
    },
  } as any);
}
