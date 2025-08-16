// Node.js example using Vultisig SDK
import { VultisigSDK, Chain } from 'vultisig-sdk'

class VaultService {
  constructor() {
    this.sdk = null
  }

  async initialize() {
    console.log('Initializing Vultisig SDK...')
    this.sdk = await VultisigSDK.initialize()
    console.log('SDK initialized successfully')
  }

  async createVaultForUser(userData) {
    if (!this.sdk) {
      throw new Error('SDK not initialized')
    }

    console.log(`Creating vault for user: ${userData.email}`)
    
    const creation = await this.sdk.createFastVault({
      name: userData.vaultName || `${userData.email}'s Wallet`,
      email: userData.email,
      password: userData.password
    })

    console.log(`Vault created with ID: ${creation.vaultId}`)
    return {
      vaultId: creation.vaultId,
      message: 'Vault created. Check email for verification code.'
    }
  }

  async verifyAndDownloadVault(vaultId, verificationCode, password) {
    // Note: In a real backend, you'd need to maintain vault creation sessions
    // This is a simplified example
    console.log(`Verifying vault ${vaultId} with code ${verificationCode}`)
    
    // This would require maintaining the VaultCreation instance
    // In practice, you'd store vault creation state in a database/cache
    throw new Error('Vault verification requires session management - see web example')
  }

  async getAddressesForVault(vaultData, requestedChains = ['btc', 'eth', 'sol']) {
    if (!this.sdk) {
      throw new Error('SDK not initialized')
    }

    const vault = await this.sdk.loadVault(vaultData)
    
    // Map string chain names to Chain enum
    const chains = requestedChains.map(chainName => {
      switch (chainName.toLowerCase()) {
        case 'btc': return Chain.Bitcoin
        case 'eth': return Chain.Ethereum
        case 'sol': return Chain.Solana
        case 'avax': return Chain.Avalanche
        case 'matic': return Chain.Polygon
        case 'bsc': return Chain.BSC
        case 'atom': return Chain.Cosmos
        case 'thor': return Chain.THORChain
        default: throw new Error(`Unsupported chain: ${chainName}`)
      }
    })

    return this.sdk.deriveAddresses(vault, chains)
  }

  async batchAddressGeneration(vaults, chains) {
    console.log(`Generating addresses for ${vaults.length} vaults`)
    
    const results = []
    for (const vaultData of vaults) {
      try {
        const addresses = await this.getAddressesForVault(vaultData, chains)
        results.push({
          vaultId: JSON.parse(vaultData).id,
          addresses,
          success: true
        })
      } catch (error) {
        results.push({
          vaultId: vaultData.id || 'unknown',
          error: error.message,
          success: false
        })
      }
    }
    
    return results
  }
}

// Example usage
async function main() {
  const service = new VaultService()
  await service.initialize()

  // Example: Create vault
  try {
    const result = await service.createVaultForUser({
      email: 'test@example.com',
      password: 'SecurePassword123!',
      vaultName: 'Test Wallet'
    })
    console.log('Vault creation result:', result)
  } catch (error) {
    console.error('Error:', error.message)
  }

  // Example: Generate addresses (would require existing vault data)
  // const addresses = await service.getAddressesForVault(vaultData, ['btc', 'eth', 'sol'])
  // console.log('Generated addresses:', addresses)
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export { VaultService }