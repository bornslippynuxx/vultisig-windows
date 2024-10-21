import { useQueryClient } from '@tanstack/react-query';
import { Asset, assetToString } from '@xchainjs/xchain-util';
import BigNumber from 'bignumber.js';
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useLocation } from 'react-router-dom';

import ApproveModal from '../../components/common/approve-modal';
import DecimalInput from '../../components/common/decimal-input';
import Skeleton from '../../components/common/skeleton';
import TokenSelectPopup from '../../components/common/token-select-modal';
import TokenUsdValue from '../../components/common/token-usd-value';
import { useSwapPairs } from '../../lib/hooks/use-swap-pairs';
import { useThorwalletApi } from '../../lib/hooks/use-thorwallet-api';
import {
  getFreshBalances,
  useWalletsBalances,
} from '../../lib/hooks/use-wallet-balances';
import useAssets from '../../lib/hooks/useAssets';
import { ApiAsset } from '../../lib/types/assets';
import { SendFee, SendFeeRequestParams } from '../../lib/types/fee';
import { InboundAddress } from '../../lib/types/swap-providers';
import StyledButton from '../../lib/ui/buttons/StyledButton';
import SwapIcon from '../../lib/ui/icons/SwapIcon';
import WarningIcon from '../../lib/ui/icons/WarningIcon';
import { TextInput } from '../../lib/ui/inputs/TextInput';
import { Spinner } from '../../lib/ui/loaders/Spinner';
import { debounce } from '../../lib/utils/debounce';
import { queryUrl } from '../../lib/utils/query/queryUrl';
import { ThorwalletApi } from '../../services/Thorwallet';
import { apiAssetToAsset } from '../../utils/assets';
import { getContractAllowance } from '../../utils/blockchain';
import { convertSymbolToImagePath, getSourceChain } from '../../utils/crypto';
import {
  calculateFeeRaw,
  checkIsFeeNotEnoughForSend,
  prepareMaxAmount,
  prepareTxFee,
} from '../../utils/fee';
import { useAssertCurrentVaultAddreses } from '../../vault/state/useCurrentVault';
import SwapConfirmationModal from './SwapConfirmationModal';
import SwapInfoModal from './SwapInfoModal';
import SwapOutput from './SwapOutput';
import { SwapProtocolType, SwapQuote, SwapQuoteParams } from './types';
import {
  convertSeconds,
  getOutputAssetAmount,
  isEvmErc20Asset,
  nativeTokenForChain,
  rawToBignumber,
  tokenAmountToRaw,
  tokenRawAmountToNumber,
} from './utils';

// const affiliateName = process.env.NEXT_PUBLIC_AFFILIATE_NAME;

const defaultFromToken: ApiAsset = {
  id: '002a895b-3390-425c-b064-087df9018960',
  chain: 'BTC',
  ticker: 'BTC',
  icon: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png?1547033579',
  name: 'Bitcoin',
  decimals: 8,
  contractAddress: '',
  status: 'available',
  chainId: null,
  provider: ['THORCHAIN'],
  symbol: 'BTC.BTC',
  synth: false,
};

const defaultToToken: ApiAsset = {
  id: '3266f9e9-0755-4dc2-bed0-02538310a11a',
  chain: 'ETH',
  ticker: 'ETH',
  icon: 'https://icons-crypto.s3.eu-central-1.amazonaws.com/eth.png',
  name: 'Ethereum',
  decimals: 18,
  contractAddress: '',
  status: 'available',
  chainId: 1,
  provider: ['THORCHAIN'],
  symbol: 'ETH.ETH',
  synth: false,
};

