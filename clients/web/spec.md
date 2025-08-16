# Vultisig TypeScript SDK Specification

## Overview
A comprehensive TypeScript SDK that wraps core Vultisig functionality into an easy-to-use API. Embeds WASM libraries and provides clean interfaces for vault creation, signing, and address derivation. Designed for integration into web applications, Node.js backends, and other JavaScript environments.

## Architecture

### Technology Stack
- **Language**: TypeScript with full type definitions
- **Build**: Vite for bundling (ESM + CommonJS outputs)
- **Crypto**: @trustwallet/wallet-core for address derivation
- **WASM**: Embedded dkls and schnorr libraries
- **Runtime**: Universal (Browser + Node.js compatible)
- **Distribution**: NPM package

### SDK Design Principles
- **Simple API**: Clean, intuitive methods hiding complexity
- **Type-safe**: Full TypeScript definitions and runtime validation
- **Self-contained**: Embedded WASM, no external dependencies
- **Universal**: Works in browsers and Node.js
- **Promise-based**: Async/await friendly
- **Tree-shakeable**: Modular imports for optimal bundle size

### Code Sourcing Strategy
Since this is a standalone app in a fresh repo, we'll copy essential code from the main Vultisig monorepo. Total copied code: ~2-3MB.

#### Required Files to Copy:
```
Source: /Users/dev/dev/vultisig/vultisig-windows/

WASM Libraries (~1.5MB):
├── lib/dkls/
│   ├── vs_wasm_bg.wasm (764KB)
│   ├── vs_wasm.js
│   ├── vs_wasm.d.ts
│   └── package.json
└── lib/schnorr/
    ├── vs_schnorr_wasm_bg.wasm (700KB)  
    ├── vs_schnorr_wasm.js
    ├── vs_schnorr_wasm.d.ts
    └── package.json

Core MPC APIs (~500KB):
├── core/config/index.ts (API URLs)
├── core/mpc/fast/
│   ├── config.ts
│   └── api/
│       ├── setupVaultWithServer.ts
│       ├── verifyVaultEmailCode.ts
│       └── getVaultFromServer.ts
└── core/mpc/devices/localPartyId.ts

Chain & Address Logic (~400KB):
├── core/chain/
│   ├── Chain.ts
│   ├── ChainKind.ts
│   ├── coin/coinType.ts
│   ├── signing/SignatureAlgorithm.ts
│   └── publicKey/
│       ├── getPublicKey.ts
│       ├── PublicKeys.ts
│       ├── address/deriveAddress.ts
│       ├── address/cardano.ts
│       └── ecdsa/derivePublicKey.ts

Utilities (~300KB):
├── lib/utils/
│   ├── query/queryUrl.ts
│   ├── validation/validateEmail/
│   ├── base64Encode.ts
│   ├── encryption/aesGcm/
│   ├── crypto/getHexEncodedRandomBytes.ts
│   └── file/readFileAsArrayBuffer.ts

UI Components (~300KB subset):
└── lib/ui/ (selective copy)
    ├── buttons/Button/
    ├── inputs/TextInput/
    ├── layout/Stack/
    ├── text/
    ├── theme/
    └── hooks/useBoolean.ts
```

## SDK API Design

### Core Classes

```typescript
// Main SDK entry point
export class VultisigSDK {
  static async initialize(): Promise<VultisigSDK>
  
  // Vault management
  createFastVault(config: FastVaultConfig): Promise<VaultCreation>
  loadVault(vaultData: string, password?: string): Promise<Vault>
  
  // Address derivation
  deriveAddresses(vault: Vault, chains: Chain[]): Promise<AddressMap>
  deriveAddress(vault: Vault, chain: Chain): Promise<string>
  
  // Signing operations  
  signTransaction(vault: Vault, transaction: TxInput): Promise<SignedTx>
  signMessage(vault: Vault, message: MessageInput): Promise<Signature>
}

// Vault representation
export class Vault {
  readonly id: string
  readonly name: string
  readonly publicKeys: PublicKeys
  readonly hexChainCode: string
  
  // Convenience methods
  getAddress(chain: Chain): Promise<string>
  sign(input: SignInput): Promise<Signature>
  export(password?: string): string
}

// Vault creation flow
export class VaultCreation {
  readonly vaultId: string
  
  verifyEmail(code: string): Promise<void>
  downloadVault(password: string): Promise<Vault>
}
```

### API Examples

```typescript
// Initialize SDK
const sdk = await VultisigSDK.initialize()

// Create fast vault
const creation = await sdk.createFastVault({
  name: "My Wallet",
  email: "user@example.com", 
  password: "secure123"
})

// Verify email
await creation.verifyEmail("123456")

// Download vault
const vault = await creation.downloadVault("secure123")

// Get addresses
const addresses = await sdk.deriveAddresses(vault, [
  Chain.Bitcoin, Chain.Ethereum, Chain.Solana
])
// Returns: { Bitcoin: "bc1...", Ethereum: "0x...", Solana: "..." }

// Sign transaction
const signedTx = await sdk.signTransaction(vault, {
  chain: Chain.Ethereum,
  to: "0x...",
  amount: "1000000000000000000", // 1 ETH in wei
  gasLimit: "21000"
})
```

