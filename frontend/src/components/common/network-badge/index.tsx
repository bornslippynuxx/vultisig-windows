import { ChainEntityIcon } from '../../../chain/ui/ChainEntityIcon';
import { getChainEntityIconSrc } from '../../../chain/utils/getChainEntityIconSrc';
import {
  convertSymbolToAssetName,
  convertSymbolToImagePath,
} from '../../../utils/crypto';

type NetworkBadgeProps = {
  sourceChain: string;
};

export default function NetworkBadge({ sourceChain }: NetworkBadgeProps) {
  return (
    <div className="flex items-center gap-[6px] p-[5px] [&>svg]:min-w-[15px] [&>svg]:h-[15px] rounded-[7px] border-[1px] border-blue-300">
      <ChainEntityIcon
        value={getChainEntityIconSrc(convertSymbolToImagePath(sourceChain))}
        style={{ fontSize: 16 }}
      />
      <span className="text-[12px] font-normal text-neutral-200">
        {convertSymbolToAssetName(sourceChain)}
      </span>
    </div>
  );
}
