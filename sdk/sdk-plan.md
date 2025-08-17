# VultiSig SDK - Comprehensive Development Plan

## Overview

This document outlines a complete plan to build a VultiSig SDK that transforms the existing clients/extension architecture into a holistic SDK for React/Vite/JS applications. The SDK will provide complete Fast Vault functionality including creation, balance viewing, transaction signing, and message signing.

## Project Goals

- Create a standalone SDK package at `vultisig-windows/sdk/`
- Import and utilize existing core modules (`@core/chain`, `@core/mpc`, `@core/ui`, etc.)
- Support Fast Vault creation flow (email → password → verification → keygen)
- Provide balance querying and management
- Enable transaction and message signing
- Include comprehensive examples for React/Vite/JS integration
- Package for npm distribution
- Include UI components for rapid deployment

## Phase 1: Architecture & Foundation

### 1.1 SDK Directory Structure
```
sdk/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── README.md
├── src/
│   ├── index.ts                    # Main SDK export
│   ├── VultisigSDK.ts             # Core SDK class
│   ├── types/                     # Type definitions
│   │   ├── Config.ts
│   │   ├── Vault.ts
│   │   └── Transaction.ts
│   ├── vault/                     # Vault management
│   │   ├── VaultCreation.ts       # Fast vault creation
│   │   ├── VaultManager.ts        # Vault operations
│   │   └── FastVaultAPI.ts        # Server API wrapper
│   ├── signing/                   # Transaction & message signing
│   │   ├── TransactionSigner.ts
│   │   └── MessageSigner.ts
│   ├── chains/                    # Chain-specific functionality
│   │   ├── AddressDeriver.ts
│   │   └── BalanceManager.ts
│   └── ui/                        # Re-exported UI components
│       ├── VaultCreator.tsx
│       ├── BalanceDisplay.tsx
│       └── SigningPrompt.tsx
├── examples/                      # SDK usage examples
│   ├── react-integration/
│   ├── vite-app/
│   ├── vanilla-js/
│   └── node-backend/
└── dist/                          # Built output
```

### 1.2 Core Dependencies Analysis
Based on research, the SDK will import:

**Core Modules:**
- `@core/chain` - Chain management, coin handling, balance queries
- `@core/mpc` - MPC operations, Fast Vault APIs, keygen/keysign
- `@core/ui` - Pre-built UI components and flows
- `@core/config` - Configuration management

**Lib Modules:**
- `@lib/ui` - Base UI components, theming, state management
- `@lib/utils` - Utility functions, crypto, validation
- `@lib/dkls` - DKLS WASM library
- `@lib/schnorr` - Schnorr WASM library

**External Dependencies:**
- `@trustwallet/wallet-core` - Wallet core functionality
- Existing chain libraries (ethers, viem, @solana/web3.js, etc.)

### 1.3 Workspace Dependencies Setup
The SDK package.json must properly link to internal monorepo packages:

```json
{
  "name": "@vultisig/sdk",
  "version": "1.0.0",
  "dependencies": {
    "@core/chain": "workspace:*",
    "@core/mpc": "workspace:*",
    "@core/ui": "workspace:*",
    "@core/config": "workspace:*",
    "@lib/ui": "workspace:*",
    "@lib/utils": "workspace:*",
    "@lib/dkls": "workspace:*",
    "@lib/schnorr": "workspace:*"
  }
}
```

**Implementation Steps:**
- After creating package.json, run `yarn install` from root to link workspaces
- Test imports: `import { Chain } from '@core/chain/Chain'`

### 1.4 WASM Asset Handling
The SDK must bundle WASM files for cryptographic operations:

**Required WASM Files:**
- `wallet-core.wasm` (from clients/extension/public/)
- `vs_wasm_bg.wasm` (from @lib/dkls)
- `vs_schnorr_wasm_bg.wasm` (from @lib/schnorr)

**Vite Configuration:**
```typescript
import { defineConfig } from 'vite';
export default defineConfig({
  assetsInclude: ['**/*.wasm'],
  build: { target: 'esnext' }
});
```

**WASM Loading in SDK:**
```typescript
// In src/VultisigSDK.ts constructor
await import('@trustwallet/wallet-core').then(module => module.initWasm());
```

