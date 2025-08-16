# Vultisig TypeScript SDK

A comprehensive TypeScript SDK for Vultisig vault creation, address derivation, and blockchain operations.

## Features

- 🔐 **Fast Vault Creation** with Vultiserver integration
- 🏪 **Address Derivation** for 20+ blockchain networks
- 📱 **Universal Support** - Browser and Node.js compatible
- 🔒 **Type-Safe** - Full TypeScript definitions
- 🎯 **Modular Imports** - Tree-shakeable for optimal bundle size
- 📦 **WASM Embedded** - No external dependencies for crypto operations

## Installation

```bash
npm install vultisig-sdk
# or
yarn add vultisig-sdk
```

## Quick Start

```typescript
import { VultisigSDK, Chain } from 'vultisig-sdk'

// Initialize SDK
const sdk = await VultisigSDK.initialize()

// Create a fast vault
const creation = await sdk.createFastVault({
  name: "My Wallet",
  email: "user@example.com",
  password: "secure123"
})

// Verify email (code sent to user's email)
await creation.verifyEmail("123456")

// Download vault
const vault = await creation.downloadVault()

// Get addresses for common chains
const addresses = await sdk.deriveAddresses(vault, [
  Chain.Bitcoin,
  Chain.Ethereum,
  Chain.Solana
])

console.log(addresses)
// {
//   Bitcoin: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
//   Ethereum: "0x742d35Cc6634C0532925a3b8D8a7C1a8e8G3F8",
//   Solana: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"
// }
```

## API Reference

### VultisigSDK

Main SDK class providing high-level operations.

#### Methods

##### `static initialize(): Promise<VultisigSDK>`
Initialize the SDK with WASM modules.

##### `createFastVault(config: FastVaultConfig): Promise<VaultCreation>`
Create a new fast vault with the server.

```typescript
const creation = await sdk.createFastVault({
  name: "My Wallet",
  email: "user@example.com", 
  password: "secure123"
})
```

##### `loadVault(vaultData: string, password?: string): Promise<Vault>`
Load an existing vault from exported data.

##### `deriveAddresses(vault: Vault, chains: Chain[]): Promise<AddressMap>`
Derive addresses for multiple chains.

##### `deriveAddress(vault: Vault, chain: Chain): Promise<string>`
Derive address for a single chain.

### Vault

Represents a Vultisig vault with cryptographic keys.

#### Properties
- `id: string` - Unique vault identifier
- `name: string` - Human-readable vault name
- `publicKeys: PublicKeys` - ECDSA and EdDSA public keys
- `hexChainCode: string` - Chain code for key derivation

#### Methods

##### `getAddress(chain: Chain): Promise<string>`
Get address for a specific blockchain.

##### `export(password?: string): string`
Export vault data as JSON string.

##### `getInfo(): VaultInfo`
Get vault summary information.

### VaultCreation

Handles the vault creation flow with email verification.

#### Methods

##### `verifyEmail(code: string): Promise<void>`
Verify email with the code sent by the server.

##### `downloadVault(password?: string): Promise<Vault>`
Download and decrypt the vault after verification.

## Supported Chains

- Bitcoin (BTC)
- Ethereum (ETH) 
- Solana (SOL)
- Avalanche (AVAX)
- Polygon (MATIC)
- BSC (BNB)
- Optimism (OP)
- Arbitrum (ARB)
- Base (BASE)
- THORChain (RUNE)
- Cosmos (ATOM)
- MayaChain (MAYA)
- Cardano (ADA)
- Polkadot (DOT)
- Ripple (XRP)
- Tron (TRX)
- Sui (SUI)
- Ton (TON)
- Litecoin (LTC)
- Dogecoin (DOGE)

## Examples

### Web Application

```typescript
import { VultisigSDK, Chain } from 'vultisig-sdk'

async function createWallet() {
  const sdk = await VultisigSDK.initialize()
  
  try {
    const creation = await sdk.createFastVault({
      name: "Web Wallet",
      email: "user@example.com",
      password: "MySecurePassword123!"
    })
    
    // Show email verification form
    const code = prompt("Enter verification code:")
    await creation.verifyEmail(code)
    
    // Download vault
    const vault = await creation.downloadVault()
    
    // Show addresses
    const btcAddress = await vault.getAddress(Chain.Bitcoin)
    const ethAddress = await vault.getAddress(Chain.Ethereum)
    
    console.log({ btcAddress, ethAddress })
  } catch (error) {
    console.error('Vault creation failed:', error)
  }
}
```

### Node.js Backend

```typescript
import { VultisigSDK, Chain } from 'vultisig-sdk'

// Address generation service
class AddressService {
  private sdk: VultisigSDK

  async initialize() {
    this.sdk = await VultisigSDK.initialize()
  }

  async getAddressesForUser(vaultData: string, chains: Chain[]) {
    const vault = await this.sdk.loadVault(vaultData)
    return this.sdk.deriveAddresses(vault, chains)
  }
}
```

## Architecture

The SDK wraps existing Vultisig core functionality with a clean TypeScript API:

- **WASM Integration**: Embeds dkls and schnorr libraries for MPC operations
- **Wallet Core**: Uses Trust Wallet Core for address derivation
- **Server Communication**: Abstracts Vultiserver API calls
- **Type Safety**: Full TypeScript definitions for all operations

## Limitations

**Current MVP focuses on:**
- ✅ Fast vault creation with email verification
- ✅ Address derivation for all supported chains
- ✅ Vault import/export functionality

**Future enhancements:**
- 🔄 Transaction signing (requires full MPC implementation)
- 🔄 Message signing capabilities  
- 🔄 Secure vault creation (multi-device)
- 🔄 Vault resharing and migration

## Development

```bash
# Install dependencies
yarn install

# Build SDK
yarn build

# Run tests
yarn test

# Type checking
yarn typecheck
```

## License

MIT