import { useSdkVault } from '../SdkVaultProvider'

/**
 * Returns the current SDK vault instance, throwing if none is hydrated.
 *
 * Use this in components that require a vault to be present.
 * For optional vault access, use `useSdkVault()` instead.
 */
export const useSdkVaultRequired = () => {
  const vault = useSdkVault()
  if (!vault) {
    throw new Error(
      'useSdkVaultRequired: no SDK vault is hydrated. ' +
        'Ensure the current vault has been imported via VaultBridge.'
    )
  }
  return vault
}
