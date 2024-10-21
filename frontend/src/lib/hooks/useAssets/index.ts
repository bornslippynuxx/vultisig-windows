import {
  DefaultError,
  UndefinedInitialDataOptions,
  useQuery,
} from '@tanstack/react-query';

import { ThorwalletApi } from '../../../services/Thorwallet';
import { ApiAsset } from '../../types/assets';
import { queryUrl } from '../../utils/query/queryUrl';

export default function useAssets() {
  return useQuery({
    queryKey: ['poolAssets'],
    queryFn: async () => {
      const endpoint = ThorwalletApi.fetchPoolAssets();

      const response = await queryUrl<ApiAsset[]>(endpoint);

      return prepareSynthsAssets(response);
    },
    retry: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: Infinity,
  } as UndefinedInitialDataOptions<unknown, DefaultError, ApiAsset[]>);
}

const prepareSynthsAssets = (assets: ApiAsset[]) => {
  const synths: ApiAsset[] = [];
  assets.forEach(asset => {
    if (!['THOR', 'MAYA'].includes(asset.chain)) {
      if (
        asset.provider?.includes('THORCHAIN') &&
        !synths
          .filter(synth => synth.chain === 'THOR')
          .some(synth => synth.ticker === asset.ticker)
      ) {
        synths.push({
          ...asset,
          chainId: null,
          decimals: 8,
          synth: true,
          provider: ['THORCHAIN'],
        });
      }
      if (
        asset.provider?.includes('MAYA') &&
        !synths
          .filter(synth => synth.chain === 'MAYA')
          .some(synth => synth.ticker === asset.ticker)
      ) {
        synths.push({
          ...asset,
          chainId: null,
          decimals: 8,
          synth: true,
          provider: ['MAYA'],
        });
      }
    }
  });
  return [
    ...assets.map(asset => ({ ...asset, synth: false, provider: undefined })),
    ...synths,
  ];
};
