import { ThorwalletApi } from '../../../services/Thorwallet';
import { GetBalanceResponse } from '../../types/balances';
import { thorWalletQueryUrl } from '../../utils/query/queryUrl';

type GetBalance = (wallet: string) => Promise<GetBalanceResponse>;

export const getFreshBalancesMap: {
  [key in string]: GetBalance;
} = {
  BCH: async wallet => {
    return await fetchBCHBalances(wallet);
  },
  BNB: async wallet => {
    return await fetchBNBBalances(wallet);
  },
  BTC: async wallet => {
    return await fetchBTCBalances(wallet);
  },
  DOGE: async wallet => {
    return await fetchDOGEBalances(wallet);
  },
  ETH: async wallet => {
    return await fetchETHBalances(wallet);
  },
  LTC: async wallet => {
    return await fetchLTCBalances(wallet);
  },
  THOR: async wallet => {
    return await fetchTHORBalances(wallet);
  },
  GAIA: async wallet => {
    return await fetchCosmosBalances(wallet);
  },
  AVAX: async wallet => {
    return await fetchAVAXBalances(wallet);
  },
  BSC: async wallet => {
    return await fetchBSCBalances(wallet);
  },
  MAYA: async wallet => {
    return await fetchMAYABalances(wallet);
  },
  DASH: async wallet => {
    return await fetchDASHBalances(wallet);
  },
  KUJI: async wallet => {
    return await fetchKujiraBalances(wallet);
  },
  ARB: async wallet => {
    return await fetchArbBalances(wallet);
  },
};

const fetchETHBalances = async (
  wallet: string
): Promise<GetBalanceResponse> => {
  const endpoint = ThorwalletApi.fetchETHBalances(wallet);
  return await thorWalletQueryUrl<GetBalanceResponse>(endpoint);
};

const fetchArbBalances = async (
  wallet: string
): Promise<GetBalanceResponse> => {
  const endpoint = ThorwalletApi.fetchArbBalances(wallet);
  return await thorWalletQueryUrl<GetBalanceResponse>(endpoint);
};

const fetchBTCBalances = async (
  wallet: string
): Promise<GetBalanceResponse> => {
  const endpoint = ThorwalletApi.fetchBTCBalances(wallet);
  return await thorWalletQueryUrl<GetBalanceResponse>(endpoint);
};

const fetchBCHBalances = async (
  wallet: string
): Promise<GetBalanceResponse> => {
  const endpoint = ThorwalletApi.fetchBCHBalances(wallet);
  return await thorWalletQueryUrl<GetBalanceResponse>(endpoint);
};

const fetchLTCBalances = async (
  wallet: string
): Promise<GetBalanceResponse> => {
  const endpoint = ThorwalletApi.fetchLTCBalances(wallet);
  return await thorWalletQueryUrl<GetBalanceResponse>(endpoint);
};

const fetchDOGEBalances = async (
  wallet: string
): Promise<GetBalanceResponse> => {
  const endpoint = ThorwalletApi.fetchDOGEBalances(wallet);
  return await thorWalletQueryUrl<GetBalanceResponse>(endpoint);
};

const fetchDASHBalances = async (
  wallet: string
): Promise<GetBalanceResponse> => {
  const endpoint = ThorwalletApi.fetchDASHBalances(wallet);
  return await thorWalletQueryUrl<GetBalanceResponse>(endpoint);
};

const fetchTHORBalances = async (
  wallet: string
): Promise<GetBalanceResponse> => {
  const endpoint = ThorwalletApi.fetchThorBalances(wallet);
  return await thorWalletQueryUrl<GetBalanceResponse>(endpoint);
};

const fetchBNBBalances = async (
  wallet: string
): Promise<GetBalanceResponse> => {
  const endpoint = ThorwalletApi.fetchBNBBalances(wallet);
  return await thorWalletQueryUrl<GetBalanceResponse>(endpoint);
};

const fetchBSCBalances = async (
  wallet: string
): Promise<GetBalanceResponse> => {
  const endpoint = ThorwalletApi.fetchBSCBalances(wallet);
  return await thorWalletQueryUrl<GetBalanceResponse>(endpoint);
};

const fetchAVAXBalances = async (
  wallet: string
): Promise<GetBalanceResponse> => {
  const endpoint = ThorwalletApi.fetchAVAXBalances(wallet);
  return await thorWalletQueryUrl<GetBalanceResponse>(endpoint);
};

const fetchCosmosBalances = async (
  wallet: string
): Promise<GetBalanceResponse> => {
  const endpoint = ThorwalletApi.fetchCosmosBalances(wallet);
  return await thorWalletQueryUrl<GetBalanceResponse>(endpoint);
};

const fetchMAYABalances = async (
  wallet: string
): Promise<GetBalanceResponse> => {
  const endpoint = ThorwalletApi.fetchMAYABalances(wallet);
  return await thorWalletQueryUrl<GetBalanceResponse>(endpoint);
};

const fetchKujiraBalances = async (
  wallet: string
): Promise<GetBalanceResponse> => {
  const endpoint = ThorwalletApi.fetchKujiraBalances(wallet);
  return await thorWalletQueryUrl<GetBalanceResponse>(endpoint);
};
