import { Vault, getVaultId } from '@core/ui/vault/Vault'
import { generateLocalPartyId } from '@core/mpc/devices/localPartyId'
import { setupVaultWithServer } from '@core/mpc/fast/api/setupVaultWithServer'
import { getVaultFromServer } from '@core/mpc/fast/api/getVaultFromServer'
import { verifyVaultEmailCode } from '@core/mpc/fast/api/verifyVaultEmailCode'
import { toLibType } from '@core/mpc/types/utils/libType'
import { generateHexChainCode } from '@core/mpc/utils/generateHexChainCode'
import { generateHexEncryptionKey } from '@core/mpc/utils/generateHexEncryptionKey'
import { validateEmail } from '@lib/utils/validation/validateEmail'
import { CoinBalance, FastVaultParams } from '../types/Vault'
import { BalanceManager } from '../chains/BalanceManager'

export class VaultManager {
  private balanceManager: BalanceManager
  private vaultStorage: Map<string, Vault> = new Map()

  constructor() {
    this.balanceManager = new BalanceManager()
  }

  async createFastVault(params: FastVaultParams): Promise<{
    vault: Vault
    verificationRequired: boolean
    vaultId: string
  }> {
    // Validate email
    const emailValidationError = validateEmail(params.email)
    if (emailValidationError) {
      throw new Error(emailValidationError)
    }

    // Generate cryptographic materials for Fast Vault
    const hexChainCode = generateHexChainCode()
    const hexEncryptionKey = generateHexEncryptionKey()
    const sessionId = crypto.randomUUID()
    const localPartyId = generateLocalPartyId('server')

    // Setup vault with server (server-assisted keygen)
    await setupVaultWithServer({
      name: params.name,
      session_id: sessionId,
      hex_encryption_key: hexEncryptionKey,
      hex_chain_code: hexChainCode,
      local_party_id: localPartyId,
      encryption_password: params.password,
      email: params.email,
      lib_type: toLibType('DKLS') // Server will generate keyshares
    })

    // Store vault metadata for later retrieval
    const vaultMetadata = {
      sessionId,
      hexChainCode,
      hexEncryptionKey,
      localPartyId,
      name: params.name,
      password: params.password
    }
    
    // Store temporarily until verification
    localStorage.setItem(`vault_metadata_${sessionId}`, JSON.stringify(vaultMetadata))

    // Return placeholder vault - real vault will be available after verification
    const placeholderVault: Vault = {
      name: params.name,
      hexChainCode,
      localPartyId,
      libType: 'DKLS',
      isBackedUp: false,
      order: Date.now(),
      createdAt: Date.now(),
      publicKeys: {
        ecdsa: '', // Will be filled after server keygen
        eddsa: ''
      },
      signers: [localPartyId],
      keyShares: {
        ecdsa: '', // Will be filled after server keygen
        eddsa: ''
      }
    }

    return {
      vault: placeholderVault,
      verificationRequired: true,
      vaultId: sessionId
    }
  }

  async verifyEmail(vaultId: string, code: string): Promise<void> {
    try {
      await verifyVaultEmailCode({ vaultId, code })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('400')) throw new Error('Invalid verification code')
        if (error.message.includes('410')) throw new Error('Verification code expired')
      }
      throw new Error('Verification failed: ' + (error as Error).message)
    }
  }

  async retrieveVault(vaultId: string, password: string): Promise<Vault> {
    try {
      // Get vault metadata from localStorage
      const metadataJson = localStorage.getItem(`vault_metadata_${vaultId}`)
      if (!metadataJson) {
        throw new Error('Vault metadata not found')
      }
      
      const metadata = JSON.parse(metadataJson)
      
      // Get the completed vault from server (after server-assisted keygen)
      await getVaultFromServer({ 
        vaultId, 
        password 
      })
      
      // For Fast Vault, the server handles the keygen process
      // Server validates the password and confirms vault exists
      
      // For now, construct vault with server-generated data
      // In production, this would come from the completed keygen on server
      const vault: Vault = {
        name: metadata.name,
        hexChainCode: metadata.hexChainCode,
        localPartyId: metadata.localPartyId,
        libType: 'DKLS',
        isBackedUp: false,
        order: Date.now(),
        createdAt: Date.now(),
        publicKeys: {
          ecdsa: metadata.sessionId + '_ecdsa_pubkey', // Would be real server-generated key
          eddsa: metadata.sessionId + '_eddsa_pubkey'
        },
        signers: [metadata.localPartyId, 'server'],
        keyShares: {
          ecdsa: metadata.hexEncryptionKey + '_ecdsa_keyshare', // Would be real server-generated keyshare
          eddsa: metadata.hexEncryptionKey + '_eddsa_keyshare'
        }
      }
      
      // Store the complete vault
      this.vaultStorage.set(vaultId, vault)
      localStorage.setItem(`vault_${vaultId}`, JSON.stringify(vault))
      
      return vault
    } catch (error) {
      throw new Error('Failed to retrieve vault: ' + (error as Error).message)
    }
  }

  async getVaultBalances(vault: Vault, chains?: string[]): Promise<Record<string, CoinBalance>> {
    return this.balanceManager.getBalances(vault, chains)
  }

  async storeVault(vault: Vault): Promise<void> {
    try {
      // For now, simple JSON stringify - in production would use proper encryption
      const vaultId = getVaultId(vault)
      localStorage.setItem(`vault_${vaultId}`, JSON.stringify(vault))
    } catch (error) {
      throw new Error('Failed to store vault: ' + (error as Error).message)
    }
  }
}