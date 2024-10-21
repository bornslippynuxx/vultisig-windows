import { useQuery } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';
import React, { useMemo, useState } from 'react';

import { useThorwalletApi } from '../../../lib/hooks/use-thorwallet-api';
import useAssets from '../../../lib/hooks/useAssets';
import { ApiAsset } from '../../../lib/types/assets';
import { SendFee, SendFeeRequestParams } from '../../../lib/types/fee';
import StyledButton from '../../../lib/ui/buttons/StyledButton';
import {
  nativeTokenForChain,
  tokenAmountToRaw,
} from '../../../pages/swap/utils';
import { apiAssetToAsset, getAssetImage } from '../../../utils/assets';
import {
  convertSymbolToAssetName,
  convertSymbolToImagePath,
  nativeTokenDecimals,
} from '../../../utils/crypto';
import {
  calculateSendFee,
  calculateSendFeeAmount,
  checkIsFeeNotEnoughForSend,
  prepareTxFee,
} from '../../../utils/fee';
import { useAssertCurrentVaultAddreses } from '../../../vault/state/useCurrentVault';
import Divider from '../divider';
import ModalBase from '../modal';
import Skeleton from '../skeleton';

type ApproveModalProps = {
  open: boolean;
  onClose: () => void;
  asset: ApiAsset;
  router: string;
  amount: string;
  nativePrice: number;
  nativeBalance: string;
};

export default function ApproveModal({
  open,
  onClose,
  asset,
  router,
  amount,
  nativePrice,
  nativeBalance,
}: ApproveModalProps) {
  const { data: poolAssets } = useAssets();
  const addresses = useAssertCurrentVaultAddreses();
  const { getTxSendFee } = useThorwalletApi();
  // const queryClient = useQueryClient();
  const [isApproveLoading] = useState(false);

  const handleCloseModal = () => {
    onClose();
  };

  const tokenImage = getAssetImage(apiAssetToAsset(asset), poolAssets);

  const sender =
    addresses[convertSymbolToImagePath(asset.chain) as keyof typeof addresses];

  const { data: approveFeeData } = useQuery({
    queryFn: async () => {
      const transferAmount = tokenAmountToRaw(amount, asset.decimals || 18);
      const feeParams: SendFeeRequestParams = {
        senderAddress: sender,
        recipientAddress: router,
        amount: transferAmount,
        asset: {
          chain: asset.chain,
          ticker: asset.ticker,
          isSynth: false,
          ...(asset.contractAddress
            ? { contractAddress: asset.contractAddress }
            : {}),
        },
        txType: 'allowance',
      };
      const data = await getTxSendFee(feeParams);
      return await prepareTxFee(data);
    },
    enabled: open,
  } as any);

  const approveFeeAmountUsd = useMemo(() => {
    if (approveFeeData) {
      return calculateSendFeeAmount(
        approveFeeData as SendFee,
        `${nativePrice}`,
        nativeTokenDecimals[asset.chain]
      );
    }
  }, [approveFeeData, asset.chain, nativePrice]);

  const approveFeeAmount = useMemo(() => {
    if (approveFeeData) {
      const fee = calculateSendFee(
        approveFeeData as SendFee,
        nativeTokenDecimals[asset.chain]
      );
      return new BigNumber(fee)
        .multipliedBy(asset.ticker === 'USDT' ? 2 : 1)
        .toString();
    }
  }, [approveFeeData, asset.chain, asset.ticker]);

  const isNativeBalanceEnough = useMemo(() => {
    if (approveFeeData) {
      return checkIsFeeNotEnoughForSend(
        approveFeeData as SendFee,
        asset.chain as string,
        asset.ticker,
        amount,
        new BigNumber(nativeBalance).toString()
      );
    }
  }, [approveFeeData, asset, nativeBalance, amount]);

  console.log(approveFeeData);
  console.log(approveFeeAmountUsd);
  console.log(approveFeeAmount);
  console.log(nativeBalance);

  const handleApprove = async () => {
    console.log('approve');
  };

  return (
    <ModalBase
      title="Approve token"
      subtitle={`To proceed you need to approve ${asset.ticker} spend.`}
      open={open}
      onClose={handleCloseModal}
    >
      <div className="my-[20px] flex items-center justify-center">
        <div className="flex-1 flex flex-col items-center">
          <img src={tokenImage} alt="asset" className="w-[46px] h-[46px]" />
          <span className={'text-[16px] text-neutral-300 mt-[4px] font-medium'}>
            {asset.ticker}
          </span>
          <span className={'text-[16px] mt-[4px] font-bold'}>
            {convertSymbolToAssetName(asset.chain)}
          </span>
        </div>
      </div>
      <div className="rounded-[12px] border-[1px] border-neutral-500 mt-[20px]">
        <div className="flex-1 p-[12px] flex flex-col items-center">
          <span className={'text-neutral-300 font-bold'}>Contract Address</span>
          <div className="gap-[4px] flex items-center justify-center">
            <span className="font-medium">{router}</span>
          </div>
        </div>
        <Divider orientation="horizontal" />
        <div className="flex-1 p-[12px] flex flex-col items-center">
          <span className={'text-neutral-300 font-medium'}>
            Transaction Fee
          </span>
          {isApproveLoading ? (
            <Skeleton height="21px" />
          ) : (
            <>
              <div className="gap-[4px] flex items-center justify-center">
                <span className="font-medium">
                  {approveFeeAmount} {nativeTokenForChain[asset.chain]}
                </span>
                <span className="opacity-80 font-medium">
                  (${approveFeeAmountUsd})
                </span>
              </div>
            </>
          )}
        </div>
      </div>
      <StyledButton
        className="w-full mt-[12px]"
        onClick={handleApprove}
        disabled={isNativeBalanceEnough}
      >
        {!isNativeBalanceEnough ? 'Approve' : 'Not enough funds'}
      </StyledButton>
    </ModalBase>
  );
}
