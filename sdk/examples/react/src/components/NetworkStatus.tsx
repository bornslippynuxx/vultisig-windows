import React, { useState, useEffect } from 'react'

const NetworkStatus: React.FC = () => {
  const [status, setStatus] = useState<'online' | 'offline'>('online')
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking')

  useEffect(() => {
    // Check online/offline status
    const updateStatus = () => {
      setStatus(navigator.onLine ? 'online' : 'offline')
    }

    updateStatus()
    window.addEventListener('online', updateStatus)
    window.addEventListener('offline', updateStatus)

    // Check server status - using router endpoint since /ping may not exist
    const checkServerStatus = async () => {
      try {
        setServerStatus('checking')
        // Try a known endpoint that should exist (router endpoint)
        const response = await fetch('https://api.vultisig.com/router/health', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          // Add timeout
          signal: AbortSignal.timeout(5000)
        })
        
        if (response.ok) {
          console.log('Server health check successful')
          setServerStatus('online')
        } else {
          console.warn(`Server responded with status: ${response.status}`)
          // If health endpoint doesn't exist, try a simple HEAD request
          try {
            const headResponse = await fetch('https://api.vultisig.com/', {
              method: 'HEAD',
              signal: AbortSignal.timeout(3000)
            })
            setServerStatus(headResponse.ok ? 'online' : 'offline')
          } catch {
            setServerStatus('offline')
          }
        }
      } catch (error) {
        console.error('Server health check failed:', error)
        // Fallback: try a simple connectivity test
        try {
          await fetch('https://api.vultisig.com/', {
            method: 'HEAD',
            signal: AbortSignal.timeout(3000)
          })
          setServerStatus('online')
          console.log('Fallback connectivity test succeeded')
        } catch (fallbackError) {
          console.error('All connectivity tests failed:', fallbackError)
          setServerStatus('offline')
        }
      }
    }

    checkServerStatus()
    const interval = setInterval(checkServerStatus, 30000) // Check every 30s

    return () => {
      window.removeEventListener('online', updateStatus)
      window.removeEventListener('offline', updateStatus)
      clearInterval(interval)
    }
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#28a745'
      case 'offline': return '#dc3545'
      case 'checking': return '#ffc107'
      default: return '#6c757d'
    }
  }

  return (
    <div style={{ 
      padding: '15px', 
      marginBottom: '20px', 
      backgroundColor: '#f8f9fa', 
      borderRadius: '6px',
      fontSize: '14px',
      border: '1px solid #e9ecef'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '10px',
            height: '10px',
            backgroundColor: getStatusColor(status),
            borderRadius: '50%',
            boxShadow: `0 0 8px ${getStatusColor(status)}40`
          }} />
          <span style={{ fontWeight: '500' }}>Network: </span>
          <span style={{ color: getStatusColor(status), textTransform: 'capitalize' }}>{status}</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '10px',
            height: '10px',
            backgroundColor: getStatusColor(serverStatus),
            borderRadius: '50%',
            boxShadow: `0 0 8px ${getStatusColor(serverStatus)}40`,
            animation: serverStatus === 'checking' ? 'pulse 1.5s infinite' : 'none'
          }} />
          <span style={{ fontWeight: '500' }}>VultiSig API: </span>
          <span style={{ color: getStatusColor(serverStatus), textTransform: 'capitalize' }}>
            {serverStatus === 'checking' ? 'checking...' : serverStatus}
          </span>
        </div>
        
        {serverStatus === 'online' && (
          <div style={{
            fontSize: '12px',
            color: '#28a745',
            backgroundColor: '#d4edda',
            padding: '4px 8px',
            borderRadius: '12px',
            fontWeight: '500'
          }}>
            ✓ Connected
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export default NetworkStatus