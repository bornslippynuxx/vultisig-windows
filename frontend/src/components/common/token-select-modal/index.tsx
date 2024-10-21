import { Asset } from '@xchainjs/xchain-util';
import { ChangeEvent, useMemo, useState } from 'react';
import { FixedSizeList as List } from 'react-window';

import { getChainEntityIconSrc } from '../../../chain/utils/getChainEntityIconSrc';
import { useWalletsBalances } from '../../../lib/hooks/use-wallet-balances';
import useAssets from '../../../lib/hooks/useAssets';
import { ApiAsset } from '../../../lib/types/assets';
import ArrowDownIcon from '../../../lib/ui/icons/ArrowDownIcon';
import { SearchIcon } from '../../../lib/ui/icons/SearchIcon';
import WalletIcon from '../../../lib/ui/icons/WalletIcon';
import { nativeTokenForChain } from '../../../pages/swap/utils';
import {
  apiAssetToAsset,
  getAssetImage,
  normalizePossibleInvalidTokenName,
} from '../../../utils/assets';
import {
  convertSymbolToAssetName,
  convertSymbolToImagePath,
} from '../../../utils/crypto';
import ModalBase from '../modal';
import Select from '../select';
import NetworkSelectedChain from './NetworkSelectedChain';
import NetworkSelectOptions from './NetworkSelectOption';
import { AssetFilterType } from './types';
import { handleSortAvailableTokens } from './utils';

type TokenSelectPopupProps = {
  handleSelectToken: (value: ApiAsset) => void;
  selectedToken: ApiAsset;
  disabled: boolean;
  testId?: string;
  assets: ApiAsset[];
};

