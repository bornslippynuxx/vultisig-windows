import React, { useState, useEffect } from 'react'
import { VultisigSDK, Chain, Vault, VaultCreation } from 'vultisig-sdk'

interface VaultCreatorProps {
  onVaultCreated?: (vault: Vault) => void
}

export const VaultCreator: React.FC<VaultCreatorProps> = ({ onVaultCreated }) => {
  const [sdk, setSdk] = useState<VultisigSDK | null>(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'form' | 'verification' | 'addresses'>('form')
  const [vaultCreation, setVaultCreation] = useState<VaultCreation | null>(null)
  const [vault, setVault] = useState<Vault | null>(null)
  const [addresses, setAddresses] = useState<Record<string, string>>({})
  const [error, setError] = useState<string>('')

  // Form state
  const [vaultName, setVaultName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [verificationCode, setVerificationCode] = useState('')

  // Initialize SDK on mount
  useEffect(() => {
    const initSDK = async () => {
      try {
        const sdkInstance = await VultisigSDK.initialize()
        setSdk(sdkInstance)
      } catch (err) {
        setError(`Failed to initialize SDK: ${err.message}`)
      }
    }
    initSDK()
  }, [])

  const handleCreateVault = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sdk) return

    setLoading(true)
    setError('')

    try {
      const creation = await sdk.createFastVault({
        name: vaultName,
        email,
        password
      })

      setVaultCreation(creation)
      setStep('verification')
    } catch (err) {
      setError(`Vault creation failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vaultCreation) return

    setLoading(true)
    setError('')

    try {
      await vaultCreation.verifyEmail(verificationCode)
      const downloadedVault = await vaultCreation.downloadVault()
      
      setVault(downloadedVault)
      onVaultCreated?.(downloadedVault)
      
      // Generate addresses for common chains
      const commonChains = [
        Chain.Bitcoin,
        Chain.Ethereum,
        Chain.Solana,
        Chain.Avalanche,
        Chain.Polygon
      ]
      
      const derivedAddresses = await sdk!.deriveAddresses(downloadedVault, commonChains)
      setAddresses(derivedAddresses)
      setStep('addresses')
    } catch (err) {
      setError(`Verification failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (!sdk) {
    return <div>Initializing Vultisig SDK...</div>
  }

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px' }}>
      <h2>Vultisig Vault Creator</h2>

      {error && (
        <div style={{ 
          color: '#dc3545', 
          background: '#f8d7da', 
          padding: '10px', 
          borderRadius: '4px', 
          marginBottom: '20px' 
        }}>
          {error}
        </div>
      )}

      {step === 'form' && (
        <form onSubmit={handleCreateVault}>
          <div style={{ marginBottom: '15px' }}>
            <label>Vault Name:</label>
            <input
              type="text"
              value={vaultName}
              onChange={(e) => setVaultName(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Vault'}
          </button>
        </form>
      )}

      {step === 'verification' && (
        <form onSubmit={handleVerifyEmail}>
          <p>Check your email and enter the verification code:</p>
          <div style={{ marginBottom: '15px' }}>
            <label>Verification Code:</label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify & Download'}
          </button>
        </form>
      )}

      {step === 'addresses' && vault && (
        <div>
          <h3>Vault Created Successfully!</h3>
          
          <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '4px', marginBottom: '20px' }}>
            <p><strong>Vault ID:</strong> {vault.id}</p>
            <p><strong>Name:</strong> {vault.name}</p>
          </div>

          <h4>Your Addresses:</h4>
          <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '4px' }}>
            {Object.entries(addresses).map(([chain, address]) => (
              <div key={chain} style={{ marginBottom: '10px' }}>
                <strong>{chain}:</strong>
                <br />
                <code style={{ fontSize: '12px', wordBreak: 'break-all' }}>
                  {address}
                </code>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Example of using the component
export const App: React.FC = () => {
  const handleVaultCreated = (vault: Vault) => {
    console.log('Vault created:', vault.getInfo())
    // You can now use the vault for other operations
  }

  return (
    <div>
      <h1>Vultisig React Integration Example</h1>
      <VaultCreator onVaultCreated={handleVaultCreated} />
    </div>
  )
}