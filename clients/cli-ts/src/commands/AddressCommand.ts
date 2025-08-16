import * as path from 'path'
import { getKeyshareDir, findVultFiles } from '../utils/paths'
import { VaultLoader } from '../vault/VaultLoader'
import { AddressDeriver, parseNetworksString, SupportedChain, CHAIN_NAMES } from '../address/AddressDeriver'
import { promptForPasswordWithValidation } from '../utils/password'

export interface AddressOptions {
  vault?: string
  password?: string
  network?: string
}

export class AddressCommand {
  readonly description = 'Show wallet addresses for supported networks'
  
  async run(options: AddressOptions): Promise<void> {
    // Auto-discovery if no vault specified
    let vaultPath = options.vault
    if (!vaultPath) {
      const keyshareDir = getKeyshareDir()
      const vultFiles = await findVultFiles(keyshareDir)
      
      if (vultFiles.length === 0) {
        throw new Error(`No keyshare files (.vult) found in ${keyshareDir}`)
      }
      
      vaultPath = vultFiles[0]
      console.log(`📄 Auto-discovered keyshare: ${path.basename(vaultPath)}`)
    }
    
    const vaultLoader = new VaultLoader()
    
    // Check if vault is encrypted before requiring password
    const isUnencrypted = await vaultLoader.checkIfUnencrypted(vaultPath)
    
    // Handle password for encrypted vaults
    let password = options.password
    if (!password && !isUnencrypted) {
      password = await promptForPasswordWithValidation(vaultPath)
    } else if (isUnencrypted) {
      console.log('🔓 Vault is unencrypted, no password needed.')
    }
    
    // Load vault
    console.log(`📂 Loading vault: ${path.basename(vaultPath)}`)
    const vault = await vaultLoader.loadVaultFromFile(vaultPath, password)
    
    console.log('\
=== Vault Information ===')
    console.log(`Name: ${vault.name}`)
    console.log(`Local Party ID: ${vault.localPartyId}`)
    console.log(`Signers: ${vault.signers.join(', ')}`)
    console.log(`Library Type: ${vault.libType === 1 ? 'DKLS' : 'GG20'}`)
    
    console.log('\
=== Public Keys ===')
    console.log(`ECDSA: ${vault.publicKeyEcdsa}`)
    console.log(`EdDSA: ${vault.publicKeyEddsa}`)
    console.log(`Chain Code: ${vault.hexChainCode}`)
    
    // Parse requested networks
    const networks = options.network || 'all'
    const requestedChains = parseNetworksString(networks)
    
    // If specific networks requested, validate them
    if (networks !== 'all') {
      const invalidChains = networks.split(',')
        .map(n => n.trim().toLowerCase())
        .filter(n => !Object.keys(CHAIN_NAMES).includes(n))
      
      if (invalidChains.length > 0) {
        console.log(`\
⚠️  Warning: Unknown networks: ${invalidChains.join(', ')}`)
      }
    }
    
    // Derive addresses
    console.log('\n=== Addresses ===')
    const addressDeriver = new AddressDeriver()
    
    try {
      console.log('🔧 Initializing Trust Wallet Core...')
      const addresses = await addressDeriver.deriveAddresses(vault, requestedChains)
      
      for (const [chainName, address] of Object.entries(addresses)) {
        if (address.startsWith('Error:')) {
          console.log(`  ❌ ${chainName}: ${address}`)
        } else {
          console.log(`  ✅ ${chainName}: ${address}`)
        }
      }
      
      console.log('\n💡 Addresses generated using Trust Wallet Core with proper BIP32 derivation')
      
      // Show which algorithms were used
      const ecdsaChains = requestedChains.filter(chain => addressDeriver.getSignatureAlgorithm(chain) === 'ecdsa')
      const eddsaChains = requestedChains.filter(chain => addressDeriver.getSignatureAlgorithm(chain) === 'eddsa')
      
      if (ecdsaChains.length > 0) {
        console.log(`   📈 ECDSA chains (${ecdsaChains.length}): ${ecdsaChains.map(c => CHAIN_NAMES[c]).join(', ')}`)
      }
      if (eddsaChains.length > 0) {
        console.log(`   📊 EdDSA chains (${eddsaChains.length}): ${eddsaChains.map(c => CHAIN_NAMES[c]).join(', ')}`)
      }
      
    } catch (error) {
      console.error('❌ Error deriving addresses:', error instanceof Error ? error.message : error)
      throw error
    }
  }
}