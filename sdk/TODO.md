# VultiSig SDK - TODO

## 🚨 Critical Issues (Fix First)

### 1. Complete Vault Creation Flow
**File:** `src/vault/VaultManager.ts:63-81`
- **Problem:** Returns placeholder vault with empty `publicKeys` and `keyShares`
- **Action:** Implement server keygen completion after email verification
- **Code:** Fill empty strings in vault object after `verifyVaultEmailCode()` success

### 2. Remove Debug Logging
**Files:** `examples/react/src/components/VaultCreator.tsx`, `NetworkStatus.tsx`, `App.tsx`
- **Problem:** Extensive `console.log` statements throughout examples
- **Action:** Remove all debug logging from production example code

## 🔧 Stub Methods (Implement)

### Transaction Utilities
**File:** `src/signing/TransactionSigner.ts`
```typescript
// Lines 175-178: Replace hardcoded gas estimation
async estimateGas(): Promise<string> {
  return "21000" // TODO: Implement real gas estimation
}

// Lines 180-183: Implement actual broadcasting
async broadcastTransaction(signedTx: SignedTransaction): Promise<string> {
  return signedTx.hash // TODO: Broadcast to network
}
```

### Balance Utilities
**File:** `src/chains/BalanceManager.ts`
```typescript
// Lines 113-116: Implement real balance refresh
async refreshBalance(): Promise<CoinBalance> {
  return { amount: '0.0', decimals: 18 } // TODO: Implement
}

// Lines 118-121: Add price feed integration
async getTotalValueUSD(): Promise<number> {
  return 0.0 // TODO: Calculate using price feeds
}
```

## 📱 Missing Examples

**Files:** `README.md:135-137` lists "coming soon" examples
- Create `examples/vite/` - Minimal Vite setup
- Create `examples/js/` - Vanilla JavaScript integration  
- Create `examples/node/` - Server-side Node.js usage

**Template:** Use `examples/react/` as reference for structure and functionality

## 🐛 Fix Disabled Features

### SimpleApp SDK Import
**File:** `examples/react/src/SimpleApp.tsx:58`
- **Problem:** "SDK Import Disabled" button, non-functional
- **Action:** Enable SDK import and test basic functionality

## 📋 Implementation Priority

### P0 (Production Blockers)
1. Fix vault creation placeholder (empty keys/keyshares)
2. Remove all debug console.log statements

### P1 (Core Features)
1. Implement `estimateGas()` with real chain integration
2. Implement `broadcastTransaction()` with network submission
3. Implement `refreshBalance()` and `getTotalValueUSD()`

### P2 (Examples & Polish)
1. Create missing example applications (Vite, Vanilla JS, Node.js)
2. Fix SimpleApp SDK import functionality

## ✅ Already Working (No Action Needed)

- MPC signing (real implementation)
- Address derivation (25+ chains supported)
- Balance querying (real chain integration)
- Server API integration (Fast Vault)
- Error handling and validation

---

**Status:** 85% complete - core functionality works, utilities need implementation
