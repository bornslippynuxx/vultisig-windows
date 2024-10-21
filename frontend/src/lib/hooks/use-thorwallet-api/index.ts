import { SwapQuoteParams, SwapQuoteResponse } from '../../../pages/swap/types';
import { ThorwalletApi } from '../../../services/Thorwallet';
import { SwapPairsAsset, SynthProvider } from '../../types/assets';
import { GasFeeResponse, SendFeeRequestParams } from '../../types/fee';
import { InboundAddress } from '../../types/swap-providers';
import { queryUrl, thorWalletQueryUrl } from '../../utils/query/queryUrl';

export const useThorwalletApi = () => {
  const getMAYAActualInboundAddresses = async () => {
    const endpoint = ThorwalletApi.getMayaAddresses();
    return await queryUrl<InboundAddress[]>(endpoint);
  };

  const getTHORActualInboundAddresses = async () => {
    const endpoint = ThorwalletApi.getThorchainIboundAddresses();
    return await queryUrl<InboundAddress[]>(endpoint);
  };

  const getTxSendFee = async (params: SendFeeRequestParams) => {
    const endpoint = ThorwalletApi.getTxSendFee();
    return await thorWalletQueryUrl<GasFeeResponse, SendFeeRequestParams>(
      endpoint,
      'POST',
      params
    );
  };

  const getSwapQuotes = async (params: SwapQuoteParams) => {
    const endpoint = ThorwalletApi.getSwapQuotes(params);
    return await thorWalletQueryUrl<SwapQuoteResponse>(endpoint);
  };

  const getSwapPairs = async (
    chain: string,
    ticker: string,
    isSynth: boolean,
    contractAddress: string,
    provider?: SynthProvider[]
  ) => {
    const endpoint = ThorwalletApi.getSwapPairs(
      chain,
      ticker,
      isSynth,
      contractAddress,
      provider
    );
    return await thorWalletQueryUrl<SwapPairsAsset[]>(endpoint);
  };

  return {
    getMAYAActualInboundAddresses,
    getTHORActualInboundAddresses,
    getTxSendFee,
    getSwapQuotes,
    getSwapPairs,
  };
};
