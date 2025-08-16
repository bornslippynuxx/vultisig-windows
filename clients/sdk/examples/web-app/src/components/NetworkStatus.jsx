import React from 'react'

function NetworkStatus({ status }) {
  const getClassName = () => {
    if (status.online === null) return 'network-status network-checking'
    return status.online ? 'network-status network-online' : 'network-status network-offline'
  }

  return (
    <div className={getClassName()}>
      {status.message}
    </div>
  )
}

export default NetworkStatus