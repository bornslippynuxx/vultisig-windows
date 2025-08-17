import { useState, useEffect } from 'react'
import { VultisigSDK, Vault, CoinBalance } from '@vultisig/sdk'

interface BalanceDisplayProps {
  sdk: VultisigSDK
  vault: Vault
}

function BalanceDisplay({ sdk, vault }: BalanceDisplayProps) {
  const [balances, setBalances] = useState<Record<string, CoinBalance> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadBalances = async () => {
    setLoading(true)
    setError(null)
    try {
      const vaultBalances = await sdk.getBalances(vault)
      setBalances(vaultBalances)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBalances()
  }, [vault])

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{
          width: '20px',
          height: '20px',
          border: '2px solid #f3f3f3',
          borderTop: '2px solid #007bff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 10px'
        }} />
        <p>Loading balances...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <p style={{ color: 'red' }}>Error loading balances: {error}</p>
        <button 
          onClick={loadBalances}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0, color: '#333' }}>Vault: {vault.name}</h3>
        <button 
          onClick={loadBalances}
          style={{
            padding: '6px 12px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Refresh
        </button>
      </div>
      
      {balances && Object.keys(balances).length > 0 ? (
        <div style={{ display: 'grid', gap: '10px' }}>
          {Object.entries(balances).map(([coinId, balance]) => (
            <div 
              key={coinId}
              style={{
                padding: '12px',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                border: '1px solid #dee2e6',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontWeight: '500', color: '#333' }}>{coinId}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Balance</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: '500', color: '#333' }}>{balance.amount}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Decimals: {balance.decimals}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          color: '#666',
          backgroundColor: '#f8f9fa',
          borderRadius: '6px',
          border: '1px solid #dee2e6'
        }}>
          <p>No balances found</p>
          <p style={{ fontSize: '14px' }}>This vault doesn't have any coins yet.</p>
        </div>
      )}
    </div>
  )
}

export default BalanceDisplay