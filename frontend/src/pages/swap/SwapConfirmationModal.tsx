import BigNumber from 'bignumber.js';
import { useMemo, useState } from 'react';

import { getChainEntityIconSrc } from '../../chain/utils/getChainEntityIconSrc';
import Checkbox from '../../components/common/checkbox';
import Divider from '../../components/common/divider';
import ModalBase from '../../components/common/modal';
import { useTokenPriceUsd } from '../../lib/hooks/use-token-price-usd';
import useAssets from '../../lib/hooks/useAssets';
import { ApiAsset } from '../../lib/types/assets';
import { SendFee } from '../../lib/types/fee';
import StyledButton from '../../lib/ui/buttons/StyledButton';
import ArrowRightIcon from '../../lib/ui/icons/ArrowRightIcon';
import { apiAssetToAsset, getAssetImage } from '../../utils/assets';
import { calculateTokenAmountUsd } from '../../utils/blockchain';
import {
  convertSymbolToImagePath,
  formatWalletAddress,
  getSourceChain,
  nativeTokenDecimals,
} from '../../utils/crypto';
import { calculateSendFee, calculateSendFeeAmount } from '../../utils/fee';
import { nativeTokenForChain, prepareNumberWithSeparators } from './utils';

type SwapConfirmationModalProps = {
  open: boolean;
  onClose: () => void;
  fromToken: ApiAsset;
  toToken: ApiAsset;
  amountFrom: string;
  amountTo: string;
  time: string;
  outboundFeeUsd: string;
  inboundFee: SendFee;
  slippage: number;
  affiliateFee: string;
  recipient: string;
  memo: string;
  onConfirm: () => Promise<void>;
  fromNativeTokenPrice: number;
};