### 1.5 SDK Core Class Design
```typescript
export class VultisigSDK {
  private config: SDKConfig
  private vaultManager: VaultManager
  private transactionSigner: TransactionSigner
  private messageSigner: MessageSigner
  
  constructor(config: SDKConfig)
  
  // Vault Operations
  async createFastVault(params: FastVaultParams): Promise<Vault>
  async getVault(vaultId: string, password: string): Promise<Vault>
  async verifyVaultEmail(vaultId: string, code: string): Promise<void>
  
  // Balance & Address Management
  async getBalances(vault: Vault): Promise<CoinBalances>
  async deriveAddress(vault: Vault, chain: string): Promise<string>
  
  // Signing Operations
  async signTransaction(vault: Vault, txData: TransactionData): Promise<string>
  async signMessage(vault: Vault, message: string): Promise<string>
  
  // UI Components (React)
  getVaultCreatorComponent(): React.ComponentType
  getBalanceDisplayComponent(): React.ComponentType
  getSigningPromptComponent(): React.ComponentType
}
```

## Phase 2: Fast Vault Implementation

### 2.1 Fast Vault Creation Flow
Transform the existing `CreateFastVaultFlow` into SDK methods:

**Flow Steps:**
1. **Name Step** - Vault name input
2. **Email Step** - Email collection and validation
3. **Password Step** - Secure password setup
4. **Password Hint Step** - Password hint for recovery
5. **Keygen Step** - MPC key generation with server

**API Integration:**
- `setupVaultWithServer()` - `/vault/create` endpoint
- `verifyVaultEmailCode()` - `/vault/verify/{vaultId}/{code}` endpoint
- Integration with DKLS keygen flow

### 2.2 Vault Management
```typescript
export class VaultManager {
  async createFastVault(params: {
    name: string
    email: string
    password: string
    passwordHint?: string
  }): Promise<{
    vault: Vault
    verificationRequired: boolean
    vaultId: string
  }>
  
  async verifyEmail(vaultId: string, code: string): Promise<void>
  async retrieveVault(vaultId: string, password: string): Promise<Vault>
  async getVaultBalances(vault: Vault): Promise<CoinBalances>
  
  // Secure local storage
  async storeVault(vault: Vault, password: string): Promise<void>
}
```

**Enhanced Error Handling:**
```typescript
async verifyEmail(vaultId: string, code: string): Promise<void> {
  try {
    const response = await fetch(`${this.serverUrl}/vault/verify/${vaultId}/${code}`);
    if (!response.ok) {
      if (response.status === 400) throw new Error('Invalid verification code');
      if (response.status === 410) throw new Error('Verification code expired');
      throw new Error('Verification failed: ' + response.statusText);
    }
  } catch (error) {
    console.error('Email verification error:', error);
    throw error; // Re-throw for consumer handling
  }
}
```

**Secure Vault Storage:**
```typescript
import { encryptWithPasscode, decryptWithPasscode } from '@core/ui/passcodeEncryption/PasscodeEncryption';

async retrieveVault(vaultId: string, password: string): Promise<Vault> {
  const encryptedData = localStorage.getItem(`vault_${vaultId}`);
  if (!encryptedData) throw new Error('Vault not found');
  const decrypted = await decryptWithPasscode(encryptedData, password);
  return JSON.parse(decrypted) as Vault;
}

async storeVault(vault: Vault, password: string): Promise<void> {
  const encrypted = await encryptWithPasscode(JSON.stringify(vault), password);
  localStorage.setItem(`vault_${vault.vaultId}`, encrypted);
}
```

### 2.3 Fast Vault API Wrapper
```typescript
export class FastVaultAPI {
  private serverUrl: string
  
  async createVault(params: CreateVaultParams): Promise<void>
  async getVault(vaultId: string, password: string): Promise<VaultData>
  async verifyEmail(vaultId: string, code: string): Promise<void>
  async signWithServer(params: SignParams): Promise<void>
  async reshareVault(params: ReshareParams): Promise<void>
}
```

## Phase 3: Signing Implementation

### 3.1 Transaction Signing
Based on existing keysign implementation:

