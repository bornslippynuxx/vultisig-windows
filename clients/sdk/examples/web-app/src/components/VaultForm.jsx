import React, { useState } from 'react'

function VaultForm({ sdk, onVaultCreated, setStatus }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!sdk) {
      setStatus('SDK not initialized - cannot create vault')
      return
    }

    setLoading(true)
    console.log('Starting vault creation process', { 
      name: formData.name, 
      email: formData.email.replace(/@.*/, '@***') 
    })

    try {
      console.log('Sending vault creation request to Vultiserver...')
      
      const vaultCreation = await sdk.createFastVault(formData)
      
      console.log('✅ Vault created successfully!')
      console.log('Verification email sent to user', { 
        email: formData.email.replace(/@.*/, '@***') 
      })
      
      onVaultCreated(vaultCreation)
      setStatus('Vault created! Check your email for verification code.')
      
    } catch (error) {
      console.error('❌ Vault creation failed:', error)
      setStatus(`Vault creation failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="container">
      <h2>Create Fast Vault</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Vault Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="My Wallet"
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="user@example.com"
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="Secure password"
          />
        </div>
        <button type="submit" disabled={loading || !sdk}>
          {loading ? 'Creating...' : 'Create Vault'}
        </button>
      </form>
    </div>
  )
}

export default VaultForm