export default function SwapConfirmationModal({
  open,
  onClose,
  fromToken,
  toToken,
  amountFrom,
  amountTo,
  time,
  outboundFeeUsd,
  slippage,
  affiliateFee,
  recipient,
  memo,
  onConfirm,
  fromNativeTokenPrice,
  inboundFee,
}: SwapConfirmationModalProps) {
  const [isSlippageConfirmed, setSlippageConfirmed] = useState(false);

  const { data: poolAssets } = useAssets();

  const slippageColor = useMemo(() => {
    if (!slippage) {
      return 'text-neutral-300';
    }
    if (+slippage >= 10) {
      return 'text-alert-red';
    }
    if (+slippage <= 2) {
      return 'text-green';
    }
    return 'text-turquoise-600';
  }, [slippage]);

  const pricesData: any[] = useTokenPriceUsd([
    fromToken.symbol,
    toToken.symbol,
  ]);

  const { fromPrice, toPrice }: { fromPrice: number; toPrice: number } =
    useMemo(() => {
      if (pricesData.every(price => !!price.data)) {
        return {
          fromPrice: Number(+pricesData[0].data.price) || 0,
          toPrice:
            Number(
              +pricesData[fromToken.ticker === toToken.ticker ? 0 : 1].data
                .price
            ) || 0,
        };
      }
      return {
        fromPrice: 0,
        toPrice: 0,
      };
    }, [pricesData, fromToken, toToken]);

  const handleConfirmClicked = async () => {
    onClose();
    await onConfirm();
  };

  const inboundFeeNumber = useMemo(() => {
    return prepareNumberWithSeparators(
      calculateSendFee(
        inboundFee,
        nativeTokenDecimals[
          getSourceChain(fromToken.chain, fromToken.synth, fromToken.provider)
        ]
      )
    );
  }, [inboundFee, fromToken]);

  const inboundFeeUsd = useMemo(() => {
    return prepareNumberWithSeparators(
      calculateSendFeeAmount(
        inboundFee,
        `${fromNativeTokenPrice}`,
        nativeTokenDecimals[
          getSourceChain(fromToken.chain, fromToken.synth, fromToken.provider)
        ]
      )
    );
  }, [inboundFee, fromNativeTokenPrice, fromToken]);

  const totalFeeUsd = useMemo(() => {
    return prepareNumberWithSeparators(
      new BigNumber(inboundFeeUsd).plus(outboundFeeUsd).toFixed(2)
    );
  }, [inboundFeeUsd, outboundFeeUsd]);

  const fromTokenImage = getAssetImage(apiAssetToAsset(fromToken), poolAssets);

  const toTokenImage = getAssetImage(apiAssetToAsset(toToken), poolAssets);

  const startEndDigits = 20;

  return (
    <ModalBase
      onClose={onClose}
      open={open}
      title="Confirm Swap"
      subtitle="See swap result before confirming"
    >
      <div className="flex justify-center">
        <div className="mt-[16px] justify-between items-center w-full gap-[12px] flex">
          <div className="border-[1px] rounded-[12px] p-[12px] border-neutral-500 flex-1">
            <div className="gap-[6px] mb-[12px] justify-center">
              <div className="relative">
                <img
                  src={fromTokenImage}
                  alt="asset"
                  className="w-[36px] h-[36px]"
                />
                {fromToken.synth && (
                  <>
                    <div
                      className="absolute z-10"
                      style={{
                        bottom: '-6px',
                        right: '-6px',
                      }}
                    >
                      <img
                        src={getChainEntityIconSrc(
                          getSourceChain(
                            fromToken.chain,
                            fromToken.synth,
                            fromToken.provider
                          )
                        )}
                        alt="coin"
                        className="w-[12px] h-[12px]"
                      />
                    </div>
                    <img
                      src={getChainEntityIconSrc(
                        convertSymbolToImagePath(
                          fromToken?.provider?.[0] === 'THORCHAIN'
                            ? 'THOR'
                            : 'MAYA'
                        )
                      )}
                      alt="coin"
                      className="w-[12px] h-[12px]"
                    />
                  </>
                )}
              </div>
              <span className="text-[16px] mt-[4px] font-light">
                {fromToken.ticker}
              </span>
            </div>
            <span className="text-[16px] mt-[4px] font-bold">
              {prepareNumberWithSeparators(amountFrom)}
            </span>
            <span className="text-[12px] text-neutral-300 font-light">
              ${calculateTokenAmountUsd(amountFrom, fromPrice)}
            </span>
          </div>
          <ArrowRightIcon />
          <div className="border-[1px] rounded-[12px] p-[12px] border-neutral-500 flex-1">
            <div className="gap-[6px] mb-[12px] flex items-center">
              <div className="relative">
                <img
                  src={toTokenImage}
                  alt="asset"
                  className="w[36px] h-[36px]"
                  width={36}
                  height={36}
                />
                {toToken.synth && (
                  <>
                    <div
                      className="absolute z-10"
                      style={{
                        bottom: '-6px',
                        right: '-6px',
                      }}
                    >
                      <img
                        src={getChainEntityIconSrc(
                          getSourceChain(
                            toToken.chain,
                            toToken.synth,
                            toToken.provider
                          )
                        )}
                        alt="coin"
                        className="w-[12px] h-[12px]"
                      />
                    </div>
                    <img
                      src={getChainEntityIconSrc(
                        convertSymbolToImagePath(
                          toToken?.provider?.[0] === 'THORCHAIN'
                            ? 'THOR'
                            : 'MAYA'
                        )
                      )}
                      alt="coin"
                      className="w-[12px] h-[12px]"
                    />
                  </>
                )}
              </div>
              <span className="text-[16px] mt-[4px] font-light">
                {toToken.ticker}
              </span>
            </div>
            <span className="text-[16px] mt-[4px] font-bold">
              {prepareNumberWithSeparators(amountTo)}
            </span>
            <span className="text-[12px] text-neutral-300 font-light">
              ${calculateTokenAmountUsd(amountTo, toPrice)}
            </span>
          </div>
        </div>
      </div>
      <div className="rounded-[12px] border-[1px] border-neutral-500 mt-[16px]">
        <div className="p-[12px] justify-between flex items-center">
          <div className="flex-1 flex items-center justify-center flex-col">
            <span className="text-white font-light">Est. time</span>
            <span className="font-medium">{time}</span>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <div className="gap-[4px] flex justify-center">
              <span className="text-white font-light">Total Fee</span>
              {/* <Tooltip /> */}
            </div>
            <span className="font-medium">${totalFeeUsd}</span>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <span className="text-white font-light">Slippage</span>
            <span className={`${slippageColor} font-medium`}>{slippage}%</span>
          </div>
        </div>
        <Divider orientation="horizontal" />
        <div className="p-[12px] justify-between flex items-center">
          <div className="flex-1 flex justify-center flex-col">
            <span className="text-white font-light">Transaction Fee</span>
            <div className="justify-between w-full flex flex-col items-center">
              <span className="font-medium">
                {inboundFeeNumber}{' '}
                {
                  nativeTokenForChain[
                    getSourceChain(
                      fromToken.chain,
                      fromToken.synth,
                      fromToken.provider
                    )
                  ]
                }
              </span>
              <span className="font-medium text-neutral-300">
                ${inboundFeeUsd}
              </span>
            </div>
          </div>
          <div className="flex-1 flex-col justify-center">
            <span className="text-white font-light">Network Fee</span>
            <span className="text-neutral-300 font-medium">
              ${(+outboundFeeUsd).toFixed(2)}
            </span>
          </div>
          <div className="flex-1 flex-col justify-center">
            <span className="text-white font-light">Affiliate Fee</span>
            <span className="font-medium">{affiliateFee}%</span>
          </div>
        </div>
        <Divider orientation="horizontal" />
        <div className="items-center">
          <div className="flex-1 p-[12px] flex justify-center flex-col">
            <span className="text-white font-light">
              Recipient&apos;s address
            </span>
            <span className="font-medium">
              {formatWalletAddress(recipient, startEndDigits, startEndDigits)}
            </span>
          </div>
        </div>
        <Divider orientation="horizontal" />
        <div className="items-center">
          <div className="flex-1 p-[12px] justify-center flex flex-col">
            <span className="text-white font-light">Memo</span>
            <span className="font-medium">
              {formatWalletAddress(memo, startEndDigits, startEndDigits)}
            </span>
          </div>
        </div>
        <Divider orientation="horizontal" />
        <div className="items-center">
          <div className="flex-1 p-[12px] flex flex-col justify-center">
            <span className="text-white font-light">Receive amount</span>
            <span className="font-medium">
              {prepareNumberWithSeparators(amountTo)} {toToken.ticker}
            </span>
          </div>
        </div>
      </div>
      {slippage > 2 && (
        <div className="mt-[20px] flex">
          <Checkbox
            defaultChecked={false}
            label="Slippage is higher than expected. Are you sure you want to continue?"
            id="confirmation-checkbox"
            disabled={false}
            checked={isSlippageConfirmed}
            onClick={() => setSlippageConfirmed(!isSlippageConfirmed)}
          />
        </div>
      )}
      <StyledButton
        onClick={handleConfirmClicked}
        className="w-full py-[8px] text-[16px] mt-[20px]"
        disabled={slippage > 2 && !isSlippageConfirmed}
      >
        Swap
      </StyledButton>
    </ModalBase>
  );
}
