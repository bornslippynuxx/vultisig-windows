import {
  PersistentStateKey,
  usePersistentState,
} from '../../../state/persistentState';

export function useFavouriteTokens() {
  return usePersistentState<Record<string, string[]>>(
    PersistentStateKey.FavouriteTokens,
    {
      ETH: [],
      AVAX: [],
      BSC: [],
      BTC: [],
      BCH: [],
      LTC: [],
      BNB: [],
      GAIA: [],
      DOGE: [],
      THOR: [],
      MAYA: [],
      DASH: [],
      KUJI: [],
      ARB: [],
    }
  );
}
