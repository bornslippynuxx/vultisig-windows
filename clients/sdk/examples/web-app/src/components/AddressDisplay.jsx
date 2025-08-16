import React, { useState, useEffect } from 'react'

function AddressDisplay({ sdk, vault, chains, setStatus }) {
  const [addresses, setAddresses] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (sdk && vault && chains) {
      deriveAddresses()
    }
  }, [sdk, vault, chains])

  const deriveAddresses = async () => {
    setLoading(true)
    console.log('Starting address derivation for chains', { chains: chains.length })

    try {
      console.log('Deriving addresses using Trust Wallet Core...')
      const startTime = Date.now()
      const addressMap = await sdk.deriveAddresses(vault, chains)
      const derivationTime = Date.now() - startTime
      
      console.log(`✅ Address derivation completed in ${derivationTime}ms`)
      console.log('Generated addresses:', Object.keys(addressMap))
      
      setAddresses(addressMap)
      setStatus(`Addresses generated in ${derivationTime}ms`)
      
    } catch (error) {
      console.error('❌ Address derivation failed:', error)
      setStatus(`Address derivation failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const vaultInfo = vault?.getInfo()

  return (
    <div className="container">
      <h2>Your Blockchain Addresses</h2>
      
      {loading ? (
        <p>Generating addresses...</p>
      ) : (
        <div className="addresses">
          {Object.entries(addresses).map(([chainName, address]) => (
            <div key={chainName} className="address-item">
              <span className="chain">{chainName}:</span>{' '}
              <code>{address}</code>
            </div>
          ))}
        </div>
      )}
      
      {vaultInfo && (
        <div className="container">
          <h3>Vault Info</h3>
          <p><strong>Vault ID:</strong> {vaultInfo.id}</p>
          <p><strong>Name:</strong> {vaultInfo.name}</p>
          <p><strong>ECDSA Key:</strong> {vaultInfo.hasEcdsaKey ? '✅' : '❌'}</p>
          <p><strong>EdDSA Key:</strong> {vaultInfo.hasEddsaKey ? '✅' : '❌'}</p>
        </div>
      )}
    </div>
  )
}

export default AddressDisplay