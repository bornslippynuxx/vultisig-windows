import * as fs from 'fs'
import * as crypto from 'crypto'
import { fromBinary } from '@bufbuild/protobuf'
import { VaultContainerSchema, VaultContainer as VaultContainerPb } from '@core/mpc/types/vultisig/vault/v1/vault_container_pb'
import { VaultSchema, Vault as VaultPb } from '@core/mpc/types/vultisig/vault/v1/vault_pb'
import { fromBase64 } from '@lib/utils/fromBase64'
import { decryptWithAesGcm } from '@lib/utils/encryption/aesGcm/decryptWithAesGcm'

export interface VaultContainer {
  version?: bigint
  vault: string
  isEncrypted: boolean
}

export interface VaultData {
  name: string
  publicKeyEcdsa: string
  publicKeyEddsa: string
  signers: string[]
  createdAt?: Date
  hexChainCode: string
  keyShares: KeyShareData[]
  localPartyId: string
  resharePrefix?: string
  libType: number // 0 = GG20, 1 = DKLS
}

export interface KeyShareData {
  publicKey: string
  keyshare: string
}

export class VaultLoader {
  
  async loadVaultFromFile(filePath: string, password?: string): Promise<VaultData> {
    // Read the .vult file content
    const content = await fs.promises.readFile(filePath, 'utf8')
    return this.loadVaultFromString(content.trim(), password)
  }
  
  async loadVaultFromString(content: string, password?: string): Promise<VaultData> {
    // Parse the VaultContainer using proper protobuf
    const container = this.parseVaultContainer(content)
    
    let vaultPb: VaultPb
    if (container.isEncrypted) {
      if (!password) {
        throw new Error('Vault is encrypted but no password provided')
      }
      
      // Decrypt the vault data using monorepo utilities
      const encryptedData = fromBase64(container.vault)
      const decryptedData = decryptWithAesGcm({ key: password, value: encryptedData })
      vaultPb = fromBinary(VaultSchema, new Uint8Array(decryptedData))
    } else {
      // Decode the inner base64-encoded vault data
      const vaultBytes = fromBase64(container.vault)
      vaultPb = fromBinary(VaultSchema, new Uint8Array(vaultBytes))
    }
    
    // Convert protobuf to convenient interface
    return this.vaultPbToVaultData(vaultPb)
  }
  
  async checkIfUnencrypted(filePath: string): Promise<boolean> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf8')
      const container = this.parseVaultContainer(content.trim())
      return !container.isEncrypted
    } catch {
      return false
    }
  }
  
  private parseVaultContainer(content: string): VaultContainer {
    try {
      // Use proper protobuf parsing with monorepo libraries
      const binary = fromBase64(content)
      const containerPb = fromBinary(VaultContainerSchema, new Uint8Array(binary))
      return {
        version: containerPb.version,
        vault: containerPb.vault,
        isEncrypted: containerPb.isEncrypted
      }
    } catch (error) {
      throw new Error(`Failed to parse vault container: ${error instanceof Error ? error.message : error}`)
    }
  }
  
  private vaultPbToVaultData(vaultPb: VaultPb): VaultData {
    return {
      name: vaultPb.name,
      publicKeyEcdsa: vaultPb.publicKeyEcdsa,
      publicKeyEddsa: vaultPb.publicKeyEddsa,
      signers: vaultPb.signers,
      createdAt: vaultPb.createdAt ? new Date(Number(vaultPb.createdAt.seconds) * 1000) : undefined,
      hexChainCode: vaultPb.hexChainCode,
      keyShares: vaultPb.keyShares.map(ks => ({
        publicKey: ks.publicKey,
        keyshare: ks.keyshare
      })),
      localPartyId: vaultPb.localPartyId,
      resharePrefix: vaultPb.resharePrefix,
      libType: Number(vaultPb.libType) // Convert enum to number
    }
  }
  
  // Helper method to check if a vault file exists and is readable
  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath, fs.constants.F_OK | fs.constants.R_OK)
      return true
    } catch {
      return false
    }
  }
  
  // Helper method to get vault info without fully parsing it
  async getVaultInfo(filePath: string): Promise<{ name: string; isEncrypted: boolean; signers: string[] }> {
    const content = await fs.promises.readFile(filePath, 'utf8')
    const container = this.parseVaultContainer(content.trim())
    
    if (container.isEncrypted) {
      return {
        name: 'Encrypted Vault',
        isEncrypted: true,
        signers: []
      }
    }
    
    try {
      const vaultBytes = fromBase64(container.vault)
      const vaultPb = fromBinary(VaultSchema, new Uint8Array(vaultBytes))
      return {
        name: vaultPb.name,
        isEncrypted: false,
        signers: vaultPb.signers
      }
    } catch {
      return {
        name: 'Unknown',
        isEncrypted: container.isEncrypted,
        signers: []
      }
    }
  }
  
  private decryptVaultData(encryptedBase64: string, password: string): Buffer {
    // Decode base64
    const cipherData = Buffer.from(encryptedBase64, 'base64')
    
    // Hash password with SHA-256
    const key = crypto.createHash('sha256').update(password).digest()
    
    if (cipherData.length < 12 + 16) { // nonce + auth tag minimum
      throw new Error('Encrypted data too short')
    }
    
    // Extract components
    const nonce = cipherData.subarray(0, 12)           // First 12 bytes
    const ciphertext = cipherData.subarray(12, -16)    // Middle section
    const authTag = cipherData.subarray(-16)           // Last 16 bytes
    
    // Decrypt with AES-256-GCM
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce)
    decipher.setAuthTag(authTag)
    
    try {
      const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final()
      ])
      return decrypted
    } catch (error) {
      throw new Error(`Failed to decrypt vault: ${error instanceof Error ? error.message : error}`)
    }
  }
}