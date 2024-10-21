import { useNavigate } from 'react-router-dom';

import { Button } from '../../lib/ui/buttons/Button';
import { makeAppPath } from '../../navigation';

export const SwapPrompt = () => {
  const navigate = useNavigate();
  return (
    <Button
      onClick={() => {
        navigate(makeAppPath('vaultItemSwap', {}), {
          // state: {
          //   coin: coin,
          //   balances: balances,
          //   priceRates: priceRates,
          // },
        });
      }}
      kind="outlined"
    >
      SWAP
    </Button>
  );
};