```typescript
export class TransactionSigner {
  async signTransaction(
    vault: Vault,
    transaction: TransactionData
  ): Promise<SignedTransaction> {
    // 1. Validate transaction data
    // 2. Resolve chain-specific logic
    const chain = this.resolveChain(transaction.to);
    // 3. Generate keysign payload using existing chain-specific logic
    const payload = await this.generateKeysignPayload(vault, transaction, chain);
    // 4. Call signWithServer API
    const signed = await signWithServer(payload);
    // 5. Return signed transaction
    return signed;
  }
  
  private resolveChain(address: string): Chain {
    // Use existing chain resolvers from @core/chain
    return getChainFromAddress(address);
  }
  
  async estimateGas(transaction: TransactionData): Promise<string>
  async broadcastTransaction(signedTx: SignedTransaction): Promise<string>
}
```

### 3.2 Message Signing
```typescript
export class MessageSigner {
  async signMessage(
    vault: Vault,
    message: string,
    chain: string
  ): Promise<string> {
    let formattedMessage: string;
    switch (chain) {
      case 'ethereum':
        formattedMessage = `0x${Buffer.from(message).toString('hex')}`;
        break;
      case 'cosmos':
        formattedMessage = JSON.stringify({ message }); // Cosmos stdMsg
        break;
      default:
        throw new Error(`Unsupported chain: ${chain}`);
    }
    // Proceed with MPC signing
    return await this.mpcSign(vault, formattedMessage);
  }
  
  private async mpcSign(vault: Vault, message: string): Promise<string> {
    // Use @core/mpc signing infrastructure
    return await signWithServer({ vault, message });
  }
}
```

### 3.3 Chain-Specific Implementations
Leverage existing chain-specific resolvers:
- EVM chains (Ethereum, BSC, Polygon, etc.)
- Cosmos chains (Cosmos Hub, Osmosis, Kujira, etc.)
- UTXO chains (Bitcoin, Litecoin, etc.)
- Other chains (Solana, Polkadot, THORChain, etc.)

## Phase 4: UI Components

### 4.1 Pre-built Components
Export React components from `@core/ui`:

```typescript
// Vault Creation Components
export { CreateFastVaultFlow } from '@core/ui/mpc/keygen/create/fast/CreateFastVaultFlow'
export { FastVaultPasswordVerification } from '@core/ui/mpc/fast/FastVaultPasswordVerification'

// Balance Components  
export { VaultTotalBalance } from '@core/ui/vault/balance/VaultTotalBalance'
export { VaultChainCoinItem } from '@core/ui/vault/chain/VaultChainCoinItem'

// Signing Components
export { KeysignSigningStep } from '@core/ui/mpc/keysign/KeysignSigningStep'
export { StartKeysignFlow } from '@core/ui/mpc/keysign/start/StartKeysignFlow'

// UI Foundation with Theme Integration
import { ThemeProvider as LibThemeProvider } from '@lib/ui/theme/ThemeProvider';

export const SDKThemeProvider: React.FC<{ 
  children: ReactNode; 
  mode?: 'light' | 'dark' 
}> = ({ children, mode = 'light' }) => (
  <LibThemeProvider theme={mode}>
    {children}
  </LibThemeProvider>
);

export { Button } from '@lib/ui/buttons/Button'
export { Modal } from '@lib/ui/modal'
```

### 4.2 Custom SDK Components
```typescript
// Wrapper components specific to SDK usage with theme integration
export const VaultCreator: React.FC<VaultCreatorProps> = (props) => (
  <SDKThemeProvider>
    <CreateFastVaultFlow {...props} />
  </SDKThemeProvider>
);

export const BalanceDisplay: React.FC<BalanceDisplayProps> = (props) => (
  <SDKThemeProvider>
    <VaultTotalBalance {...props} />
  </SDKThemeProvider>
);

export const TransactionSigner: React.FC<TransactionSignerProps> = (props) => (
  <SDKThemeProvider>
    <StartKeysignFlow {...props} />
  </SDKThemeProvider>
);
```

## Phase 5: Examples Implementation

### 5.1 React Integration Example
**File:** `examples/react-integration/`

Demo app showing:
- Fast Vault creation flow with full UI
- Real-time balance display
- Transaction signing integration
- Message signing
- Multi-chain support

**Key Features:**
```typescript
import { VultisigSDK, VaultCreator, BalanceDisplay } from '@vultisig/sdk'

function App() {
  const [sdk] = useState(() => new VultisigSDK({ 
    serverUrl: 'https://api.vultisig.com' 
  }))
  const [vault, setVault] = useState<Vault | null>(null)
  
  return (
    <div>
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
    </div>
  )
}
```

### 5.2 Vite App Example
**File:** `examples/vite-app/`

