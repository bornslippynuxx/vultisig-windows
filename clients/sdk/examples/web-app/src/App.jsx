import React, { useState, useEffect } from 'react'
import { VultisigSDK, Chain } from '@vultisig/sdk'
import NetworkStatus from './components/NetworkStatus'
import VaultForm from './components/VaultForm'
import VerificationForm from './components/VerificationForm'
import AddressDisplay from './components/AddressDisplay'

function App() {
  const [sdk, setSdk] = useState(null)
  const [vaultCreation, setVaultCreation] = useState(null)
  const [vault, setVault] = useState(null)
  const [currentStep, setCurrentStep] = useState('create') // 'create', 'verify', 'addresses'
  const [networkStatus, setNetworkStatus] = useState({ online: null, message: 'Checking Connection...' })
  const [status, setStatus] = useState('')

  useEffect(() => {
    initSDK()
  }, [])

  const initSDK = async () => {
    try {
      console.log('🚀 Starting Vultisig SDK initialization...')
      
      const sdkInstance = await VultisigSDK.initialize()
      setSdk(sdkInstance)
      console.log('✅ SDK initialized successfully!')
      
      // Test connectivity
      await testConnectivity(sdkInstance)
      
    } catch (error) {
      console.error('❌ SDK initialization failed:', error)
      setStatus(`SDK initialization failed: ${error.message}`)
    }
  }

  const testConnectivity = async (sdkInstance = sdk) => {
    if (!sdkInstance) return false
    
    try {
      setNetworkStatus({ online: null, message: '🟡 Checking Connection...' })
      
      const startTime = Date.now()
      const pingResponse = await sdkInstance.ping()
      const pingTime = Date.now() - startTime
      
      console.log(`✅ Vultiserver ping successful in ${pingTime}ms`)
      setNetworkStatus({ online: true, message: `🟢 Connected (${pingTime}ms)` })
      return true
      
    } catch (error) {
      console.error('❌ Connectivity test failed:', error)
      setNetworkStatus({ online: false, message: '🔴 Connection Failed' })
      return false
    }
  }

  const handleVaultCreated = (creation) => {
    setVaultCreation(creation)
    setCurrentStep('verify')
  }

  const handleVaultVerified = (vaultInstance) => {
    setVault(vaultInstance)
    setCurrentStep('addresses')
  }

  return (
    <div className="app">
      <NetworkStatus status={networkStatus} />
      
      <div className="container">
        <h1>Vultisig SDK - Web Example</h1>
        <p>Create a fast vault and view your blockchain addresses</p>
        
        <button 
          onClick={() => testConnectivity()} 
          disabled={!sdk}
          style={{ marginBottom: '20px' }}
        >
          Test Vultiserver Connection
        </button>

        {status && <div className="error">{status}</div>}

        {currentStep === 'create' && (
          <VaultForm 
            sdk={sdk} 
            onVaultCreated={handleVaultCreated}
            setStatus={setStatus}
          />
        )}

        {currentStep === 'verify' && (
          <VerificationForm 
            vaultCreation={vaultCreation}
            onVaultVerified={handleVaultVerified}
            setStatus={setStatus}
          />
        )}

        {currentStep === 'addresses' && (
          <AddressDisplay 
            sdk={sdk}
            vault={vault}
            chains={[
              Chain.Bitcoin,
              Chain.Ethereum, 
              Chain.Solana,
              Chain.Avalanche,
              Chain.Polygon,
              Chain.BSC,
              Chain.Cosmos,
              Chain.THORChain
            ]}
            setStatus={setStatus}
          />
        )}
      </div>
    </div>
  )
}

export default App