## API Integration

### Vultiserver Endpoints
```typescript
// From @core/mpc/fast/config.ts
const serverUrl = "https://api.vultisig.com/vault"

// Setup vault (POST /create)
setupVaultWithServer({
  name: string,
  session_id: string,
  hex_encryption_key: string,
  hex_chain_code: string,
  local_party_id: string,
  encryption_password: string,
  email: string,
  lib_type: number
})

// Verify email (GET /verify/{vaultId}/{code})
verifyVaultEmailCode({ vaultId, code })

// Download vault (GET /get/{vaultId})
getVaultFromServer({ password, vaultId })
```

## SDK Structure
```
vultisig-typescript-sdk/
├── package.json (publishable to npm)
├── tsconfig.json
├── vite.config.ts (dual build: ESM + CJS)
├── rollup.config.ts (for optimal bundling)
├── README.md (usage examples)
├── wasm/
│   ├── dkls/
│   │   ├── vs_wasm_bg.wasm
│   │   ├── vs_wasm.js
│   │   └── vs_wasm.d.ts
│   └── schnorr/
│       ├── vs_schnorr_wasm_bg.wasm
│       ├── vs_schnorr_wasm.js
│       └── vs_schnorr_wasm.d.ts
├── src/
│   ├── index.ts (main export)
│   ├── VultisigSDK.ts (main class)
│   ├── vault/
│   │   ├── Vault.ts
│   │   ├── VaultCreation.ts
│   │   ├── FastVaultAPI.ts
│   │   └── VaultEncryption.ts
│   ├── chains/
│   │   ├── Chain.ts
│   │   ├── AddressDeriver.ts
│   │   └── ChainConfig.ts
│   ├── signing/
│   │   ├── TransactionSigner.ts
│   │   ├── MessageSigner.ts
│   │   └── SignatureTypes.ts
│   ├── crypto/
│   │   ├── WASMLoader.ts
│   │   ├── KeyDerivation.ts
│   │   └── Encryption.ts
│   ├── utils/
│   │   ├── Http.ts
│   │   ├── Validation.ts
│   │   └── Encoding.ts
│   └── types/
│       ├── Config.ts
│       ├── Responses.ts
│       └── Inputs.ts
├── dist/ (generated)
│   ├── index.js (CJS)
│   ├── index.mjs (ESM)
│   ├── index.d.ts
│   └── wasm/ (copied assets)
└── examples/
    ├── web-app/
    ├── node-backend/
    └── react-integration/
```

## SDK API Surface

### Main Export
```typescript
// Single import for everything
import { VultisigSDK, Chain, Vault } from 'vultisig-sdk'

// Or modular imports
import { VaultManager } from 'vultisig-sdk/vault'
import { AddressDeriver } from 'vultisig-sdk/chains'
import { TransactionSigner } from 'vultisig-sdk/signing'
```

## Dependencies

### Package.json for SDK
```json
{
  "name": "vultisig-sdk",
  "version": "1.0.0",
  "description": "TypeScript SDK for Vultisig vault creation and signing",
  "main": "dist/index.js",
  "module": "dist/index.mjs", 
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./vault": {
      "import": "./dist/vault/index.mjs",
      "require": "./dist/vault/index.js"
    },
    "./chains": {
      "import": "./dist/chains/index.mjs", 
      "require": "./dist/chains/index.js"
    }
  },
  "files": ["dist/", "wasm/", "README.md"],
  "dependencies": {
    "@trustwallet/wallet-core": "^4.3.3",
    "uuid": "^11.1.0"
  },
  "devDependencies": {
    "vite": "^6.2.2",
    "typescript": "^5.8.2",
    "rollup": "^4.0.0",
    "vite-plugin-wasm": "^3.4.1",
    "vite-plugin-dts": "^4.0.0"
  },
  "keywords": ["crypto", "wallet", "mpc", "blockchain", "vultisig"],
  "repository": "https://github.com/vultisig/typescript-sdk",
  "license": "MIT"
}
```

### Usage Examples

#### Web Application
```typescript
import { VultisigSDK, Chain } from 'vultisig-sdk'

const sdk = await VultisigSDK.initialize()
const vault = await sdk.createFastVault({...})
const ethAddress = await vault.getAddress(Chain.Ethereum)
```

#### Node.js Backend
```typescript
import { VultisigSDK } from 'vultisig-sdk'

// Batch address generation for multiple users
const sdk = await VultisigSDK.initialize()
const vault = await sdk.loadVault(vaultData, password)
const addresses = await sdk.deriveAddresses(vault, supportedChains)
```

