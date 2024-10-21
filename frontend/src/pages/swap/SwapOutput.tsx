import { useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import Skeleton from '../../components/common/skeleton';
import { ApiAsset } from '../../lib/types/assets';
import { SendFee } from '../../lib/types/fee';
import ArrowDownIcon from '../../lib/ui/icons/ArrowDownIcon';
import SwapOutputSection from './SwapOutputSection';
import { SwapProtocolType, SwapQuote } from './types';
import { getOutputAssetAmount } from './utils';

type SwapOutputProps = {
  isLoading: boolean;
  swapProtocol: SwapProtocolType | null;
  inboundFee: SendFee | null;
  showQuoteError: boolean;
  showQuoteErrorText: string;
  timeOptimisedQuote: SwapQuote | null;
  priceOptimisedQuote: SwapQuote | null;
  mayaQuote: SwapQuote | null;
  mayaStreamingQuote: SwapQuote | null;
  handleChangeSwapOptimiseType: (val: SwapProtocolType) => void;
  toToken: ApiAsset;
  fromNativeTokenPrice: number;
  fromTokenSourceChain: string;
};

export default function SwapOutput({
  isLoading,
  swapProtocol,
  showQuoteError,
  showQuoteErrorText,
  inboundFee,
  timeOptimisedQuote,
  priceOptimisedQuote,
  mayaQuote,
  mayaStreamingQuote,
  handleChangeSwapOptimiseType,
  toToken,
  fromNativeTokenPrice,
  fromTokenSourceChain,
}: SwapOutputProps) {
  const { t } = useTranslation();

  const quotes = useMemo(() => {
    const availableQuotes = [];
    if (timeOptimisedQuote) {
      availableQuotes.push({
        ...timeOptimisedQuote,
        type: SwapProtocolType.THORTimeOptimised,
      });
    }
    if (priceOptimisedQuote) {
      availableQuotes.push({
        ...priceOptimisedQuote,
        type: SwapProtocolType.THORPriceOptimised,
      });
    }
    if (mayaQuote) {
      availableQuotes.push({
        ...mayaQuote,
        type: SwapProtocolType.MAYA,
      });
    }
    if (mayaStreamingQuote) {
      availableQuotes.push({
        ...mayaStreamingQuote,
        type: SwapProtocolType.MAYA_STREAMING,
      });
    }
    return availableQuotes.sort((quoteA, quoteB) => {
      return (
        +getOutputAssetAmount(
          quoteB.expected_amount_out as string,
          toToken.chain === 'MAYA'
        ) -
        +getOutputAssetAmount(
          quoteA.expected_amount_out as string,
          toToken.chain === 'MAYA'
        )
      );
    });
  }, [
    timeOptimisedQuote,
    priceOptimisedQuote,
    mayaQuote,
    mayaStreamingQuote,
    toToken.chain,
  ]);

  return isLoading ? (
    <div className="mt-[12px]">
      <Skeleton height="388px" />
    </div>
  ) : (
    <>
      {swapProtocol && (
        <>
          <div className="flex items-center justify-center">
            <div
              className="flex items-center justify-center rounded-[10px] w-[30px] h-[30px] bg-neutral-700 backdrop-blur-2xl z-10 border-[1px] border-neutral-500"
              style={{
                margin: '-10px 0',
              }}
            >
              <ArrowDownIcon />
            </div>
          </div>
          <div className="flex flex-col rounded-[12px] bg-blue-500 backdrop-blur-2xl border-[1px] border-neutral-500 p-[20px] pb-0 overflow-auto">
            {quotes.map(quote => (
              <SwapOutputSection
                quote={quote}
                onClick={() => handleChangeSwapOptimiseType(quote.type)}
                isActive={swapProtocol === quote.type}
                token={toToken}
                type={quote.type}
                inboundFee={inboundFee}
                fromNativeTokenPrice={fromNativeTokenPrice}
                fromTokenChain={fromTokenSourceChain}
                key={quote.type}
              />
            ))}
          </div>
        </>
      )}
      {showQuoteError && (
        <div
          className={`rounded-[12px] bg-blue-800 backdrop-blur-2xl border-[1px] border-neutral-500 p-[20px] pb-0 overflow-auto mt-[12px] flex flex-col`}
        >
          <span className="text-alert-red pb-[20px] font-medium">
            {showQuoteErrorText ? (
              showQuoteErrorText
            ) : (
              <Trans t={t}>page.swap.quote.amount.error</Trans>
            )}
          </span>
        </div>
      )}
    </>
  );
}