Minimal Vite application demonstrating:
- SDK initialization
- Vault creation without UI components (headless)
- Balance fetching
- Transaction preparation and signing

### 5.3 Vanilla JS Example
**File:** `examples/vanilla-js/`

Pure JavaScript integration showing:
- SDK usage without React
- Direct API calls
- Manual vault management

### 5.4 Node.js Backend Example
**File:** `examples/node-backend/`

Server-side vault operations:
- Vault creation and management
- Balance monitoring
- Programmatic signing

## Phase 6: NPM Packaging Strategy

### 6.1 Package Configuration
```json
{
  "name": "@vultisig/sdk",
  "version": "1.0.0",
  "description": "VultiSig SDK for React/Vite/JS applications",
  "main": "dist/index.js",
  "module": "dist/index.esm.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.esm.js",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./ui": {
      "import": "./dist/ui.esm.js",
      "require": "./dist/ui.js", 
      "types": "./dist/ui.d.ts"
    }
  },
  "files": ["dist", "README.md"],
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "peerDependenciesMeta": {
    "react": { "optional": true },
    "react-dom": { "optional": true }
  },
  "dependencies": {
    "@core/chain": "workspace:*",
    "@core/mpc": "workspace:*",
    "@core/ui": "workspace:*",
    "@core/config": "workspace:*",
    "@lib/ui": "workspace:*",
    "@lib/utils": "workspace:*",
    "@lib/dkls": "workspace:*",
    "@lib/schnorr": "workspace:*"
  }
}
```

### 6.2 Build Configuration
- **Vite** for bundling with multiple entry points
- **TypeScript** declarations generation
- **Tree-shaking** support for optimal bundle sizes
- **WASM** asset handling for dkls and schnorr libraries
- **Separate bundles** for core SDK and UI components

### 6.3 Distribution Strategy
- Publish to NPM registry as `@vultisig/sdk`
- Separate UI bundle for users who don't need React components
- CDN distribution for vanilla JS usage
- TypeScript declarations for full IDE support

## Phase 7: Implementation Steps

### Step 1: Setup SDK Structure
1. Create `sdk/` directory in repository root
2. Initialize package.json with workspace configuration
3. Setup TypeScript and build configuration
4. Configure Vite with proper externals and WASM handling

### Step 2: Core SDK Implementation
1. Implement `VultisigSDK` main class
2. Create `VaultManager` with Fast Vault API integration
3. Implement `TransactionSigner` and `MessageSigner`
4. Setup chain-specific address derivation
5. Integrate balance querying functionality

### Step 3: UI Component Integration
1. Re-export existing `@core/ui` components
2. Create SDK-specific wrapper components
3. Setup theme provider and styling
4. Implement state management hooks
5. Create component documentation

### Step 4: Examples Development
1. **React Integration Example:**
   - Complete vault creation flow
   - Balance dashboard
   - Transaction signing demo
   - Multi-chain showcase

2. **Vite App Example:**
   - Minimal setup demonstration
   - Headless SDK usage
   - Performance optimization showcase

3. **Vanilla JS Example:**
   - Browser-compatible usage
   - Direct API interaction
   - No-framework integration

4. **Node.js Backend Example:**
   - Server-side vault management
   - Automated balance monitoring
   - Programmatic transaction signing

### Step 5: Build & Packaging
1. Configure Vite build for multiple entry points
2. Setup TypeScript declaration generation
3. Implement WASM asset bundling
4. Create distribution scripts
5. Setup automated testing

### Step 6: Documentation & Publishing
1. Generate comprehensive README
2. Create API documentation
3. Write integration guides
4. Setup NPM publishing workflow
5. Create example deployment guides

## Technical Specifications

### Dependencies Integration

**From Current Repo:**
```typescript
// Core modules
import { Chain, Coin, ChainKind } from '@core/chain'
import { setupVaultWithServer, getVaultFromServer, signWithServer } from '@core/mpc'
import { CreateFastVaultFlow, VaultTotalBalance } from '@core/ui'

// Lib modules  
import { queryUrl, validateEmail } from '@lib/utils'
import { Button, Modal, ThemeProvider } from '@lib/ui'
import { initializeDkls } from '@lib/dkls'
import { initializeSchnorr } from '@lib/schnorr'
```