#### React Hook Integration
```typescript
import { useVultisig } from 'vultisig-sdk/react'

function WalletComponent() {
  const { createVault, vault, addresses } = useVultisig()
  // ... React component logic
}
```

### Copied Code Modules (from monorepo)
- **WASM**: `lib/dkls/` and `lib/schnorr/` (1.5MB)
- **Core APIs**: `core/mpc/fast/`, `core/config/` 
- **Chain logic**: `core/chain/` subset
- **Utilities**: `lib/utils/` subset
- **UI components**: `lib/ui/` subset

### Copy Instructions
1. Create fresh repo
2. Copy files from `/Users/dev/dev/vultisig/vultisig-windows/` following the file list above
3. Flatten import paths (remove workspace: references)
4. Update imports to use relative paths instead of `@core/*` and `@lib/*`

## Implementation Steps

### Phase 1: Setup SDK Repository
1. **Initialize fresh repo** with TypeScript + Vite for library bundling
2. **Copy WASM libraries** from source monorepo:
   - Copy `lib/dkls/` → `src/lib/dkls/`
   - Copy `lib/schnorr/` → `src/lib/schnorr/`
3. **Copy core MPC code**:
   - Copy `core/config/index.ts` → `src/core/config.ts`
   - Copy `core/mpc/fast/` → `src/core/mpc/fast/`
   - Copy `core/mpc/devices/localPartyId.ts` → `src/core/mpc/localPartyId.ts`
   - Copy `core/mpc/types/utils/libType.ts` → `src/core/mpc/libType.ts`
4. **Copy chain/address code**:
   - Copy `core/chain/Chain.ts` → `src/core/chain/Chain.ts`
   - Copy `core/chain/ChainKind.ts` → `src/core/chain/ChainKind.ts`
   - Copy `core/chain/coin/coinType.ts` → `src/core/chain/coinType.ts`
   - Copy `core/chain/signing/SignatureAlgorithm.ts` → `src/core/chain/SignatureAlgorithm.ts`
   - Copy `core/chain/publicKey/` → `src/core/chain/publicKey/`
5. **Copy utilities**:
   - Copy `lib/utils/query/queryUrl.ts` → `src/lib/utils/queryUrl.ts`
   - Copy `lib/utils/validation/validateEmail/` → `src/lib/utils/validateEmail.ts`
   - Copy `lib/utils/base64Encode.ts` → `src/lib/utils/base64Encode.ts`
   - Copy `lib/utils/encryption/aesGcm/` → `src/lib/utils/encryption/`
   - Copy `lib/utils/crypto/getHexEncodedRandomBytes.ts` → `src/lib/utils/crypto.ts`
6. **Copy essential UI components**:
   - Copy `lib/ui/buttons/Button/` → `src/lib/ui/Button.tsx`
   - Copy `lib/ui/inputs/TextInput/` → `src/lib/ui/TextInput.tsx`
   - Copy `lib/ui/layout/Stack/` → `src/lib/ui/Stack.tsx`
   - Copy `lib/ui/text/index.tsx` → `src/lib/ui/Text.tsx`
   - Copy `lib/ui/theme/` → `src/lib/ui/theme/`
7. **Update all imports** to use relative paths instead of workspace aliases

### Phase 2: Core Implementation
8. Implement vault creation form with validation
9. Integrate Vultiserver API calls
10. Add email verification flow
11. Implement vault download and encryption
12. Setup wallet-core integration for address derivation
13. Create address display component

### Phase 3: Polish
14. Add styling and responsive design
15. Error handling and loading states
16. Test complete flow end-to-end

### Detailed Copy Commands
```bash
# In fresh repo, create structure
mkdir -p src/{core/{config,mpc/{fast/api,devices,types/utils},chain/{coin,signing,publicKey/{address,ecdsa}}},lib/{dkls,schnorr,utils/{query,validation,encryption/aesGcm,crypto},ui/{buttons,inputs,layout,text,theme,hooks}}}

# Copy WASM (largest files)
cp -r /path/to/monorepo/lib/dkls/* src/lib/dkls/
cp -r /path/to/monorepo/lib/schnorr/* src/lib/schnorr/

# Copy core APIs
cp /path/to/monorepo/core/config/index.ts src/core/config.ts
cp -r /path/to/monorepo/core/mpc/fast/* src/core/mpc/fast/
# ... (continue for all files listed above)
```

## Security Considerations
- Password validation and secure handling
- Vault encryption before download
- No sensitive data logging
- Secure WASM module loading
- Input sanitization and validation

## State Management
- Use React hooks for local state
- Follow existing state patterns from @core/ui
- No external state management library needed for simple flow

## Styling
- Follow design system from @lib/ui
- Responsive design for desktop/mobile
- Dark/light theme support (if available in core)
- Consistent with extension and desktop app styling