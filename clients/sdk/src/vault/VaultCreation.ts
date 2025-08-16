import { FastVaultAPI } from './FastVaultAPI'
import { Vault } from './Vault'

interface VaultCreationData {
  vaultId: string
  password: string
  hexChainCode: string
  hexEncryptionKey: string
  publicKeyEcdsa: string
  publicKeyEddsa: string
  name: string
}

export class VaultCreation {
  readonly vaultId: string
  readonly publicKeyEcdsa: string
  readonly publicKeyEddsa: string
  readonly name: string
  private password: string
  private hexChainCode: string
  private hexEncryptionKey: string
  private fastVaultAPI: FastVaultAPI

  constructor(data: VaultCreationData) {
    this.vaultId = data.vaultId
    this.publicKeyEcdsa = data.publicKeyEcdsa
    this.publicKeyEddsa = data.publicKeyEddsa
    this.name = data.name
    this.password = data.password
    this.hexChainCode = data.hexChainCode
    this.hexEncryptionKey = data.hexEncryptionKey
    this.fastVaultAPI = new FastVaultAPI()
  }

  /**
   * Verify the email verification code sent by the server
   * Uses public key as identifier per Vultiserver API
   */
  async verifyEmail(code: string): Promise<void> {
    await this.fastVaultAPI.verifyEmailCode(this.publicKeyEcdsa, code)
  }

  /**
   * Download and decrypt the vault after email verification
   * Uses public key as identifier per Vultiserver API
   */
  async downloadVault(password?: string): Promise<Vault> {
    const vaultPassword = password || this.password
    
    // Download vault share from server using public key
    const vaultResponse = await this.fastVaultAPI.downloadVault(
      this.publicKeyEcdsa, 
      vaultPassword
    )

    // Create vault data structure with known information
    const vaultData = {
      id: this.vaultId,
      name: this.name,
      publicKeyEcdsa: this.publicKeyEcdsa,
      publicKeyEddsa: this.publicKeyEddsa,
      hexChainCode: this.hexChainCode,
      encryptedKeyShare: JSON.stringify(vaultResponse) // Server response contains encrypted key share
    }

    // Get WalletCore from SDK instance if available
    const sdkInstance = (this as any)._sdkInstance
    const walletCore = sdkInstance?.walletCore
    
    // Create vault with WalletCore if available
    return new Vault(vaultData, walletCore)
  }

  /**
   * Resend the vault share email if needed
   */
  async resendVaultShare(): Promise<void> {
    // This would need the original email - might need to store it
    throw new Error('Resend functionality requires storing original email')
  }

  /**
   * Get the vault ID for this creation session
   */
  getVaultId(): string {
    return this.vaultId
  }
}