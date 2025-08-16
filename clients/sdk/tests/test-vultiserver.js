// Test SDK against actual Vultiserver API
import { VultisigSDK, Chain } from '../dist/index.js'

async function testVultiserver() {
  console.log('🔗 Testing Vultisig SDK with Vultiserver API...')
  
  try {
    // Test 1: Initialize SDK
    console.log('\n1. Initializing SDK...')
    const sdk = await VultisigSDK.initialize()
    console.log('✅ SDK initialized')
    
    // Test 2: Ping Vultiserver
    console.log('\n2. Testing Vultiserver connectivity...')
    try {
      const pingResponse = await sdk.ping()
      console.log('✅ Vultiserver ping successful:', pingResponse)
    } catch (error) {
      console.log('⚠️  Vultiserver ping failed (expected if server is down):', error.message)
    }
    
    // Test 3: Test vault creation API format (this will likely fail but shows the request)
    console.log('\n3. Testing vault creation API format...')
    try {
      const creation = await sdk.createFastVault({
        name: 'Test SDK Vault',
        email: 'test@example.com',
        password: 'TestPassword123!'
      })
      
      console.log('✅ Vault creation request successful!')
      console.log('Vault ID:', creation.vaultId)
      console.log('Public Key ECDSA:', creation.publicKeyEcdsa)
      console.log('Public Key EdDSA:', creation.publicKeyEddsa)
      
      // Test verification endpoint format
      console.log('\n4. Testing verification endpoint format...')
      try {
        await creation.verifyEmail('123456')
        console.log('✅ Verification request format correct')
      } catch (verifyError) {
        console.log('⚠️  Verification failed (expected without real code):', verifyError.message)
      }
      
    } catch (vaultError) {
      console.log('⚠️  Vault creation failed (might be expected):', vaultError.message)
      
      // Check if it's a network error vs API error
      if (vaultError.message.includes('fetch')) {
        console.log('   → This appears to be a network connectivity issue')
      } else if (vaultError.message.includes('400') || vaultError.message.includes('500')) {
        console.log('   → This appears to be an API format issue')
      } else {
        console.log('   → Unknown error type')
      }
    }
    
    // Test 4: Address derivation with mock vault
    console.log('\n5. Testing address derivation...')
    try {
      const mockVault = {
        id: 'test-vault-12345',
        name: 'Test Vault',
        publicKeyEcdsa: '04' + 'a'.repeat(128), // Mock ECDSA public key
        publicKeyEddsa: 'b'.repeat(64), // Mock EdDSA public key  
        hexChainCode: 'c'.repeat(64) // Mock chain code
      }
      
      const vault = await sdk.loadVault(JSON.stringify(mockVault))
      console.log('✅ Mock vault loaded successfully')
      
      // Test individual address derivation
      const btcAddress = await vault.getAddress(Chain.Bitcoin)
      console.log('✅ Bitcoin address derived:', btcAddress)
      
      // Test batch address derivation
      const addresses = await sdk.deriveAddresses(vault, [
        Chain.Bitcoin,
        Chain.Ethereum,
        Chain.Solana
      ])
      console.log('✅ Batch address derivation successful:')
      Object.entries(addresses).forEach(([chain, addr]) => {
        console.log(`   ${chain}: ${addr}`)
      })
      
    } catch (addressError) {
      console.log('⚠️  Address derivation failed:', addressError.message)
    }
    
    console.log('\n🎉 SDK test completed! Summary:')
    console.log('   ✅ SDK initialization: Working')
    console.log('   🔗 Vultiserver connectivity: Check logs above')
    console.log('   📡 API format: Check vault creation logs above') 
    console.log('   🏠 Address derivation: Check logs above')
    
  } catch (error) {
    console.error('❌ SDK test failed:', error.message)
    console.error('Full error:', error)
  }
}

// Run the test
testVultiserver().catch(console.error)