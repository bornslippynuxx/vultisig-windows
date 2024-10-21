import { SynthProvider } from '../lib/types/assets';
import { SwapQuoteParams } from '../pages/swap/types';

export class ThorwalletApi {
  static thorWalletApi: string = 'https://api-v2-dev.thorwallet.org';
  static mayaNodeUrl: string = 'https://mayanode.mayachain.info';
  static thorNodeUrl: string = 'https://thorchain-thornode-lb-1.thorwallet.org';

  static fetchPoolAssets(): string {
    return `${this.thorWalletApi}/assets/pool`;
  }

  static fetchTokenPrices(ticker: string): string {
    return `${this.thorWalletApi}/price/${ticker}`;
  }

  static fetchETHBalances(wallet: string): string {
    return `${this.thorWalletApi}/balance/eth/${wallet}`;
  }

  static fetchArbBalances(wallet: string): string {
    return `${this.thorWalletApi}/balance/eth/${wallet}?chain=42161`;
  }

  static fetchBTCBalances(wallet: string): string {
    return `${this.thorWalletApi}/balance/btc/${wallet}`;
  }

  static fetchBCHBalances(wallet: string): string {
    return `${this.thorWalletApi}/balance/bch/${wallet}`;
  }

  static fetchLTCBalances(wallet: string): string {
    return `${this.thorWalletApi}/balance/ltc/${wallet}`;
  }

  static fetchDOGEBalances(wallet: string): string {
    return `${this.thorWalletApi}/balance/doge/${wallet}`;
  }

  static fetchDASHBalances(wallet: string): string {
    return `${this.thorWalletApi}/balance/dash/${wallet}`;
  }

  static fetchThorBalances(wallet: string): string {
    return `${this.thorWalletApi}/balance/thorchain/${wallet}`;
  }

  static fetchBNBBalances(wallet: string): string {
    return `${this.thorWalletApi}/balance/bnb/${wallet}`;
  }

  static fetchBSCBalances(wallet: string): string {
    return `${this.thorWalletApi}/balance/bsc/${wallet}`;
  }

  static fetchAVAXBalances(wallet: string): string {
    return `${this.thorWalletApi}/balance/avalanche/${wallet}`;
  }

  static fetchCosmosBalances(wallet: string): string {
    return `${this.thorWalletApi}/balance/cosmos/${wallet}`;
  }

  static fetchMAYABalances(wallet: string): string {
    return `${this.thorWalletApi}/balance/maya/${wallet}`;
  }

  static fetchKujiraBalances(wallet: string): string {
    return `${this.thorWalletApi}/balance/kujira/${wallet}`;
  }

  static getMayaAddresses(): string {
    return `${this.mayaNodeUrl}/mayachain/inbound_addresses`;
  }

  static getThorchainIboundAddresses(): string {
    return `${this.thorNodeUrl}/thorchain/inbound_addresses`;
  }

  static getTxSendFee(): string {
    return `${this.thorWalletApi}/gas`;
  }

  static getSwapQuotes({
    fromAsset,
    toAsset,
    amount,
    destination,
    fromAddress,
    toleranceBps,
    fromAssetDecimal,
    toAssetDecimal,
    ethAddress,
  }: SwapQuoteParams): string {
    return `${this.thorWalletApi}/quote/swap?fromAsset=${fromAsset}&toAsset=${toAsset}&amount=${amount}&destination=${destination}&fromAddress=${fromAddress}&toleranceBps=${toleranceBps}&fromAssetDecimal=${fromAssetDecimal}&toAssetDecimal=${toAssetDecimal}${
      (ethAddress && `&ethAddress=${ethAddress}`) || ''
    }`;
  }

  static getSwapPairs(
    chain: string,
    ticker: string,
    isSynth: boolean,
    contractAddress: string,
    provider?: SynthProvider[]
  ): string {
    let synthProvider;
    if (isSynth && provider) {
      synthProvider = provider[0];
    }
    return `${this.thorWalletApi}/quote/pairs?chain=${chain}&ticker=${ticker}${
      contractAddress ? `&contractAddress=${contractAddress}` : ''
    }${synthProvider ? `&synth=${synthProvider}` : ''}`;
  }
}