export default function SwapCryptoView() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const searchParams = new URLSearchParams(location.search);
  const allBalancesData = useWalletsBalances();
  const preselectedAmount = searchParams.get('amount');
  const addresses = useAssertCurrentVaultAddreses();
  const {
    getMAYAActualInboundAddresses,
    getTHORActualInboundAddresses,
    getTxSendFee,
    getSwapQuotes,
  } = useThorwalletApi();

  const { data: assetsData, isLoading: assetsLoading } = useAssets();
  const [fromToken, setFromToken] = useState<ApiAsset>(defaultFromToken);
  const { data: swapPairsData, isLoading: isSwapPairsLoading } =
    useSwapPairs(fromToken);

  const [toToken, setToToken] = useState<ApiAsset>(defaultToToken);
  const [amountError, setAmountError] = useState<string>('');
  const [fromAmount, setFromAmount] = useState<string>('');
  const [toAmount, setToAmount] = useState<string>('');
  const [swapProtocol, setSwapProtocol] = useState<SwapProtocolType | null>(
    null
  );
  const [priceOptimisedQuote, setPriceOptimisedQuote] =
    useState<SwapQuote | null>(null);
  const [mayaQuote, setMayaQuote] = useState<SwapQuote | null>(null);
  const [mayaStreamingQuote, setMayaStreamingQuote] =
    useState<SwapQuote | null>(null);
  const [timeOptimisedQuote, setTimeOptimisedQuote] =
    useState<SwapQuote | null>(null);
  const [customSwapError, setCustomSwapError] = useState<string>('');
  const [swapState] = useState<null>(null);
  const [swapQuotesLoading, setSwapQuotesLoading] = useState<boolean>(false);
  const [confirmationModalOpened, setConfirmationModalOpened] =
    useState<boolean>(false);
  const [customRecipientAddress, setCustomRecipientAddress] =
    useState<string>('');
  const [isSwapLoading] = useState<boolean>(false);
  const [inboundFee, setInboundFee] = useState<SendFee | null>(null);
  const [fromNativeTokenPrice, setFromNativeTokenPrice] = useState<number>(0);
  const [swapInfoPopupOpen, setSwapInfoPopupOpen] = useState<boolean>(false);
  const [showQuoteError, setShowQuoteError] = useState<boolean>(false);
  const [showQuoteErrorText, setShowQuoteErrorText] = useState<string>('');
  const [isMax, setIsMax] = useState(false);
  const [preselectedPriceLoading] = useState(false);
  const [approveNeeded, setApproveNeeded] = useState(false);
  const [approveModalOpened, setApproveModalOpened] = useState(false);

  // const { handleTxInitiated } = useSignSingleTransaction();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const checkAllowance = async (
    contractAddress: string,
    chainId: number,
    address: string,
    router: string
  ) => {
    const allowance = await getContractAllowance({
      contractAddress,
      chainId,
      address,
      router,
    });
    if (
      new BigNumber(allowance).isLessThan(
        new BigNumber(tokenAmountToRaw(fromAmount, fromToken.decimals))
      )
    ) {
      setApproveNeeded(true);
      return;
    }
    setApproveNeeded(false);
  };

  // Todo change sourceChain
  const fromTokenSourceChain = getSourceChain(
    fromToken.chain,
    fromToken.synth,
    fromToken.provider
  );

  const toTokenSourceChain = getSourceChain(
    toToken.chain,
    toToken.synth,
    toToken.provider
  );

  const selectedAsset = useMemo(() => {
    if (allBalancesData) {
      return allBalancesData.chainsBalances[
        fromTokenSourceChain
      ]?.allBalances.find(item => {
        if (fromTokenSourceChain === 'ARB') {
          return (
            item.asset.ticker === fromToken.ticker &&
            item.asset.contractAddress.toLowerCase() ===
              fromToken.contractAddress.toLowerCase()
          );
        }
        return item.asset.ticker === fromToken.ticker;
      });
    }
  }, [allBalancesData, fromToken, fromTokenSourceChain]);

  // const assetInAssetFormat: Asset = {
  //   chain: selectedAsset?.asset.chain || '',
  //   symbol: selectedAsset?.asset.symbol || '',
  //   ticker: selectedAsset?.asset.ticker || '',
  //   synth: selectedAsset?.asset.isSynthetic || false,
  // };

  // const selectedToAsset = useMemo(() => {
  //   if (allBalancesData && toToken) {
  //     const token = allBalancesData.chainsBalances[
  //       toTokenSourceChain
  //     ]?.allBalances.find(item => {
  //       if (toTokenSourceChain === 'ARB') {
  //         return (
  //           item.asset.ticker === toToken.ticker &&
  //           item.asset.contractAddress.toLowerCase() ===
  //             toToken.contractAddress.toLowerCase()
  //         );
  //       }
  //       return item.asset.ticker === toToken.ticker;
  //     });
  //     return token ? token : prepareDumbAsset(toToken);
  //   }
  //   return prepareDumbAsset(toToken);
  // }, [allBalancesData, toToken, toTokenSourceChain]);

  const isWalletConnected = true;

  // const isWalletConnected = useMemo(() => {
  //   return Object.keys(chainsConnected).some(
  //     chain => !!chainsConnected[chain].activeWallet
  //   );
  // }, [chainsConnected]);

  const nativeTokenBalance = useMemo(() => {
    if (allBalancesData) {
      return (
        allBalancesData.chainsBalances[fromTokenSourceChain]
          ?.nativeTokenForChain.rawAmount || '0'
      );
    }
  }, [fromTokenSourceChain, allBalancesData]);

  const selectedMemo = useMemo(() => {
    switch (swapProtocol) {
      case SwapProtocolType.THORPriceOptimised:
        return priceOptimisedQuote?.memo;
      case SwapProtocolType.THORTimeOptimised:
        return timeOptimisedQuote?.memo;
      case SwapProtocolType.MAYA:
        return mayaQuote?.memo;
      case SwapProtocolType.MAYA_STREAMING:
        return mayaStreamingQuote?.memo;
      default:
        return '';
    }
  }, [
    swapProtocol,
    priceOptimisedQuote,
    timeOptimisedQuote,
    mayaQuote,
    mayaStreamingQuote,
  ]);

  const selectedSwapQuote = useMemo(() => {
    switch (swapProtocol) {
      case SwapProtocolType.THORPriceOptimised:
        return priceOptimisedQuote;
      case SwapProtocolType.THORTimeOptimised:
        return timeOptimisedQuote;
      case SwapProtocolType.MAYA:
        return mayaQuote;
      case SwapProtocolType.MAYA_STREAMING:
        return mayaStreamingQuote;
      default:
        return null;
    }
  }, [
    swapProtocol,
    priceOptimisedQuote,
    timeOptimisedQuote,
    mayaQuote,
    mayaStreamingQuote,
  ]);

  const recipientAddress = useMemo(() => {
    return (
      customRecipientAddress ||
      addresses[
        convertSymbolToImagePath(toTokenSourceChain) as keyof typeof addresses
      ]
    );
  }, [toTokenSourceChain, customRecipientAddress, addresses]);

  const selectedSwapOptimisedTime = useMemo(() => {
    if (swapProtocol === SwapProtocolType.MAYA) {
      return convertSeconds(mayaQuote?.outbound_delay_seconds);
    }
    if (swapProtocol === SwapProtocolType.MAYA_STREAMING) {
      return convertSeconds(mayaStreamingQuote?.outbound_delay_seconds);
    }
    return convertSeconds(
      swapProtocol === SwapProtocolType.THORPriceOptimised
        ? timeOptimisedQuote?.streaming_swap_seconds
        : priceOptimisedQuote?.streaming_swap_seconds,
      swapProtocol === SwapProtocolType.THORTimeOptimised
        ? timeOptimisedQuote?.total_swap_seconds
        : priceOptimisedQuote?.total_swap_seconds
    );
  }, [
    swapProtocol,
    timeOptimisedQuote,
    priceOptimisedQuote,
    mayaQuote,
    mayaStreamingQuote,
  ]);

  // const selectedOutputFee = useMemo(() => {
  //   let totalFee;
  //
  //   switch (swapProtocol) {
  //     case SwapProtocolType.THORTimeOptimised:
  //       totalFee = timeOptimisedQuote?.fees.total;
  //       break;
  //     case SwapProtocolType.THORPriceOptimised:
  //       totalFee = priceOptimisedQuote?.fees.total;
  //       break;
  //     case SwapProtocolType.MAYA:
  //       totalFee = new BigNumber(mayaQuote?.fees.outbound as string)
  //         .plus(new BigNumber(mayaQuote?.fees.affiliate as string))
  //         .toString();
  //       break;
  //     case SwapProtocolType.MAYA_STREAMING:
  //       totalFee = new BigNumber(mayaStreamingQuote?.fees.outbound as string)
  //         .plus(new BigNumber(mayaStreamingQuote?.fees.affiliate as string))
  //         .toString();
  //       break;
  //     default:
  //       break;
  //   }
  //   return totalFee;
  // }, [
  //   swapProtocol,
  //   timeOptimisedQuote,
  //   priceOptimisedQuote,
  //   mayaQuote,
  //   mayaStreamingQuote,
  // ]);

  const outputAssetAmount = useMemo(() => {
    if (selectedSwapQuote) {
      return getOutputAssetAmount(
        selectedSwapQuote.expected_amount_out,
        toTokenSourceChain === 'MAYA'
      );
    }
    return '';
  }, [selectedSwapQuote, toTokenSourceChain]);

  const isNativeBalanceNotEnoughToSwap = useMemo(() => {
    if (inboundFee && allBalancesData && selectedAsset) {
      // if (fromTokenSourceChain === 'XRD') {
      //   return new BigNumber(fromAmount)
      //     .plus(new BigNumber(inboundFee?.baseFee || '1'))
      //     .isGreaterThan(
      //       new BigNumber(tokenRawAmountToNumber(nativeTokenBalance || '1', 18))
      //     );
      // }
      return checkIsFeeNotEnoughForSend(
        inboundFee,
        fromTokenSourceChain,
        selectedAsset.asset.ticker,
        tokenAmountToRaw(fromAmount, selectedAsset?.asset.decimals || 18),
        nativeTokenBalance as string
      );
    }
  }, [
    inboundFee,
    allBalancesData,
    fromTokenSourceChain,
    nativeTokenBalance,
    selectedAsset,
    fromAmount,
  ]);

  // const swapButtonDisabled = useMemo(() => {
  //   return (
  //     !fromAmount ||
  //     !!amountError ||
  //     !selectedAsset ||
  //     swapQuotesLoading ||
  //     !!customSwapError ||
  //     !swapProtocol ||
  //     isSwapLoading ||
  //     showQuoteError ||
  //     isNativeBalanceNotEnoughToSwap
  //   );
  // }, [
  //   fromAmount,
  //   amountError,
  //   selectedAsset,
  //   swapQuotesLoading,
  //   customSwapError,
  //   swapProtocol,
  //   isSwapLoading,
  //   showQuoteError,
  //   isNativeBalanceNotEnoughToSwap,
  // ]);

  // const displayFromBalance = useMemo(() => {
  //   return selectedAsset
  //     ? tokenRawAmountToNumber(
  //         selectedAsset.rawAmount,
  //         selectedAsset.asset.decimals
  //       )
  //     : '0.00';
  // }, [selectedAsset]);

  // const displayToBalance = useMemo(() => {
  //   return selectedToAsset
  //     ? tokenRawAmountToNumber(
  //         selectedToAsset.rawAmount,
  //         selectedToAsset.asset.decimals
  //       )
  //     : '0.00';
  // }, [selectedToAsset]);

  const swapButtonText = useMemo(() => {
    if (isSwapLoading) {
      return (
        <div className="flex items-center">
          <Spinner />
        </div>
      );
    }
    if (approveNeeded) {
      return 'Approve';
    }
    if (
      selectedAsset &&
      allBalancesData &&
      nativeTokenBalance &&
      selectedSwapQuote
    ) {
      return !isNativeBalanceNotEnoughToSwap
        ? 'Preview Swap'
        : 'Insufficient funds to cover fee';
    }
    return 'Preview Swap';
  }, [
    selectedAsset,
    allBalancesData,
    nativeTokenBalance,
    selectedSwapQuote,
    isNativeBalanceNotEnoughToSwap,
    isSwapLoading,
    approveNeeded,
  ]);

  // const getSelectedInboundAddress = () => {
  //   if (!['ETH', 'AVAX', 'BSC'].includes(fromTokenSourceChain)) {
  //     return selectedSwapQuote?.inbound_address;
  //   }
  //   if (nativeTokenForChain[fromToken.ticker]) {
  //     return selectedSwapQuote?.inbound_address;
  //   }
  //   return selectedSwapQuote?.router;
  // };

  // const handleRefreshTokenPrices = () => refreshTokenQuote();
  //
  const handleSelectFromToken = (token: ApiAsset) => {
    setFromToken(token);
  };
  //
  const handleSelectToToken = (token: ApiAsset) => {
    setToToken(token);
    setCustomRecipientAddress('');
  };

  const handleSwitchFromTo = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setToAmount('');
    setFromAmount(toAmount);
    setIsMax(false);
  };

  // const refreshTokenQuote = async () => {
  //   await queryClient.refetchQueries({
  //     queryKey: ['price', getTokenToFetch(fromToken)],
  //     exact: true,
  //   });
  //   if (fromToken.ticker !== toToken.ticker) {
  //     await queryClient.refetchQueries({
  //       queryKey: ['price', getTokenToFetch(toToken)],
  //       exact: true,
  //     });
  //   }
  // };

  const handleInputChange = useCallback(
    (amount: string) => {
      if (isMax) {
        setIsMax(false);
      }
      if (customSwapError) {
        setCustomSwapError('');
      }
      setFromAmount(amount);
      setShowQuoteError(false);
      setShowQuoteErrorText('');
      if (amount === '') {
        setPriceOptimisedQuote(null);
        setTimeOptimisedQuote(null);
        // Todo add erase for other protocols
        setSwapProtocol(null);
        setMayaQuote(null);
        setToAmount('');
      }
    },
    [customSwapError, isMax]
  );

  const validateFromAmount = useCallback(
    (amount: string) => {
      if (selectedAsset) {
        const balance = selectedAsset.rawAmount;
        if (amount && !+amount) {
          setAmountError('Invalid value');
          return;
        }
        if (
          new BigNumber(balance).isLessThan(
            new BigNumber(tokenAmountToRaw(amount, fromToken.decimals))
          )
        ) {
          setAmountError('Insufficient funds');
          return;
        }
        setAmountError('');
        return;
      }
      if (amount) {
        setAmountError('Insufficient funds');
        return;
      }
      return;
    },
    [fromToken.decimals, selectedAsset]
  );

  // const closeSettingsMenu = () => {
  //   setSettingsMenuOpened(false);
  // };

  // const addTxToStatistic = async (hash: string, preparedAsset: Asset) => {
  //   try {
  //     await addTxToStats({
  //       type: 'double-swap',
  //       txHash: hash,
  //       fromAddress: chainsConnected[fromTokenSourceChain].address,
  //       poolAsset: preparedAsset,
  //       toAsset: {
  //         chain: selectedToAsset.asset.chain,
  //         symbol: selectedToAsset.asset.symbol,
  //         ticker: selectedToAsset.asset.ticker,
  //         synth: selectedToAsset.asset.isSynthetic,
  //       } as Asset,
  //       fromAsset: preparedAsset,
  //       amount: assetAmount(fromAmount, selectedAsset?.asset.decimals),
  //       fromAssetPrice: new BigNumber(fromPrice),
  //       memo: selectedMemo || null,
  //       chain:
  //         swapProtocol === SwapProtocolType.MAYA ||
  //         swapProtocol === SwapProtocolType.MAYA_STREAMING
  //           ? 'MAYA'
  //           : 'TC', // <-- TODO: as more protocols are added, add them here too
  //     });
  //   } catch (e) {
  //     console.log('- stats', e);
  //   }
  // };

  // const isAssetToSend = (asset: Asset) => {
  //   const isThorAsset = isThorchainAsset(
  //     asset.synth,
  //     asset.chain,
  //     asset.ticker
  //   );
  //   const isCacao = isCacaoAsset(asset.chain as Chain, asset.ticker);
  //   const isMaya =
  //     swapProtocol === SwapProtocolType.MAYA_STREAMING ||
  //     swapProtocol === SwapProtocolType.MAYA;
  //   const provider = fromToken.isSynth ? fromToken.provider : undefined;
  //   if (isThorAsset || isCacao) {
  //     if ((isCacao && isMaya) || (provider && provider[0] === 'MAYA')) {
  //       return false;
  //     } else if (isMaya) {
  //       return true;
  //     }
  //
  //     return true;
  //   }
  //   return !isEvmErc20Asset(asset);
  // };

  const handleSwap = async () => {
    if (approveNeeded) {
      setApproveModalOpened(true);
      return;
    }
  };

  // const handleSwap = async () => {
  //   console.log('swap');
  //   if (inboundFee) {
  //     try {
  //       setSwapLoading(true);
  //       const transferAmount = tokenAmountToRaw(
  //         fromAmount,
  //         fromToken.decimals || 18
  //       );
  //       if (!selectedToAsset || !selectedAsset) return;
  //
  //       const preparedAsset: Asset = {
  //         symbol: selectedAsset.asset.symbol as string,
  //         ticker: selectedAsset.asset.ticker as string,
  //         synth: selectedAsset.asset.isSynthetic || false,
  //         chain: fromTokenSourceChain as Chain,
  //       };
  //
  //       let isSecurity = true;
  //
  //       if (
  //         swapProtocol === SwapProtocolType.THORPriceOptimised ||
  //         swapProtocol === SwapProtocolType.THORTimeOptimised
  //       ) {
  //         isSecurity = await checkThorchainInboundAddress(
  //           fromTokenSourceChain,
  //           fromToken.ticker,
  //           getSelectedInboundAddress() as string
  //         );
  //       }
  //
  //       if (
  //         (swapProtocol === SwapProtocolType.MAYA ||
  //           swapProtocol === SwapProtocolType.MAYA_STREAMING) &&
  //         fromTokenSourceChain !== 'MAYA'
  //       ) {
  //         isSecurity = await checkMayaInboundAddress(
  //           fromTokenSourceChain,
  //           fromToken.ticker,
  //           getSelectedInboundAddress() as string
  //         );
  //       }
  //
  //       if (!isSecurity) {
  //         setSwapState({
  //           type: 'error',
  //           asset: selectedAsset?.asset as WalletAsset,
  //           amount: fromAmount,
  //           txUrl: '',
  //           error: 'Security addresses check failed',
  //         });
  //         setSwapLoading(false);
  //         return;
  //       }
  //
  //       const chainFromBalance: any = await getFreshBalances({
  //         wallet: chainsConnected[fromTokenSourceChain].address,
  //         chain: fromTokenSourceChain,
  //       });
  //
  //       const nativeBalance = chainFromBalance.balances.find(
  //         (balance: any) =>
  //           balance.asset.ticker === nativeTokenForChain[fromTokenSourceChain]
  //       ).rawAmount;
  //
  //       const isBalanceNotEnough = checkIsFeeNotEnoughForSend(
  //         inboundFee,
  //         fromTokenSourceChain,
  //         selectedAsset.asset.ticker,
  //         transferAmount,
  //         nativeBalance
  //       );
  //       if (isBalanceNotEnough) {
  //         setSwapState({
  //           type: 'error',
  //           asset: selectedAsset?.asset as WalletAsset,
  //           sourceChain: fromTokenSourceChain,
  //           amount: fromAmount,
  //           txUrl: '',
  //           error: 'Insufficient funds to cover fee.',
  //         });
  //         return;
  //       }
  //
  //       const feeRaw = calculateFeeRaw(inboundFee);
  //       if (!feeRaw) return;
  //
  //       const calculatedAmount = nativeTokenForChain[fromToken.ticker]
  //         ? prepareMaxAmount(
  //             fromAmount,
  //             fromToken.decimals || 18,
  //             feeRaw,
  //             nativeBalance
  //           )
  //         : transferAmount;
  //
  //       const transactions: TransactionDataParams[] = [];
  //
  //       if (isEvmErc20Asset(preparedAsset)) {
  //         const allowance = await getThorchainContractAllowance({
  //           fromAsset: selectedAsset?.asset as WalletAsset,
  //           router: selectedSwapQuote?.router?.toLowerCase() || '',
  //           address: chainsConnected[fromTokenSourceChain].address,
  //         });
  //         const approveFeeParams: SendFeeRequestParams = {
  //           senderAddress: chainsConnected[fromTokenSourceChain].address || '',
  //           recipientAddress: selectedSwapQuote?.router?.toLowerCase() || '',
  //           amount: '1000000000000000000000000000',
  //           asset: {
  //             chain: fromTokenSourceChain,
  //             ticker: selectedAsset.asset.ticker,
  //             isSynth: false,
  //             ...(selectedAsset.asset.contractAddress
  //               ? { contractAddress: selectedAsset.asset.contractAddress }
  //               : {}),
  //           },
  //           txType: 'allowance',
  //         };
  //         const { data } = await getTxSendFee(approveFeeParams);
  //         const approveFeeData = await prepareTxFee(data);
  //         const allowanceBig = new BigNumber(allowance);
  //         const commonApproveParams = {
  //           chain: fromTokenSourceChain,
  //           address: chainsConnected[fromTokenSourceChain].address,
  //           type: 'Approve' as TransactionType,
  //           params: {
  //             fromAsset: selectedAsset.asset,
  //             spender: selectedSwapQuote?.router?.toLowerCase() || '',
  //             fee: approveFeeData,
  //             feeOptionKey: {
  //               basicFee: 'average',
  //               customEthPriorityFee: null,
  //               maxBaseFeeSlippage: null,
  //             },
  //             sender: chainsConnected[fromTokenSourceChain].address,
  //             keystoneAccount: keystoneAccounts.find(
  //               acc => acc.chain === fromTokenSourceChain
  //             ),
  //           },
  //           asset: selectedAsset.asset,
  //           ...(client?.name === ActiveWallet.LEDGER
  //             ? { connectionType, ledgerPath, ledgerIndex }
  //             : {}),
  //         };
  //         if (selectedAsset.asset.ticker === 'USDT') {
  //           if (
  //             allowanceBig.isGreaterThan(new BigNumber('0')) &&
  //             allowanceBig.isLessThanOrEqualTo(new BigNumber(transferAmount))
  //           ) {
  //             transactions.push({
  //               ...commonApproveParams,
  //               params: {
  //                 ...commonApproveParams.params,
  //                 amount: '0',
  //               },
  //             });
  //           }
  //           if (
  //             allowanceBig.isLessThanOrEqualTo(new BigNumber(transferAmount))
  //           ) {
  //             transactions.push({
  //               ...commonApproveParams,
  //               params: {
  //                 ...commonApproveParams.params,
  //                 amount: tokenAmountToRaw(
  //                   '10000000',
  //                   selectedAsset.asset.decimals
  //                 ),
  //               },
  //             });
  //           }
  //         }
  //       }
  //
  //       const commonSwapParams = {
  //         fromAsset: selectedAsset?.asset as WalletAsset,
  //         sender: chainsConnected[fromTokenSourceChain].address,
  //         feeOptionKey: {
  //           basicFee: 'average' as BasicFeeOption,
  //           customEthPriorityFee: null,
  //           maxBaseFeeSlippage: null,
  //         },
  //         fee: inboundFee,
  //         fromAmount: calculatedAmount,
  //         memo: selectedMemo as string,
  //         isMaya:
  //           swapProtocol === SwapProtocolType.MAYA ||
  //           swapProtocol === SwapProtocolType.MAYA_STREAMING,
  //         expiry: selectedSwapQuote?.expiry as number,
  //         swapType: swapProtocol as SwapProtocolType,
  //         inboundAddress: selectedSwapQuote?.inbound_address || '',
  //         ...(fromToken.isSynth ? { provider: fromToken.provider } : {}),
  //         keystoneAccount: keystoneAccounts.find(
  //           acc => acc.chain === fromTokenSourceChain
  //         ),
  //         ...(client?.name === ActiveWallet.LEDGER
  //           ? { connectionType, ledgerPath, ledgerIndex }
  //           : {}),
  //       };
  //       transactions.push({
  //         chain: fromTokenSourceChain,
  //         address: chainsConnected[fromTokenSourceChain].address,
  //         type: 'Swap',
  //         asset: selectedAsset.asset,
  //         params: {
  //           ...commonSwapParams,
  //         },
  //         swapType: swapProtocol as SwapProtocolType,
  //       });
  //
  //       if (transactions.length === 1) {
  //         try {
  //           setSwapState({
  //             type: 'broadcasted',
  //             asset: selectedAsset?.asset as WalletAsset,
  //             sourceChain: fromTokenSourceChain,
  //             amount: fromAmount,
  //             txUrl: '',
  //             error: '',
  //           });
  //           if (selectedAsset.asset.chain === 'XRD') {
  //             const hash = await swapAssetsRadix(
  //               selectedAsset.asset.contractAddress,
  //               fromAmount,
  //               selectedSwapQuote?.inbound_address || '',
  //               selectedSwapQuote?.memo || ''
  //             );
  //             setSwapState({
  //               type: 'success',
  //               asset: selectedAsset?.asset as WalletAsset,
  //               sourceChain: fromTokenSourceChain,
  //               amount: fromAmount,
  //               txUrl: hash,
  //               error: '',
  //             });
  //             setSwapLoading(false);
  //             await addTxToStatistic(hash, preparedAsset);
  //             return;
  //           }
  //           if (client?.name !== 'keystone') {
  //             const hash = await handleTxInitiated(transactions[0]);
  //             setSwapState({
  //               type: 'success',
  //               asset: selectedAsset?.asset as WalletAsset,
  //               sourceChain: fromTokenSourceChain,
  //               amount: fromAmount,
  //               txUrl: hash,
  //               error: '',
  //             });
  //             setSwapLoading(false);
  //             await addTxToStatistic(hash, preparedAsset);
  //             return;
  //           } else {
  //             setTransactions(transactions);
  //             setTransactionsModalOpened(true);
  //             return;
  //           }
  //         } catch (e) {
  //           const error = e as Error;
  //           setSwapLoading(false);
  //           setSwapState({
  //             type: 'error',
  //             asset: selectedAsset?.asset as WalletAsset,
  //             sourceChain: fromTokenSourceChain,
  //             amount: fromAmount,
  //             txUrl: '',
  //             error:
  //               error.message ||
  //               'Something went wrong. Probably swap amount is too high.',
  //           });
  //         }
  //       } else {
  //         setTransactions(transactions);
  //         setTransactionsModalOpened(true);
  //         return;
  //       }
  //     } catch (e) {
  //       const error = e as Error;
  //       setSwapLoading(false);
  //       setSwapState({
  //         type: 'error',
  //         asset: selectedAsset?.asset as WalletAsset,
  //         sourceChain: fromTokenSourceChain,
  //         amount: fromAmount,
  //         txUrl: '',
  //         error:
  //           error.message ||
  //           'Something went wrong. Probably swap amount is too high.',
  //       });
  //     }
  //   }
  // };

  const handleChangeSwapOptimiseType = (type: SwapProtocolType) => {
    setSwapProtocol(type);
  };
  //
  // const handleBackClicked = async () => {
  //   await queryClient.refetchQueries({
  //     queryKey: [
  //       'balance',
  //       `${selectedAsset?.asset.chain}-${chainsConnected[fromTokenSourceChain].address}`,
  //     ],
  //   });
  //   if (fromTokenSourceChain !== toTokenSourceChain) {
  //     await queryClient.refetchQueries({
  //       queryKey: [
  //         'balance',
  //         `${toTokenSourceChain}-${chainsConnected[toTokenSourceChain].address}`,
  //       ],
  //     });
  //   }
  //   setSwapState(null);
  //   setSwapLoading(false);
  // };

  // const handleConfirmationModalOpen = () => setConfirmationModalOpened(true);

  const closeConfirmationModal = () => setConfirmationModalOpened(false);

  const openInfoModal = () => setSwapInfoPopupOpen(true);

  const closeInfoModal = () => setSwapInfoPopupOpen(false);

  // const onKeystoneSuccess = async (txUrl: string) => {
  //   setTransactionsModalOpened(false);
  //   setSwapState({
  //     type: 'success',
  //     asset: selectedAsset?.asset as WalletAsset,
  //     sourceChain: fromTokenSourceChain,
  //     amount: fromAmount,
  //     txUrl: txUrl,
  //     error: '',
  //   });
  // };
  //
  // const onKeystoneFailure = (errorMessage: string) => {
  //   setTransactionsModalOpened(false);
  //   setSwapState({
  //     type: 'error',
  //     asset: selectedAsset?.asset as WalletAsset,
  //     sourceChain: fromTokenSourceChain,
  //     amount: fromAmount,
  //     txUrl: '',
  //     error: errorMessage,
  //   });
  // };

  const getInboundAddress = (
    bestProtocol: SwapQuote,
    asset: Asset,
    isMaya?: boolean
  ): string | undefined => {
    if (isEvmErc20Asset(asset)) {
      return isMaya
        ? bestProtocol.router || bestProtocol.inbound_address
        : bestProtocol.router;
    }
    return bestProtocol.inbound_address;
  };

  const fetchFromNativeTokenPrice = async (
    chain: string,
    cb: Dispatch<SetStateAction<number>>
  ) => {
    const ticker = nativeTokenForChain[chain];
    const symbol = `${chain}.${ticker}`;
    const priceExists: any = queryClient.getQueryData(['price', symbol]);
    if (!priceExists || new Date().getTime() - priceExists.updatedAt > 60000) {
      const endpoint = ThorwalletApi.fetchTokenPrices(symbol);
      const result = await queryUrl<Record<string, { usd: number }>>(endpoint);
      const price = result[symbol].usd || 1;
      queryClient.setQueryData(['price', symbol], {
        price: (+price).toFixed(2),
        updatedAt: new Date().getTime(),
      });
      cb(price);
      return;
    }
    cb(priceExists.price as number);
    return;
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadSwapQuotes = useCallback(
    debounce(async function (params: SwapQuoteParams, isMax: boolean) {
      setShowQuoteError(false);
      setShowQuoteErrorText('');
      const data = await getSwapQuotes(params);
      let maxToAmount = '0';
      let bestProtocol;
      let isMaya = false;
      let error = '';
      if (data.thorchain.base.quote) {
        setTimeOptimisedQuote(data.thorchain.base.quote);
        bestProtocol = data.thorchain.base.quote;
        if (
          new BigNumber(
            data.thorchain.base.quote.expected_amount_out
          ).isGreaterThanOrEqualTo(new BigNumber(maxToAmount))
        ) {
          maxToAmount = data.thorchain.base.quote.expected_amount_out;
        }
      } else {
        if (data.thorchain.base.error?.includes('halted')) {
          error = "Trading is halted for selected pair, can't process swap";
        } else if (
          data.thorchain.base.error?.includes('Swapping to a smart contract')
        ) {
          error =
            'Swapping to a smart contract is not possible! Enter a different recipient address.';
        }
        setTimeOptimisedQuote(null);
      }
      if (data.thorchain.streaming.quote) {
        setPriceOptimisedQuote(data.thorchain.streaming.quote);
        if (
          new BigNumber(
            data.thorchain.streaming.quote.expected_amount_out
          ).isGreaterThanOrEqualTo(new BigNumber(maxToAmount))
        ) {
          maxToAmount = data.thorchain.streaming.quote.expected_amount_out;
          setSwapProtocol(SwapProtocolType.THORPriceOptimised);
          bestProtocol = data.thorchain.streaming.quote;
        }
      } else {
        if (data.thorchain.streaming.error?.includes('halted')) {
          error = "Trading is halted for selected pair, can't process swap";
        } else if (
          data.thorchain.streaming.error?.includes(
            'Swapping to a smart contract'
          )
        ) {
          error =
            'Swapping to a smart contract is not possible! Enter a different recipient address.';
        }
        setPriceOptimisedQuote(null);
      }
      if (data.maya.quote) {
        if (
          new BigNumber(
            data.maya.quote.expected_amount_out
          ).isGreaterThanOrEqualTo(new BigNumber(maxToAmount))
        ) {
          maxToAmount = data.maya.quote.expected_amount_out;
          setSwapProtocol(SwapProtocolType.MAYA);
          bestProtocol = data.maya.quote;
          isMaya = true;
        }
        setMayaQuote(data.maya.quote);
      } else {
        if (data.maya.error?.includes('halted')) {
          error = "Trading is halted for selected pair, can't process swap";
        } else if (data.maya.error?.includes('Swapping to a smart contract')) {
          error =
            'Swapping to a smart contract is not possible! Enter a different recipient address.';
        }
        setMayaQuote(null);
      }
      if (data.mayaStreaming.quote) {
        if (
          new BigNumber(
            data.mayaStreaming.quote.expected_amount_out
          ).isGreaterThanOrEqualTo(new BigNumber(maxToAmount))
        ) {
          maxToAmount = data.mayaStreaming.quote.expected_amount_out;
          setSwapProtocol(SwapProtocolType.MAYA_STREAMING);
          bestProtocol = data.mayaStreaming.quote;
          isMaya = true;
        }
        setMayaStreamingQuote(data.mayaStreaming.quote);
      } else {
        if (data.mayaStreaming.error?.includes('halted')) {
          error = "Trading is halted for selected pair, can't process swap";
        } else if (
          data.mayaStreaming.error?.includes('Swapping to a smart contract')
        ) {
          error =
            'Swapping to a smart contract is not possible! Enter a different recipient address.';
        }
        setMayaStreamingQuote(null);
      }
      // if (data.oneInch.quote) {
      //   setOneInchQuote(data.oneInch.quote);
      //   // Todo add check for best protocol
      // }
      await fetchFromNativeTokenPrice(
        fromTokenSourceChain,
        setFromNativeTokenPrice
      );
      setSwapQuotesLoading(false);
      setToAmount(
        getOutputAssetAmount(
          maxToAmount,
          params.toAsset.split('.')[0] === 'MAYA'
        )
      );
      if (bestProtocol) {
        setShowQuoteErrorText('');
        setShowQuoteError(false);
      }
      if (bestProtocol && !isMax) {
        if (params.fromAsset.split('.')[0] === 'XRD') {
          return;
          // const feeResponse = await estimateSwapFee(
          //   fromToken.contractAddress,
          //   params.amount,
          //   bestProtocol.inbound_address
          // );
          // const preparedFees = await prepareTxFee(feeResponse);
          // setInboundFee(preparedFees);
        } else {
          const feeParams: SendFeeRequestParams = {
            senderAddress:
              addresses[
                convertSymbolToImagePath(
                  fromTokenSourceChain
                ) as keyof typeof addresses
              ],
            recipientAddress: getInboundAddress(
              bestProtocol,
              apiAssetToAsset(fromToken),
              isMaya
            ) as string,
            amount: tokenAmountToRaw(params.amount, params.fromAssetDecimal),
            asset: {
              chain: fromTokenSourceChain,
              ticker: fromToken.symbol,
              isSynth: fromToken.synth,
              ...(fromToken.contractAddress
                ? { contractAddress: fromToken.contractAddress }
                : {}),
            },
            txType: 'deposit',
            memo: bestProtocol?.memo,
            inboundAddress: bestProtocol.inbound_address,
            router: bestProtocol.router,
          };
          const feeResponse = await getTxSendFee(feeParams);
          const preparedFees = await prepareTxFee(feeResponse);
          setInboundFee(preparedFees);
        }
      }

      if (!bestProtocol) {
        setShowQuoteError(true);
        if (error) {
          setShowQuoteErrorText(error);
        }
      }
    }, 500),
    [fromToken]
  );

  useEffect(() => {
    if (+fromAmount && !swapState) {
      setSwapQuotesLoading(true);
      setShowQuoteError(false);
      setShowQuoteErrorText('');
      setSwapProtocol(null);
      setMayaQuote(null);
      setMayaStreamingQuote(null);
      // Todo add other protocols erase
      loadSwapQuotes(
        {
          fromAsset: `${fromToken.symbol}`,
          toAsset: `${toToken.symbol}`,
          amount: fromAmount,
          toleranceBps: 10000,
          destination:
            recipientAddress ||
            addresses[
              convertSymbolToImagePath(
                toTokenSourceChain
              ) as keyof typeof addresses
            ],
          fromAddress:
            addresses[
              convertSymbolToImagePath(
                fromTokenSourceChain
              ) as keyof typeof addresses
            ],
          fromAssetDecimal: fromToken.decimals,
          toAssetDecimal: toToken.decimals,
          ethAddress: addresses['Ethereum'] || undefined,
        },
        isMax
      );
      validateFromAmount(fromAmount);
    }
  }, [
    fromAmount,
    fromToken,
    toToken,
    recipientAddress,
    isWalletConnected,
    swapState,
    isMax,
    selectedAsset,
    fromTokenSourceChain,
    customRecipientAddress,
    loadSwapQuotes,
    validateFromAmount,
    addresses,
    toTokenSourceChain,
  ]);

  useEffect(() => {
    if (selectedSwapQuote) {
      const recommendedAmount = getOutputAssetAmount(
        selectedSwapQuote.recommended_min_amount_in || '0',
        fromToken.ticker === 'CACAO'
      );
      if (new BigNumber(recommendedAmount).isGreaterThan(fromAmount)) {
        setCustomSwapError(
          `Min. recommended ${
            fromToken.ticker
          } swap amount is ${(+recommendedAmount).toFixed(6)}`
        );
      } else {
        setCustomSwapError('');
      }
    } else {
      setCustomSwapError('');
    }
  }, [selectedSwapQuote, swapProtocol, fromAmount, fromToken]);

  const onMaxClick = async () => {
    if (!selectedAsset) return;
    if (new BigNumber(selectedAsset.rawAmount || 0).lte(0)) return;

    setSwapQuotesLoading(true);

    try {
      const chainFromBalance = await getFreshBalances(
        fromTokenSourceChain,
        addresses[
          convertSymbolToImagePath(
            fromTokenSourceChain
          ) as keyof typeof addresses
        ]
      );

      const nativeBalance = chainFromBalance.balances.find(
        balance =>
          balance.asset.ticker === nativeTokenForChain[fromTokenSourceChain]
      )?.rawAmount;

      const inboundAddresses: InboundAddress[] = [
        'MAYA',
        'THOR',
        'KUJI',
        'DASH',
        'ARB',
      ].includes(fromTokenSourceChain)
        ? await getMAYAActualInboundAddresses()
        : await getTHORActualInboundAddresses();

      const currentInboundAddress = inboundAddresses.find(
        (address: InboundAddress) => address.chain === fromTokenSourceChain
      );

      const feeParams: SendFeeRequestParams = {
        senderAddress:
          addresses[
            convertSymbolToImagePath(
              fromTokenSourceChain
            ) as keyof typeof addresses
          ],
        recipientAddress:
          customRecipientAddress ||
          addresses[
            convertSymbolToImagePath(
              toTokenSourceChain
            ) as keyof typeof addresses
          ],
        amount: selectedAsset.rawAmount,
        asset: {
          chain: fromTokenSourceChain,
          ticker: fromToken.symbol,
          isSynth: fromToken.synth,
          ...(fromToken.contractAddress
            ? { contractAddress: fromToken.contractAddress }
            : {}),
        },
        memo: `"=:${assetToString(apiAssetToAsset(fromToken))}:${
          addresses[
            convertSymbolToImagePath(
              toTokenSourceChain
            ) as keyof typeof addresses
          ]
        }:0/3/0:wr:0"`,
        txType: 'deposit',
        inboundAddress: currentInboundAddress?.address,
        router: currentInboundAddress?.router,
      };
      const feeResponse = await getTxSendFee(feeParams);
      const preparedFees = await prepareTxFee(feeResponse);
      setInboundFee(preparedFees);

      const feeRaw = calculateFeeRaw(preparedFees);
      if (!feeRaw) {
        setSwapQuotesLoading(false);
        setFromAmount('0.00');
        return;
      }

      const calculatedAmount =
        nativeTokenForChain[fromTokenSourceChain] === fromToken.ticker
          ? prepareMaxAmount(
              rawToBignumber(
                selectedAsset.rawAmount,
                selectedAsset.asset.decimals
              ).toString(),
              selectedAsset.asset.decimals || 18,
              feeRaw,
              nativeBalance || '0'
            )
          : selectedAsset.rawAmount;
      setFromAmount(
        new BigNumber(calculatedAmount).isNegative()
          ? ''
          : rawToBignumber(calculatedAmount, fromToken.decimals).toString()
      );
      setIsMax(true);
    } catch (e: unknown) {
      console.log(e);
      setFromAmount('0.00');
    } finally {
      setSwapQuotesLoading(false);
    }
  };

  useEffect(() => {
    if (preselectedAmount) {
      handleInputChange(preselectedAmount);
    }
  }, [preselectedAmount, handleInputChange]);

  useEffect(() => {
    if (isEvmErc20Asset(apiAssetToAsset(fromToken)) && selectedSwapQuote) {
      checkAllowance(
        fromToken.contractAddress,
        fromToken.chainId as number,
        addresses[
          convertSymbolToImagePath(fromToken.chain) as keyof typeof addresses
        ],
        selectedSwapQuote.router as string
      );
    }
  }, [addresses, fromToken, selectedSwapQuote, checkAllowance]);

  return (
    <main className={`flex flex-col items-center justify-center p-[16px]`}>
      {/*<button onClick={refetchArbBalance}>Refetch</button>*/}
      <div className="w-[400px]">
        {!swapState ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-[46px] font-semibold">Swap</span>
              <div className="flex gap-[6px]">
                <button
                  className="rounded-[9px] bg-blue-500 backdrop-blur-2xl px-[11px] py-[6px] border-[1px] border-blue-300"
                  onClick={openInfoModal}
                >
                  <WarningIcon data-test-id="info-btn" />
                </button>
                {/*<button*/}
                {/*  className={swapActionIconContainer}*/}
                {/*  onClick={openSettingsMenu}*/}
                {/*>*/}
                {/*  <SettingsIcon data-test-id="settings-btn" />*/}
                {/*</button>*/}
              </div>
            </div>
            {/*<PriceQuote*/}
            {/*  isLoading={pricesDataLoading}*/}
            {/*  fromSymbol={getTokenToFetch(fromToken)}*/}
            {/*  toSymbol={getTokenToFetch(toToken)}*/}
            {/*  fromTokenTicker={fromToken.ticker}*/}
            {/*  toTokenTicker={toToken.ticker}*/}
            {/*  onRefresh={handleRefreshTokenPrices}*/}
            {/*/>*/}
            <div className="mt-[16px]">
              <div>
                {assetsLoading || preselectedPriceLoading ? (
                  // <Skeleton height={'197px'} />
                  <span>Loading</span>
                ) : (
                  <div className="rounded-[12px] bg-blue-500 backdrop-blur-2xl border-[1px] border-blue-300">
                    <div className="px-[16px] py-[10px] flex w-full justify-between">
                      <span className="font-medium text-neutral-200">From</span>
                      <div className="flex items-center gap-[8px]">
                        <span className="font-medium text-neutral-200 text-[14px]">
                          Balance:{' '}
                          {tokenRawAmountToNumber(
                            selectedAsset?.rawAmount || '0',
                            selectedAsset?.asset.decimals || 18
                          )}{' '}
                          {fromToken.ticker}
                        </span>
                        <button
                          className="text-persianBlue-500 underline"
                          onClick={onMaxClick}
                        >
                          Max
                        </button>
                      </div>
                    </div>
                    <div className="px-[16px] py-[10px]">
                      <div className="mt-[4px]">
                        <div className="justify-between flex items-center">
                          <div className="flex flex-col gap-[4px] flex-1">
                            <DecimalInput
                              name="fromAmount"
                              type="text"
                              placeholder="0.00"
                              testId="from-amount-input"
                              onChange={e => handleInputChange(e.target.value)}
                              value={fromAmount}
                              className={`text-[28px] bg-blue-500 font-bold placeholder:text-[28px] placeholder:font-bold w-[calc(100%_-_38px)] text-${
                                amountError ? 'red' : 'white'
                              }`}
                            />
                            <TokenUsdValue
                              token={apiAssetToAsset(fromToken)}
                              amount={fromAmount}
                            />
                          </div>

                          <TokenSelectPopup
                            handleSelectToken={handleSelectFromToken}
                            selectedToken={fromToken}
                            disabled={false}
                            testId="tokens-from-popup"
                            assets={
                              assetsData?.filter(
                                asset => asset.chain !== 'BNB'
                              ) || []
                            }
                          />
                        </div>
                        {/*<TokenBalance*/}
                        {/*  ticker={fromToken.ticker}*/}
                        {/*  fromPrice={fromPrice}*/}
                        {/*  amount={fromAmount}*/}
                        {/*  onMaxClick={onMaxClick}*/}
                        {/*  selectedAsset={selectedAsset}*/}
                        {/*  displayBalance={displayFromBalance}*/}
                        {/*/>*/}
                      </div>
                    </div>
                  </div>
                )}
                <button
                  className="m-auto h-[12px] relative flex justify-center items-center [&>svg]:mt-[12px]"
                  style={{ zIndex: 1 }}
                  onClick={() => {
                    handleSwitchFromTo();
                  }}
                >
                  <SwapIcon />
                </button>
                {isSwapPairsLoading ? (
                  <Skeleton height={'155px'} />
                ) : (
                  <div className="rounded-[12px] bg-blue-500 backdrop-blur-2xl border-[1px] border-blue-300">
                    <div className="px-[16px] py-[10px] flex w-full justify-between">
                      <span className="font-medium text-neutral-200">To</span>
                    </div>
                    <div className="px-[16px] py-[10px]">
                      <div className="mt-[4px]">
                        <div className="justify-between flex items-center">
                          <div className="flex flex-col gap-[4px] flex-1">
                            <DecimalInput
                              name="fromAmount"
                              type="text"
                              placeholder="0.00"
                              testId="from-amount-input"
                              onChange={e => handleInputChange(e.target.value)}
                              value={toAmount}
                              className={`text-[28px] bg-blue-500 font-bold placeholder:text-[28px] placeholder:font-bold w-[calc(100%_-_38px)] text-${
                                amountError ? 'red' : 'white'
                              }`}
                              error={amountError}
                            />
                            <TokenUsdValue
                              token={apiAssetToAsset(toToken)}
                              amount={toAmount}
                            />
                          </div>

                          <TokenSelectPopup
                            handleSelectToken={handleSelectToToken}
                            selectedToken={toToken}
                            disabled={false}
                            testId="tokens-from-popup"
                            assets={
                              swapPairsData?.filter(
                                asset => asset.chain !== 'BNB'
                              ) || []
                            }
                          />
                        </div>
                        {/*<TokenBalance*/}
                        {/*  ticker={fromToken.ticker}*/}
                        {/*  fromPrice={fromPrice}*/}
                        {/*  amount={fromAmount}*/}
                        {/*  onMaxClick={onMaxClick}*/}
                        {/*  selectedAsset={selectedAsset}*/}
                        {/*  displayBalance={displayFromBalance}*/}
                        {/*/>*/}
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-[12px]">
                  {assetsLoading ? (
                    <span>Loading</span>
                  ) : (
                    <TextInput
                      value={customRecipientAddress}
                      onChange={e => setCustomRecipientAddress(e.target.value)}
                      placeholder={`Enter recipient's address (optional)`}
                      className="p-[12px] placeholder:text-neutral-200 placeholder:text-[12px]"
                    />
                  )}
                </div>
              </div>
            </div>
            <SwapOutput
              isLoading={swapQuotesLoading}
              handleChangeSwapOptimiseType={handleChangeSwapOptimiseType}
              mayaStreamingQuote={mayaStreamingQuote}
              mayaQuote={mayaQuote}
              timeOptimisedQuote={timeOptimisedQuote}
              priceOptimisedQuote={priceOptimisedQuote}
              swapProtocol={swapProtocol}
              inboundFee={inboundFee}
              showQuoteError={showQuoteError}
              showQuoteErrorText={showQuoteErrorText}
              toToken={toToken}
              fromNativeTokenPrice={fromNativeTokenPrice}
              fromTokenSourceChain={fromTokenSourceChain}
            />
            {customSwapError && (
              <div className="mt-[12px] flex justify-center">
                <span className="text-alert-red font-medium">
                  {customSwapError}
                </span>
              </div>
            )}
            {/*{isWalletConnected ? (*/}
            {/*  <CommonButton*/}
            {/*    themeGradient*/}
            {/*    onClick={handleConfirmationModalOpen}*/}
            {/*    className="w-full py-[15px] text-[16px] mt-[12px]"*/}
            {/*    disabled={swapButtonDisabled}*/}
            {/*  >*/}
            {/*    {swapButtonText}*/}
            {/*  </CommonButton>*/}
            {/*) : (*/}
            <StyledButton
              className="w-full mt-[12px]"
              // disabled={swapButtonDisabled}
              onClick={handleSwap}
            >
              {swapButtonText}
            </StyledButton>
          </>
        ) : (
          <div>asd</div>
          // <BroadcastedTransaction
          //   title="Swap"
          //   type="swap"
          //   onBack={handleBackClicked}
          //   data={[swapState]}
          //   provider={fromToken.provider}
          // />
        )}
      </div>
      {/*{settingsMenuOpened && (*/}
      {/*  <SettingsMenuModal*/}
      {/*    open={settingsMenuOpened}*/}
      {/*    onClose={closeSettingsMenu}*/}
      {/*  />*/}
      {/*)}*/}
      <SwapInfoModal onClose={closeInfoModal} open={swapInfoPopupOpen} />
      {confirmationModalOpened && selectedSwapQuote && inboundFee && (
        <SwapConfirmationModal
          open={confirmationModalOpened}
          onClose={closeConfirmationModal}
          fromToken={fromToken}
          toToken={toToken}
          amountFrom={fromAmount}
          fromNativeTokenPrice={fromNativeTokenPrice}
          amountTo={outputAssetAmount}
          time={selectedSwapOptimisedTime}
          outboundFeeUsd={selectedSwapQuote.fees.totalInUsd}
          slippage={
            +new BigNumber(
              selectedSwapQuote?.fees.slippage_bps ||
                selectedSwapQuote?.slippage_bps ||
                0
            )
              .dividedBy(100)
              .toFixed(2)
          }
          affiliateFee={selectedSwapQuote?.affiliateInPercentage || '0'}
          recipient={recipientAddress || customRecipientAddress}
          memo={selectedMemo || ''}
          onConfirm={handleSwap}
          inboundFee={inboundFee}
        />
      )}
      <ApproveModal
        amount={fromAmount}
        asset={fromToken}
        onClose={() => setApproveModalOpened(false)}
        open={approveModalOpened}
        nativeBalance={nativeTokenBalance || '0'}
        router={selectedSwapQuote?.router || ''}
        nativePrice={fromNativeTokenPrice}
      />
    </main>
  );
}
