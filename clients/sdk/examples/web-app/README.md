# Vultisig SDK React Web Example

A simple React application demonstrating the Vultisig SDK for fast vault creation.

## Features

- **Fast Vault Creation**: Create vaults using email/password flow
- **Email Verification**: Verify email codes sent by Vultiserver  
- **Address Derivation**: Generate blockchain addresses for multiple chains
- **Real-time Connectivity**: Monitor Vultiserver connection status

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Open http://localhost:3000 to view the app.

## Usage

1. Enter vault name, email, and password
2. Click "Create Vault" - check email for verification code
3. Enter verification code to download vault
4. View generated blockchain addresses for Bitcoin, Ethereum, Solana, etc.

## SDK Integration

The app demonstrates key SDK features:

```javascript
import { VultisigSDK, Chain } from '@vultisig/sdk'

// Initialize SDK
const sdk = await VultisigSDK.initialize()

// Create vault
const vaultCreation = await sdk.createFastVault({ name, email, password })

// Verify email and download
await vaultCreation.verifyEmail(code)
const vault = await vaultCreation.downloadVault()

// Derive addresses
const addresses = await sdk.deriveAddresses(vault, [
  Chain.Bitcoin, Chain.Ethereum, Chain.Solana
])
```