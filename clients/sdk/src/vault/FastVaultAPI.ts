import { fastVaultServerUrl } from '@core/mpc/fast/config'
import { queryUrl } from '@lib/utils/query/queryUrl'
import { base64Encode } from '@lib/utils/base64Encode'
import { getHexEncodedRandomBytes } from '@lib/utils/crypto/getHexEncodedRandomBytes'
import { v4 as uuidv4 } from 'uuid'

import { VaultCreation } from './VaultCreation'
import type { FastVaultConfig } from '../types/Config'

export class FastVaultAPI {
  /**
   * Health check for Vultiserver
   * Endpoint: GET /ping
   */
  async ping(): Promise<string> {
    // Note: fastVaultServerUrl is https://api.vultisig.com/vault
    // So we need to go up one level for /ping
    const baseUrl = fastVaultServerUrl.replace('/vault', '')
    const response = await queryUrl(`${baseUrl}/ping`, {
      responseType: 'text',
    })
    return response
  }

  /**
   * Create a new fast vault with the server
   * Endpoint: POST /vault/create
   * This initiates the keygen process and sends verification email
   */
  async createVault(config: FastVaultConfig): Promise<VaultCreation> {
    // Generate required keys and IDs
    const sessionId = uuidv4()
    const hexEncryptionKey = getHexEncodedRandomBytes(32) // 32 bytes = 64 hex chars
    const hexChainCode = getHexEncodedRandomBytes(32)
    const localPartyId = 'VultiServer' // Standard server party ID
    
    // Setup vault with server - this triggers keygen and email verification
    try {
      const response = await queryUrl(`${fastVaultServerUrl}/create`, {
        body: {
          name: config.name,
          session_id: sessionId,
          hex_encryption_key: hexEncryptionKey,
          hex_chain_code: hexChainCode,
          local_party_id: localPartyId,
          encryption_password: config.password,
          email: config.email,
          lib_type: 1 // DKLS = 1, GG20 = 0
        },
        responseType: 'json',
      })

      // The response should contain the public keys generated during keygen
      const { public_key_ecdsa, public_key_eddsa } = response as any

      // Return VaultCreation instance to handle verification and download
      return new VaultCreation({
        vaultId: sessionId,
        password: config.password,
        hexChainCode,
        hexEncryptionKey,
        publicKeyEcdsa: public_key_ecdsa,
        publicKeyEddsa: public_key_eddsa,
        name: config.name
      })
    } catch (error: any) {
      throw new Error(`Vault creation failed: ${error?.message || error}. Check Vultiserver connectivity and parameters.`)
    }
  }

  /**
   * Verify email code for vault creation
   * Endpoint: GET /vault/verify/{public_key_ecdsa}/{code}
   */
  async verifyEmailCode(publicKeyEcdsa: string, code: string): Promise<void> {
    try {
      await queryUrl(`${fastVaultServerUrl}/verify/${publicKeyEcdsa}/${code}`, {
        responseType: 'none',
      })
    } catch (error: any) {
      throw new Error(`Email verification failed: ${error?.message || error}. Check verification code and try again.`)
    }
  }

  /**
   * Download vault share from server after verification
   * Endpoint: GET /vault/get/{public_key_ecdsa}
   * Requires x-password header for decryption
   */
  async downloadVault(publicKeyEcdsa: string, password: string): Promise<any> {
    try {
      return queryUrl(`${fastVaultServerUrl}/get/${publicKeyEcdsa}`, {
        headers: {
          'x-password': base64Encode(password),
        },
        responseType: 'json',
      })
    } catch (error: any) {
      throw new Error(`Vault download failed: ${error?.message || error}. Check password and vault availability.`)
    }
  }

  /**
   * Resend vault share (if needed)
   * Can be called every 3 minutes per the API docs
   */
  async resendVaultShare(publicKeyEcdsa: string, password: string, email: string): Promise<void> {
    await queryUrl(`${fastVaultServerUrl}/resend`, {
      body: {
        public_key: publicKeyEcdsa,
        password,
        email
      },
      responseType: 'none',
    })
  }

  /**
   * Sign messages/transactions with the vault
   * Endpoint: POST /vault/sign
   * This initiates a signing session with the server
   */
  async signWithVault(params: {
    publicKeyEcdsa: string
    messages: string[] // Hex-encoded messages to sign
    sessionId: string
    hexEncryptionKey: string
    derivePath: string
    isEcdsa: boolean
    vaultPassword: string
  }): Promise<any> {
    try {
      return queryUrl(`${fastVaultServerUrl}/sign`, {
        body: {
          public_key: params.publicKeyEcdsa,
          messages: params.messages,
          session: params.sessionId,
          hex_encryption_key: params.hexEncryptionKey,
          derive_path: params.derivePath,
          is_ecdsa: params.isEcdsa,
          vault_password: params.vaultPassword
        },
        responseType: 'json',
      })
    } catch (error: any) {
      throw new Error(`Vault signing failed: ${error?.message || error}. Check vault availability and parameters.`)
    }
  }

}