// Simple test to verify SDK functionality
import { VultisigSDK, Chain } from '../dist/index.js'

async function testSDK() {
  console.log('🚀 Testing Vultisig SDK...')
  
  try {
    // Test SDK initialization
    console.log('1. Initializing SDK...')
    const sdk = await VultisigSDK.initialize()
    console.log('✅ SDK initialized successfully')
    
    // Test version info
    console.log('2. SDK version:', VultisigSDK.getVersion())
    
    // Test supported chains
    const supportedChains = VultisigSDK.getSupportedChains()
    console.log('3. Supported chains:', supportedChains.length)
    
    // Test address derivation with mock vault (this will fail but shows API structure)
    try {
      const mockVault = {
        id: 'test-vault',
        name: 'Test Vault',
        publicKeyEcdsa: '04' + '0'.repeat(128), // Mock public key
        publicKeyEddsa: '0'.repeat(64), // Mock public key
        hexChainCode: '0'.repeat(64) // Mock chain code
      }
      
      const vault = await sdk.loadVault(JSON.stringify(mockVault))
      console.log('4. Mock vault loaded:', vault.getInfo())
      
      // This will likely fail due to invalid keys, but tests the API
      const btcAddress = await vault.getAddress(Chain.Bitcoin)
      console.log('5. Bitcoin address:', btcAddress)
      
    } catch (error) {
      console.log('4. Address derivation test (expected to fail with mock data):', error.message)
    }
    
    console.log('✅ SDK test completed successfully')
    
  } catch (error) {
    console.error('❌ SDK test failed:', error.message)
    console.error(error.stack)
  }
}

testSDK()