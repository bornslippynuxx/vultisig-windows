import type { VaultBase } from '@vultisig/sdk'
import { ChildrenProp } from '@lib/ui/props'
import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useState,
} from 'react'

type SdkVaultState = {
  vault: VaultBase | null
  setVault: Dispatch<SetStateAction<VaultBase | null>>
}

const SdkVaultContext = createContext<SdkVaultState | undefined>(undefined)

/**
 * Provides the current SDK vault instance to the component tree.
 *
 * The vault starts as `null` — it will be populated when vault operations
 * are migrated to SDK calls (Step 9). Components can read the vault
 * via `useSdkVault()` and set it via `useSetSdkVault()`.
 */
export const SdkVaultProvider = ({ children }: ChildrenProp) => {
  const [vault, setVault] = useState<VaultBase | null>(null)

  return (
    <SdkVaultContext.Provider value={{ vault, setVault }}>
      {children}
    </SdkVaultContext.Provider>
  )
}

/**
 * Read the current SDK vault instance (may be null if not yet loaded).
 *
 * @example
 * ```tsx
 * const vault = useSdkVault()
 * if (vault) {
 *   const balance = useSdkEvent(vault, 'balanceUpdated')
 * }
 * ```
 */
export const useSdkVault = (): VaultBase | null => {
  const ctx = useContext(SdkVaultContext)
  if (ctx === undefined) {
    throw new Error('useSdkVault must be used within SdkVaultProvider')
  }
  return ctx.vault
}

/**
 * Get the setter to update the current SDK vault instance.
 * Used by vault loading/creation flows to populate the context.
 */
export const useSetSdkVault = (): Dispatch<
  SetStateAction<VaultBase | null>
> => {
  const ctx = useContext(SdkVaultContext)
  if (ctx === undefined) {
    throw new Error('useSetSdkVault must be used within SdkVaultProvider')
  }
  return ctx.setVault
}