**WASM Libraries:**
- `@lib/dkls` - DKLS cryptographic operations
- `@lib/schnorr` - Schnorr signature schemes
- `wallet-core.wasm` - TrustWallet core functionality

**Chain Libraries:**
- Ethereum: `viem`, `ethers`
- Cosmos: `@cosmjs/stargate`, `cosmjs-types`  
- Solana: `@solana/web3.js`
- Bitcoin: `@trustwallet/wallet-core`
- Other chains via existing integrations

### API Endpoints Integration

**Fast Vault Server APIs:**
- `POST /vault/create` - Create new Fast Vault
- `GET /vault/get/{vaultId}` - Retrieve vault data  
- `POST /vault/sign` - Sign with server assistance
- `GET /vault/verify/{vaultId}/{code}` - Verify email code
- `POST /vault/reshare` - Reshare vault keys

### State Management

**Vault State:**
```typescript
interface VaultState {
  currentVault: Vault | null
  isAuthenticated: boolean
  balances: Record<string, CoinBalance>
  addresses: Record<string, string>
}
```

**SDK Configuration:**
```typescript
interface SDKConfig {
  serverUrl?: string
  theme?: 'light' | 'dark'
  supportedChains?: ChainKind[]
  apiKey?: string
}
```

## Security Considerations

### Key Management
- No private keys stored in SDK
- Server-assisted signing with MPC
- Client-side key derivation only
- Secure password handling

### API Security
- HTTPS-only communication
- Request authentication
- Error handling and logging
- Rate limiting compliance

### WASM Security
- Verified WASM modules from trusted sources
- Sandboxed execution environment
- Memory management best practices

## Testing Strategy

### Unit Tests
- Core SDK functionality
- Vault operations
- Chain-specific implementations
- Cryptographic operations

### Integration Tests  
- End-to-end vault creation
- Transaction signing flows
- Multi-chain operations
- Error handling scenarios

### Example Tests
- React component rendering
- API integration
- Build verification
- Performance benchmarks

## Deployment & Distribution

### Build Process
1. TypeScript compilation
2. Vite bundling with code splitting
3. WASM asset optimization
4. Declaration file generation
5. Package optimization

### NPM Publishing
- Automated version management
- Changelog generation
- Release notes
- Tag management

### CDN Distribution
- Bundle hosting for vanilla JS usage
- Version-specific URLs
- Integrity checksums
- Global variable exports

## Success Metrics

### Technical Metrics
- Bundle size < 500KB (gzipped)
- Tree-shaking support
- TypeScript 100% coverage
- Zero known security vulnerabilities

### Usability Metrics
- Complete example applications
- < 5 minute integration time
- Comprehensive documentation
- Active community support

## Risk Assessment & Mitigation

### Technical Risks
- **WASM compatibility** - Test across browsers and Node.js environments
- **Bundle size** - Implement code splitting and lazy loading
- **Dependency conflicts** - Use peer dependencies appropriately

### Security Risks
- **Private key exposure** - Maintain server-assisted signing model
- **API vulnerabilities** - Implement proper authentication and validation
- **Supply chain attacks** - Pin dependency versions and audit regularly

### Maintenance Risks
- **Core module changes** - Establish versioning strategy and compatibility matrix
- **API changes** - Implement graceful degradation and version negotiation
- **Documentation drift** - Automate documentation generation from code

## Implementation Timeline

### Week 1-2: Foundation
- Setup SDK directory structure
- Configure build system
- Implement core SDK class
- Basic vault creation

### Week 3-4: Core Features
- Complete vault management
- Implement transaction signing
- Add balance querying
- Chain-specific implementations

### Week 5-6: UI Components
- Export existing UI components
- Create SDK-specific wrappers
- Implement theme integration
- Add component documentation

### Week 7-8: Examples & Testing
- Build React integration example
- Create Vite app demo
- Implement vanilla JS example
- Add comprehensive testing

### Week 9-10: Documentation & Publishing
- Write comprehensive documentation
- Setup NPM publishing
- Create deployment guides
- Final testing and QA

## Conclusion

This comprehensive plan provides a roadmap for creating a complete VultiSig SDK that leverages existing infrastructure while providing a modern, developer-friendly interface. The modular approach ensures maintainability while the extensive examples and documentation will drive adoption.

The SDK will enable developers to easily integrate VultiSig's secure, server-assisted signing into their applications without needing to understand the underlying MPC cryptography or manage complex vault operations directly.