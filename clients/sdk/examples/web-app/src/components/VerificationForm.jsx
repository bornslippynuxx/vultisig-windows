import React, { useState } from 'react'

function VerificationForm({ vaultCreation, onVaultVerified, setStatus }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!vaultCreation) {
      setStatus('No vault creation in progress')
      return
    }

    setLoading(true)
    console.log('Starting email verification process')

    try {
      console.log('Sending verification request to Vultiserver...')
      
      await vaultCreation.verifyEmail(code)
      console.log('✅ Email verification successful!')

      console.log('Downloading vault data from server...')
      const vault = await vaultCreation.downloadVault()
      console.log('✅ Vault downloaded successfully!')
      console.log('Vault info:', vault.getInfo())

      onVaultVerified(vault)
      setStatus('Vault verified and downloaded successfully!')
      
    } catch (error) {
      console.error('❌ Email verification or vault download failed:', error)
      setStatus(`Verification failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <h2>Email Verification</h2>
      <p>Please check your email and enter the verification code:</p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="verification-code">Verification Code:</label>
          <input
            type="text"
            id="verification-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            placeholder="123456"
          />
        </div>
        <button type="submit" disabled={loading || !code}>
          {loading ? 'Verifying...' : 'Verify & Download Vault'}
        </button>
      </form>
    </div>
  )
}

export default VerificationForm