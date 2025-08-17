# VultiSig SDK

A comprehensive SDK for integrating VultiSig's secure, server-assisted multi-party computation (MPC) signing into React/Vite/JS applications.

## Features

- **Fast Vault Creation**: Email-based vault setup with MPC key generation
- **Multi-Chain Support**: Ethereum, Bitcoin, Cosmos, THORChain, Solana, and more
- **Secure Signing**: Transaction and message signing without storing private keys
- **React Components**: Pre-built UI components for rapid development
- **TypeScript Support**: Full type safety and IDE integration

## Installation

```bash
npm install @vultisig/sdk
# or
yarn add @vultisig/sdk
```

## Quick Start

### Basic SDK Usage

```typescript
import { VultisigSDK } from '@vultisig/sdk'

// Initialize SDK
const sdk = new VultisigSDK({
  serverUrl: 'https://api.vultisig.com'
})

await sdk.initialize()

// Create Fast Vault
const { vault, vaultId, verificationRequired } = await sdk.createFastVault({
  name: 'My Wallet',
  email: 'user@example.com',
  password: 'secure_password'
})

if (verificationRequired) {
  // User needs to check email for verification code
  await sdk.verifyVaultEmail(vaultId, 'verification_code')
}

// Get balances
const balances = await sdk.getBalances(vault)

// Sign transaction
const txData = {
  from: await sdk.deriveAddress(vault, 'ethereum'),
  to: '0x742d35Cc6635C0532925a3b8D4ba9ff3C7EBBBE',
  value: '0x16345785D8A0000' // 0.1 ETH
}

const signature = await sdk.signTransaction(vault, txData)
```

### React Components

```tsx
import React, { useState } from 'react'
import { VultisigSDK, SDKThemeProvider } from '@vultisig/sdk'
import { VaultCreator, BalanceDisplay } from '@vultisig/sdk/ui'

function App() {
  const [sdk] = useState(() => new VultisigSDK())
  const [vault, setVault] = useState(null)

  return (
    <SDKThemeProvider mode="light">
      {!vault ? (
        <VaultCreator 
          sdk={sdk}
          onVaultCreated={setVault}
        />
      ) : (
        <BalanceDisplay 
          sdk={sdk}
          vault={vault}
        />
      )}
    </SDKThemeProvider>
  )
}
```

## API Reference

### VultisigSDK

The main SDK class providing all core functionality.

#### Constructor

```typescript
new VultisigSDK(config?: SDKConfig)
```

#### Methods

- `initialize()` - Initialize WASM modules and crypto libraries
- `createFastVault(params)` - Create a new Fast Vault
- `verifyVaultEmail(vaultId, code)` - Verify email with code
- `getVault(vaultId, password)` - Retrieve existing vault
- `getBalances(vault)` - Get vault balances across chains
- `deriveAddress(vault, chain)` - Derive address for specific chain
- `signTransaction(vault, txData)` - Sign blockchain transaction
- `signMessage(vault, message, chain)` - Sign custom message

### Configuration

```typescript
interface SDKConfig {
  serverUrl?: string        // API server URL
  theme?: 'light' | 'dark' // UI theme
  supportedChains?: ChainKind[]
  apiKey?: string
}
```

### Supported Chains

- **EVM**: Ethereum, BSC, Polygon, Arbitrum, Optimism, Avalanche
- **Cosmos**: Cosmos Hub, Osmosis, Kujira, DyDx
- **UTXO**: Bitcoin, Litecoin, Bitcoin Cash, Dogecoin
- **Others**: Solana, Polkadot, THORChain, Ripple

## Examples

See the `examples/` directory for complete integration examples:

- `react-integration/` - Full React application with UI components
- `vite-app/` - Minimal Vite setup (coming soon)
- `vanilla-js/` - Pure JavaScript integration (coming soon)
- `node-backend/` - Server-side usage (coming soon)

## Security

- **No Private Keys**: SDK never stores or handles private keys
- **MPC Security**: All signing operations use multi-party computation
- **Server-Assisted**: Leverages VultiSig's secure server infrastructure
- **Client-Side Validation**: All inputs validated before server communication

## License

See LICENSE file for details.