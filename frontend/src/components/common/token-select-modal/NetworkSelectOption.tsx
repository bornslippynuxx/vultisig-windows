import { Chain } from '@xchainjs/xchain-util';

import { getChainEntityIconSrc } from '../../../chain/utils/getChainEntityIconSrc';
import { nativeTokenForChain } from '../../../pages/swap/utils';
import {
  convertSymbolToAssetName,
  convertSymbolToImagePath,
} from '../../../utils/crypto';

type NetworkSelectOptionsProps = {
  handleChainSelected: (chain: Chain | null) => void;
};

export default function NetworkSelectOptions({
  handleChainSelected,
}: NetworkSelectOptionsProps) {
  return (
    <>
      <button
        onClick={() => handleChainSelected(null)}
        className="py-[4px] px-[10px] flex gap-[6px] items-center rounded-[12px] hover:bg-blue-300 [&>svg]:min-w-[14px] [&>svg]:h-[14px] w-full"
      >
        <span className="text-neutral-300 font-medium">All chains</span>
      </button>
      {Object.keys(nativeTokenForChain)
        .filter(token => token !== 'XRD')
        .map(key => (
          <button
            onClick={() => handleChainSelected(key as Chain)}
            className="py-[4px] px-[10px] flex gap-[6px] items-center rounded-[12px] hover:bg-blue-300 [&>svg]:min-w-[14px] [&>svg]:h-[14px] w-full"
            key={key}
          >
            <img
              src={getChainEntityIconSrc(convertSymbolToImagePath(key))}
              alt="chain"
              className="min-w-[14px] h-[14px]"
            />
            <span className="text-neutral-300 font-medium">
              {convertSymbolToAssetName(key as Chain)}
            </span>
          </button>
        ))}
    </>
  );
}
