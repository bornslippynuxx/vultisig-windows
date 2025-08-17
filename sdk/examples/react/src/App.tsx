import { useState, useEffect } from 'react'

// import { VultisigSDK, Vault } from '@vultisig/sdk'
import VaultCreatorComponent from './components/VaultCreator'
import BalanceDisplayComponent from './components/BalanceDisplay'
import NetworkStatus from './components/NetworkStatus'
import ConsoleLogger from './components/ConsoleLogger'

function App() {
  const [sdk] = useState(() => new VultisigSDK({ 
    serverUrl: 'https://api.vultisig.com',
    theme: 'light'
  }))
  const [vault, setVault] = useState<Vault | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<Array<{timestamp: string, level: string, message: string}>>([])
  const [statusMessage, setStatusMessage] = useState<string>('Starting application...')

  const addLog = (level: 'info' | 'error' | 'success' | 'warn', message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev.slice(-49), { timestamp, level, message }])
  }

  useEffect(() => {
    const initializeSDK = async () => {
      try {
        setStatusMessage('Initializing SDK...')
        addLog('info', 'Starting SDK initialization')
        await sdk.initialize()
        setStatusMessage('SDK initialized successfully')
        addLog('success', 'SDK initialized successfully')
        setIsInitialized(true)
      } catch (err) {
        const errorMsg = 'Failed to initialize SDK: ' + (err as Error).message
        setError(errorMsg)
        addLog('error', errorMsg)
        setStatusMessage('SDK initialization failed')
      }
    }
    
    initializeSDK()
  }, [sdk])

  const handleVaultCreated = (newVault: Vault) => {
    setVault(newVault)
    setStatusMessage(`Vault "${newVault.name}" created successfully`)
    addLog('success', `Vault "${newVault.name}" created successfully`)
    console.log('Vault created:', newVault)
  }

  const handleSignTransaction = async () => {
    if (!vault) return
    
    try {
      setStatusMessage('Preparing transaction...')
      addLog('info', 'Starting transaction signing process')
      const txData = {
        from: await sdk.deriveAddress(vault, 'ethereum'),
        to: '0x742d35Cc6635C0532925a3b8D4ba9ff3C7EBBBE',
        value: '0x16345785D8A0000',
        data: '0x'
      }
      
      setStatusMessage('Signing transaction with MPC...')
      const signature = await sdk.signTransaction(vault, txData)
      setStatusMessage('Transaction signed successfully')
      addLog('success', `Transaction signed: ${signature.substring(0, 20)}...`)
      console.log('Transaction signed:', signature)
    } catch (err) {
      setStatusMessage('Transaction signing failed')
      addLog('error', `Transaction signing failed: ${(err as Error).message}`)
      console.error('Transaction signing failed:', err)
    }
  }

  const handleSignMessage = async () => {
    if (!vault) return
    
    try {
      setStatusMessage('Signing message with MPC...')
      addLog('info', 'Starting message signing process')
      const signature = await sdk.signMessage(vault, 'Hello VultiSig!', 'ethereum')
      setStatusMessage('Message signed successfully')
      addLog('success', `Message signed: ${signature.substring(0, 20)}...`)
      console.log('Message signed:', signature)
    } catch (err) {
      setStatusMessage('Message signing failed')
      addLog('error', `Message signing failed: ${(err as Error).message}`)
      console.error('Message signing failed:', err)
    }
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h1>Error</h1>
        <p>{error}</p>
      </div>
    )
  }

  if (!isInitialized) {
    return (
      <div style={{ 
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
        padding: '20px',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ 
          maxWidth: '800px', 
          margin: '0 auto'
        }}>
          <div style={{ 
            padding: '40px', 
            textAlign: 'center',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #007bff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }} />
            <h1 style={{ color: '#333', marginBottom: '10px' }}>Initializing VultiSig SDK...</h1>
            <p style={{ color: '#666', margin: '0' }}>{statusMessage}</p>
          </div>
          <ConsoleLogger logs={logs} />
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto', 
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <div style={{ padding: '20px' }}>
            <h1 style={{ color: '#333', marginBottom: '10px' }}>VultiSig SDK - React Integration Example</h1>
            <p style={{ color: '#666', margin: '0 0 20px 0' }}>{statusMessage}</p>
            
            <NetworkStatus />
            
            {!vault ? (
              <div>
                <h2 style={{ color: '#333', marginBottom: '15px' }}>Create Fast Vault</h2>
                <p style={{ color: '#666', marginBottom: '20px' }}>
                  Create a new vault using VultiServer for secure multi-party computation.
                </p>
                <VaultCreatorComponent 
                  sdk={sdk}
                  onVaultCreated={handleVaultCreated}
                />
              </div>
            ) : (
              <div>
                <h2 style={{ color: '#333', marginBottom: '15px' }}>Vault Dashboard</h2>
                <BalanceDisplayComponent 
                  sdk={sdk}
                  vault={vault}
                />
                
                <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button 
                    onClick={handleSignTransaction}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Sign Transaction
                  </button>
                  
                  <button 
                    onClick={handleSignMessage}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Sign Message
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <ConsoleLogger logs={logs} />
      </div>
    </div>
  )
}

export default App