import BigNumber from 'bignumber.js';
import { useMemo } from 'react';

import { getChainEntityIconSrc } from '../../chain/utils/getChainEntityIconSrc';
import { ApiAsset } from '../../lib/types/assets';
import { SendFee } from '../../lib/types/fee';
import { nativeTokenDecimals } from '../../utils/crypto';
import { calculateSendFeeAmount } from '../../utils/fee';
import { SwapProtocolType, SwapQuote } from './types';
import {
  convertSeconds,
  getOutputAssetAmount,
  prepareNumberWithSeparators,
} from './utils';

type SwapOutputSectionProps = {
  onClick: () => void;
  isActive: boolean;
  quote: SwapQuote;
  token: ApiAsset;
  type: SwapProtocolType;
  inboundFee: SendFee | null;
  fromNativeTokenPrice: number;
  fromTokenChain: string;
};

export default function SwapOutputSection({
  onClick,
  isActive,
  quote,
  token,
  type,
  inboundFee,
  fromNativeTokenPrice,
  fromTokenChain,
}: SwapOutputSectionProps) {
  const calculateTotalFee = () => {
    if (inboundFee) {
      const inbound = calculateSendFeeAmount(
        inboundFee,
        `${fromNativeTokenPrice}`,
        nativeTokenDecimals[fromTokenChain]
      );
      return new BigNumber(+inbound).plus(quote.fees.totalInUsd).toFixed(2);
    } else {
      return '0.00';
    }
  };

  const getQuoteSlippage = (amount: number) => {
    const percentage = amount / 100;
    if (percentage >= 10) {
      return (
        <span className="text-[12px] text-alert-red font-light">
          {percentage}% slippage
        </span>
      );
    }
    if (percentage <= 2) {
      return (
        <span className="text-[12px] text-green font-light">
          {percentage}% slippage
        </span>
      );
    }
    return (
      <span className="text-[12px] text-yellow font-light">
        {percentage}% slippage
      </span>
    );
  };

  const swapOutputTitle = useMemo(() => {
    if (type === SwapProtocolType.MAYA) {
      return 'MAYA Base';
    }
    if (type === SwapProtocolType.MAYA_STREAMING) {
      return 'MAYA Streaming';
    }
    return type === SwapProtocolType.THORPriceOptimised
      ? 'Price optimised'
      : 'Time optimised';
  }, [type]);

  const logo = useMemo(() => {
    if (
      type === SwapProtocolType.THORPriceOptimised ||
      type === SwapProtocolType.THORTimeOptimised
    ) {
      return (
        <img
          src={getChainEntityIconSrc('thorchain')}
          alt="throchain"
          className="w-[24px] h-[24px]"
        />
      );
    }
    if (
      type === SwapProtocolType.MAYA ||
      type === SwapProtocolType.MAYA_STREAMING
    ) {
      return (
        <img
          src={getChainEntityIconSrc('mayachain')}
          alt="throchain"
          className="w-[24px] h-[24px]"
        />
      );
    }
  }, [type]);

  return (
    <button
      onClick={onClick}
      className="p-[16px] bg-neutral-700 rounded-[12px]"
      style={{
        border: `1px solid ${isActive ? '#5ED5A8' : '#25364A'}`,
        marginBottom: '20px',
      }}
    >
      <div className="justify-between flex">
        <div className="flex flex-1 justify-between">
          <div>
            <div className="gap-[4px] flex items-center">
              <span className="text-[12px] font-medium">{swapOutputTitle}</span>
            </div>
            <div className="gap-[2px] flex items-center">
              {(quote.streaming_swap_seconds ||
                quote.total_swap_seconds ||
                quote.outbound_delay_seconds !== undefined) && (
                <span className="text-neutral-300 text-[12px] font-light">
                  {convertSeconds(
                    quote.streaming_swap_seconds,
                    quote.total_swap_seconds ||
                      quote.outbound_delay_seconds ||
                      0
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className={`flex-1 justify-end text-right`}>
          <span className="text-[18px] text-right font-bold">
            {prepareNumberWithSeparators(
              getOutputAssetAmount(
                quote.expected_amount_out as string,
                token.chain === 'MAYA'
              )
            )}{' '}
            {token.ticker}
          </span>
          <div className="gap-[4px] mb-[8px] justify-end flex">
            <span className="text-[12px] text-green font-light">
              {getQuoteSlippage(
                quote.fees.slippage_bps || quote.slippage_bps || 0
              )}
            </span>
          </div>
        </div>
      </div>
      <div className="justify-between items-end flex">
        <div className="flex-1">{logo}</div>
        <div className="flex items-center rounded-[12px] px-[12px] py-[8px] border-[1px] border-neutral-500 bg-blue-800 gap-[8px]">
          <span className="text-neutral-300 font-medium">
            Fees ${prepareNumberWithSeparators(calculateTotalFee())}
          </span>
        </div>
      </div>
    </button>
  );
}
