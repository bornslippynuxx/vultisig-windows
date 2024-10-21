import { getChainEntityIconSrc } from '../../../chain/utils/getChainEntityIconSrc';
import {
  convertSymbolToAssetName,
  convertSymbolToImagePath,
} from '../../../utils/crypto';

type NetworkSelectedChainProps = {
  chainFilter: string | null;
};
export default function NetworkSelectedChain({
  chainFilter,
}: NetworkSelectedChainProps) {
  return chainFilter ? (
    <div className="flex items-center gap-[6px]">
      <img
        src={getChainEntityIconSrc(convertSymbolToImagePath(chainFilter))}
        alt="chain"
        className="min-w-[14px] h-[14px]"
      />
      <span className="font-medium">
        {convertSymbolToAssetName(chainFilter)}
      </span>
    </div>
  ) : (
    <span className="text-neutral-300 font-medium">All chains</span>
  );
}