export default function TokenSelectPopup({
  handleSelectToken,
  selectedToken,
  disabled,
  testId,
  assets,
}: TokenSelectPopupProps) {
  const { data: poolAssets } = useAssets();
  const [chainFilter, setChainFilter] = useState<string | null>(null);
  const [tokenTypeFilter, setTokenTypeFilter] = useState<AssetFilterType>(
    AssetFilterType.ALL
  );
  const [searchValue, setSearchValue] = useState('');
  const allBalancesData = useWalletsBalances();
  // const allBalancesData = useWalletsBalances();
  // const { favouriteTokens, setFavouriteToken } = useLocalStorage();
  // const { isMobileDevice } = useIsMobileDevice();
  // const { data: poolsAssets } = useAssets();
  const [popupOpened, setPopupOpened] = useState(false);

  const handleOpenSelectTokenModal = () => {
    setPopupOpened(true);
  };

  const handleCloseSelectTokenModal = () => {
    setSearchValue('');
    setChainFilter(null);
    setTokenTypeFilter(AssetFilterType.ALL);
    setPopupOpened(false);
  };

  const handleChainSelected = (chain: string | null) => setChainFilter(chain);

  const handleSearchChanged = (e: ChangeEvent<HTMLInputElement>) =>
    setSearchValue(e.target.value);

  const tokenImage = getAssetImage(apiAssetToAsset(selectedToken), poolAssets);

  // const tokenImage =
  //   poolsAssets?.data.find(
  //     poolAsset =>
  //       poolAsset.chain === selectedToken?.chain &&
  //       poolAsset.ticker === selectedToken?.ticker
  //   )?.icon ||
  //   assets.find(
  //     asset =>
  //       asset.chain === selectedToken?.chain &&
  //       asset.ticker === selectedToken.ticker
  //   )?.icon ||
  //   '';

  const dataToDisplay = useMemo(() => {
    if (assets) {
      return handleSortAvailableTokens(
        assets,
        chainFilter,
        tokenTypeFilter,
        searchValue,
        allBalancesData
      );
    }
    return [];
  }, [allBalancesData, assets, chainFilter, searchValue, tokenTypeFilter]);

  // const isTokenFavourite = (chain: string, ticker: string) => {
  //   const favouriteTokens = JSON.parse(
  //     localStorage.getItem('favouriteTokens') || ''
  //   );
  //   if (favouriteTokens) {
  //     return favouriteTokens[chain].includes(ticker);
  //   }
  //   return false;
  // };

  // const handleStarClicked = (
  //   e: SyntheticEvent,
  //   chain: string,
  //   ticker: string
  // ) => {
  //   debugger;
  //   e.stopPropagation();
  //   e.preventDefault();
  //   const favouriteTokens = JSON.parse(
  //     localStorage.getItem('favouriteTokens') || ''
  //   );
  //   const isFavourite = isTokenFavourite(chain, ticker);
  //   console.log(isFavourite);
  //
  //   if (isFavourite) {
  //     const newState = {
  //       ...favouriteTokens,
  //       [chain]: favouriteTokens[chain].filter(
  //         (token: string) => token !== ticker
  //       ),
  //     };
  //     localStorage.setItem('favouriteTokens', JSON.stringify(newState));
  //     return;
  //   }
  //   const newState = {
  //     ...favouriteTokens,
  //     [chain]: favouriteTokens[chain]
  //       ? [...favouriteTokens[chain], ticker]
  //       : [ticker],
  //   };
  //   localStorage.setItem('favouriteTokens', JSON.stringify(newState));
  //   return;
  // };

  const onTokenSelect = async (asset: ApiAsset) => {
    handleSelectToken(asset);
    handleCloseSelectTokenModal();
  };

  const getTokenPrefix = (asset: Asset, synth: boolean) => {
    if (synth) {
      return 'Synth';
    }
    return nativeTokenForChain[asset.chain] === asset.ticker
      ? 'Native'
      : convertSymbolToAssetName(nativeTokenForChain[asset.chain]);
  };

  return (
    <>
      <button
        className="rounded-[12px] bg-blue-300 p-[8px] border-[1px] border-neutral-600 flex items-center justify-between gap-[9px] min-w-[146px]"
        onClick={handleOpenSelectTokenModal}
        type="button"
        disabled={disabled}
        data-test-id={testId}
      >
        <div className="gap-[6px] flex justify-center items-center">
          <div className="relative">
            <div className="[&>svg]:w-[20px] [&>svg]:h-[20px]">
              <img src={tokenImage} alt="asset" width={36} height={36} />
            </div>
            {nativeTokenForChain[selectedToken.chain] !==
              selectedToken.ticker && (
              <div
                className={`absolute`}
                style={{ bottom: '-2px', right: '-2px' }}
              >
                <img
                  src={getChainEntityIconSrc(
                    convertSymbolToImagePath(selectedToken.chain)
                  )}
                  alt="coin"
                  className="w-[10px] h-[10px]"
                />
              </div>
            )}
            {selectedToken.synth && (
              <div
                className="absolute"
                style={{ bottom: '-6px', right: '-6px' }}
              >
                <img
                  src={getChainEntityIconSrc(
                    convertSymbolToImagePath(
                      selectedToken?.provider?.[0] === 'THORCHAIN'
                        ? 'THOR'
                        : 'MAYA'
                    )
                  )}
                  alt="coin"
                  className="w-[10px] h-[10px]"
                />
              </div>
            )}
          </div>
          <div>
            <p className="text-[14px] text-left font-medium m-0">
              {selectedToken.ticker}
            </p>
            <span className="text-[14px] text-neutral-300 leading-tight font-light text-left">
              {nativeTokenForChain[selectedToken.chain] === selectedToken.ticker
                ? 'Native'
                : convertSymbolToAssetName(selectedToken.chain)}
            </span>
          </div>
        </div>
        <div className="px-[8px]">
          <ArrowDownIcon />
        </div>
      </button>
      {popupOpened && (
        <ModalBase
          title="Select a token"
          subtitle="Select a token from the list below to continue."
          open={popupOpened}
          onClose={handleCloseSelectTokenModal}
        >
          <div className="gap-[10px] mt-[20px] mb-[12px] flex items-center">
            <div
              className="bg-background-blue w-[216px] rounded-[8px] flex items-center gap-[15px] px-[13px] py-[5px] border-[1px] border-neutral-500"
              style={{
                color: '#7E9EA8',
              }}
            >
              <SearchIcon />
              <input
                placeholder="Search token"
                className="height-[unset] focus:outline-none w-[160px] py-[6px] bg-background-blue font-bold placeholder:text-neutral-200 placeholder:text-[12px]"
                onChange={handleSearchChanged}
              />
            </div>
            <Select
              selectedValue={<NetworkSelectedChain chainFilter={chainFilter} />}
              width={'[216px]'}
              options={
                <NetworkSelectOptions
                  handleChainSelected={handleChainSelected}
                />
              }
            />
          </div>
          <div className="rounded-[12px] p-[4px] border-[1px] border-neutral-500 mb-[16px] flex gap-[2px]">
            {[
              AssetFilterType.ALL,
              // AssetFilterType.FAVOURITES,
              AssetFilterType.ERC20,
              AssetFilterType.BEP20,
              AssetFilterType.SYNTH,
            ].map(item => (
              <button
                key={item}
                className={`rounded-[10px] py-[8px] flex-1 font-regular hover:bg-neutral-700 text-neutral-300 ${
                  item === tokenTypeFilter ? 'bg-neutral-700 text-white' : ''
                }`}
                onClick={() => setTokenTypeFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="rounded-[12px] border-[1px] border-neutral-500 p-[10px] bg-unset overflow-y-scroll flex w-full flex-col h-[370px]">
            {dataToDisplay.length ? (
              <List
                itemCount={dataToDisplay.length}
                height={370}
                itemSize={60}
                width="100%"
              >
                {({ index, style }) => {
                  const asset = dataToDisplay[index];
                  return (
                    <div>
                      <button
                        onClick={() => onTokenSelect(asset)}
                        onMouseDown={() => onTokenSelect(asset)}
                        className="py-[6px] px-[10px] justify-between w-full cursor-pointer hover:bg-neutral-700 rounded-[12px] flex items-center"
                        style={style}
                        onTouchEnd={() => onTokenSelect(asset)}
                      >
                        <div className="gap-[12px] flex items-center ">
                          <div className="relative">
                            <img
                              src={getAssetImage(
                                apiAssetToAsset(asset),
                                assets
                              )}
                              alt="coin"
                              className="w-[36px] h-[36px]"
                            />
                            {(nativeTokenForChain[asset.chain] !==
                              asset.ticker ||
                              asset.chain === 'ARB') && (
                              <img
                                src={getChainEntityIconSrc(
                                  convertSymbolToImagePath(asset.chain)
                                )}
                                alt="coin"
                                className="w-[12px] h-[12px] absolute bottom-0 right-0"
                              />
                            )}
                            {asset.synth && asset.provider && (
                              <img
                                src={getChainEntityIconSrc(
                                  asset.provider[0] === 'THORCHAIN'
                                    ? 'THORCHAIN'
                                    : 'MAYAChain'
                                )}
                                alt="provider"
                                className="w-[12px] h-[12px] absolute -bottom-[4px] -right-[4px]"
                              />
                            )}
                            {/*<AssetSynthIcon provider={asset.provider} />*/}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[20px] text-left font-medium">
                              {normalizePossibleInvalidTokenName(asset.ticker)}
                            </span>
                            <span className="text-[12px] text-left font-light">
                              {getTokenPrefix(apiAssetToAsset(asset), false)}
                            </span>
                          </div>
                        </div>
                        <div className="gap-[18px] flex items-center">
                          <div>
                            <div className="gap-[4px] flex items-center">
                              <WalletIcon />
                              <span className="font-medium">
                                {asset.balanceRaw}{' '}
                                {normalizePossibleInvalidTokenName(
                                  asset.ticker
                                )}
                              </span>
                            </div>
                            {/*<span className="text-neutral-300 text-right font-medium">*/}
                            {/*  ${prepareNumberWithSeparators(asset.balanceUsd)}*/}
                            {/*</span>*/}
                          </div>
                          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions */}
                          {/*<div*/}
                          {/*  onClick={e =>*/}
                          {/*    handleStarClicked(e, asset.chain, asset.ticker)*/}
                          {/*  }*/}
                          {/*>*/}
                          {/*  {isTokenFavourite(asset.chain, asset.ticker) ? (*/}
                          {/*    <FilledStarIcon />*/}
                          {/*  ) : (*/}
                          {/*    <UnfilledStarIcon />*/}
                          {/*  )}*/}
                          {/*</div>*/}
                        </div>
                      </button>
                    </div>
                  );
                }}
              </List>
            ) : (
              <span className="text-center mt-[12px] font-bold">
                No tokens matched these filters.
              </span>
            )}
          </div>
        </ModalBase>
      )}
    </>
  );
}
