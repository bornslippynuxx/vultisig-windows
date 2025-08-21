import * as crypto from 'crypto'
import * as https from 'https'
import * as http from 'http'

export interface SignTransactionInput {
  network: string
  payload: any
  password: string
  sessionId: string
  messageType: string
  scheme: 'ecdsa' | 'eddsa'
}

export interface SignTransactionResult {
  signature: string
  signedPsbtBase64?: string
  finalTxHex?: string
  raw?: string
}

export class VultiServerClient {
  private readonly baseUrl: string = 'https://api.vultisig.com/vault/router'

  /**
   * Check if vault exists on VultiServer by attempting to get vault info
   * Uses the vault/get/{vaultId} endpoint with password in x-password header
   */
  async checkVaultExists(password: string): Promise<boolean> {
    try {
      // For vault detection, we need to derive a vault ID from the current vault
      // This is a simplified approach - in practice, we'd need the actual vault ID
      // For now, we'll attempt a generic check
      const vaultId = await this.deriveVaultId(password)
      
      const url = `${this.baseUrl}/get/${vaultId}`
      const response = await this.makeRequest(url, {
        method: 'GET',
        headers: {
          'x-password': this.base64Encode(password),
          'Content-Type': 'application/json'
        }
      })
      
      return response.status === 200
    } catch (error) {
      // If we get a 404 or other error, vault doesn't exist on server
      return false
    }
  }

  /**
   * Sign transaction using VultiServer vault/sign endpoint
   */
  async signTransaction(input: SignTransactionInput): Promise<SignTransactionResult> {
    const vaultId = await this.deriveVaultId(input.password)
    
    // Extract messages from payload based on network type
    const messages = this.extractMessagesFromPayload(input.payload, input.network)
    
    const signRequest = {
      public_key: await this.getPublicKey(vaultId, input.password, input.scheme),
      messages,
      session: input.sessionId,
      hex_encryption_key: crypto.randomBytes(32).toString('hex'),
      derive_path: this.getDerivationPath(input.network),
      is_ecdsa: input.scheme === 'ecdsa',
      vault_password: input.password
    }

    const url = `${this.baseUrl}/sign`
    const response = await this.makeRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(signRequest)
    })

    if (response.status !== 200) {
      const error = await response.text()
      throw new Error(`VultiServer signing failed: ${error}`)
    }

    const result = await response.json()
    
    return {
      signature: result.signature || result.r + result.s,
      signedPsbtBase64: result.signedPsbtBase64,
      finalTxHex: result.finalTxHex,
      raw: result.raw
    }
  }

  /**
   * Derive vault ID from password (simplified approach)
   * In practice, this would be based on the actual vault's public key or other identifier
   */
  private async deriveVaultId(password: string): Promise<string> {
    // This is a placeholder implementation
    // In the real implementation, we'd need to:
    // 1. Load the local vault to get its public key or identifier
    // 2. Use that as the vault ID for the server lookup
    // For now, we'll use a hash of the password as a simple approach
    const hash = crypto.createHash('sha256').update(password).digest('hex')
    return hash.substring(0, 16) // Use first 16 chars as vault ID
  }

  /**
   * Get public key for the vault (simplified approach)
   */
  private async getPublicKey(vaultId: string, password: string, scheme: 'ecdsa' | 'eddsa'): Promise<string> {
    // This is a placeholder implementation
    // In the real implementation, we'd need to:
    // 1. Load the local vault to get the appropriate public key
    // 2. Return the ECDSA or EdDSA public key based on the scheme
    // For now, we'll return a placeholder
    return scheme === 'ecdsa' ? 'placeholder-ecdsa-pubkey' : 'placeholder-eddsa-pubkey'
  }

  /**
   * Extract messages to sign from payload based on network
   */
  private extractMessagesFromPayload(payload: any, network: string): string[] {
    // This is a simplified implementation
    // In practice, this would need to handle different payload formats per network
    if (payload.raw) {
      return [payload.raw]
    }
    
    if (payload.message) {
      return [payload.message]
    }
    
    if (payload.messages && Array.isArray(payload.messages)) {
      return payload.messages
    }
    
    // For complex payloads, we'd need to process them based on network type
    // This is a placeholder that converts the payload to hex
    const payloadStr = JSON.stringify(payload)
    const payloadHex = Buffer.from(payloadStr).toString('hex')
    return [payloadHex]
  }

  /**
   * Get derivation path for network
   */
  private getDerivationPath(network: string): string {
    const networkLower = network.toLowerCase()
    
    // Standard BIP44 derivation paths for different networks
    const derivationPaths: Record<string, string> = {
      'btc': "m/84'/0'/0'/0/0",
      'eth': "m/44'/60'/0'/0/0",
      'matic': "m/44'/60'/0'/0/0",
      'bsc': "m/44'/60'/0'/0/0",
      'avax': "m/44'/60'/0'/0/0",
      'opt': "m/44'/60'/0'/0/0",
      'arb': "m/44'/60'/0'/0/0",
      'base': "m/44'/60'/0'/0/0",
      'sol': "m/44'/501'/0'/0'",
      'ada': "m/1852'/1815'/0'/0/0",
      'dot': "m/44'/354'/0'/0/0",
      'atom': "m/44'/118'/0'/0/0",
      'thor': "m/44'/931'/0'/0/0",
      'maya': "m/44'/931'/0'/0/0",
      'ltc': "m/84'/2'/0'/0/0",
      'doge': "m/44'/3'/0'/0/0",
      'xrp': "m/44'/144'/0'/0/0",
      'trx': "m/44'/195'/0'/0/0",
      'sui': "m/44'/784'/0'/0/0",
      'ton': "m/44'/607'/0'/0/0"
    }
    
    return derivationPaths[networkLower] || "m/44'/60'/0'/0/0"
  }

  /**
   * Base64 encode a string
   */
  private base64Encode(str: string): string {
    return Buffer.from(str).toString('base64')
  }

  /**
   * Make HTTP request
   */
  private async makeRequest(url: string, options: {
    method: string
    headers: Record<string, string>
    body?: string
  }): Promise<{ status: number; json: () => Promise<any>; text: () => Promise<string> }> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url)
      const isHttps = urlObj.protocol === 'https:'
      const client = isHttps ? https : http
      
      const req = client.request(url, {
        method: options.method,
        headers: options.headers
      }, (res) => {
        let data = ''
        
        res.on('data', (chunk) => {
          data += chunk
        })
        
        res.on('end', () => {
          resolve({
            status: res.statusCode || 0,
            json: async () => JSON.parse(data),
            text: async () => data
          })
        })
      })
      
      req.on('error', (error) => {
        reject(error)
      })
      
      if (options.body) {
        req.write(options.body)
      }
      
      req.end()
    })
  }
}
