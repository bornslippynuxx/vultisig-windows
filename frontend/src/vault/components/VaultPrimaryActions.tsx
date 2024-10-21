import { UniformColumnGrid } from '../../lib/ui/css/uniformColumnGrid';
import { SendCoinPromptDeprecated } from './sendDeprecated/SendCoinPromptDeprecated';
import { SwapPrompt } from './SwapPrompt';

export const VaultPrimaryActions: React.FC = () => {
  return (
    <UniformColumnGrid fullWidth gap={12}>
      <SendCoinPromptDeprecated />
      <SwapPrompt />
    </UniformColumnGrid>
  );
};
