import { useState } from 'react'
import { VultisigSDK } from '@vultisig/sdk'

function SimpleApp() {
  const [message, setMessage] = useState('VultiSig SDK - React Example')
  const [sdk] = useState(() => new VultisigSDK({ serverUrl: 'https://api.vultisig.com/router' }))
  
  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      padding: '20px',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: '20px'
      }}>
        <h1 style={{ color: '#333', marginBottom: '20px' }}>{message}</h1>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          Testing basic React functionality before SDK integration.
        </p>
        
        <button 
          onClick={() => setMessage('React is working! ✅')}
          style={{
            padding: '12px 24px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            marginRight: '10px'
          }}
        >
          Test React
        </button>
        
        <button 
          onClick={() => setMessage('SDK import commented out - testing basic functionality')}
          style={{
            padding: '12px 24px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          SDK Import Disabled
        </button>
        
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Next Steps:</h3>
          <ol style={{ margin: 0, paddingLeft: '20px', color: '#666' }}>
            <li>Test basic React functionality</li>
            <li>Add VultiSig SDK import</li>
            <li>Test SDK initialization</li>
            <li>Test vault creation</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

export default SimpleApp