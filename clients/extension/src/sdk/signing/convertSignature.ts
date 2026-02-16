import { encodeDERSignature } from '@core/mpc/derSignature'
import type { KeysignSignature } from '@core/mpc/keysign/KeysignSignature'
import type { Signature } from '@vultisig/sdk'

/**
 * Parse DER-encoded ECDSA signature to extract r and s components.
 * DER format: 30 <total_len> 02 <r_len> <r_bytes> 02 <s_len> <s_bytes>
 */
function parseDerSignature(derHex: string): { r: string; s: string } {
  const hex = derHex.startsWith('0x') ? derHex.slice(2) : derHex
  const bytes = Buffer.from(hex, 'hex')

  let offset = 0
  if (bytes[offset++] !== 0x30) throw new Error('Invalid DER: expected 0x30')
  offset++ // skip total length

  if (bytes[offset++] !== 0x02) throw new Error('Invalid DER: expected 0x02 for r')
  const rLen = bytes[offset++]
  const rBytes = bytes.subarray(offset, offset + rLen)
  offset += rLen

  if (bytes[offset++] !== 0x02) throw new Error('Invalid DER: expected 0x02 for s')
  const sLen = bytes[offset++]
  const sBytes = bytes.subarray(offset, offset + sLen)

  const stripLeadingZeros = (buf: Uint8Array): string => {
    let start = 0
    while (start < buf.length - 1 && buf[start] === 0) start++
    return Buffer.from(buf.subarray(start)).toString('hex')
  }

  return {
    r: stripLeadingZeros(rBytes),
    s: stripLeadingZeros(sBytes),
  }
}

/**
 * Convert an SDK Signature to extension KeysignSignature format.
 *
 * The extension's signing pipeline (compileTx → generateSignature) uses
 * different fields depending on the chain's signature format:
 * - rawWithRecoveryId (EVM): uses r, s, recovery_id
 * - raw (EdDSA chains like Solana): uses r, s
 * - der (UTXO): uses der_signature
 *
 * @param sdkSig - Signature from vault.signBytes()
 * @param msgHex - The original message hash (hex-encoded) that was signed
 * @returns KeysignSignature compatible with the extension's signing flow
 */
export function toKeysignSignature(
  sdkSig: Signature,
  msgHex: string
): KeysignSignature {
  // msg field must be base64-encoded (downstream converts base64→hex to index)
  const msg = Buffer.from(msgHex, 'hex').toString('base64')

  if (sdkSig.format === 'EdDSA' || sdkSig.format === 'Ed25519') {
    // EdDSA: signature is r||s concatenated hex (reversed endianness, 64 hex chars each)
    const sigHex = sdkSig.signature.startsWith('0x')
      ? sdkSig.signature.slice(2)
      : sdkSig.signature
    const r = sigHex.slice(0, 64)
    const s = sigHex.slice(64)

    // Compute DER from raw (un-reversed) bytes
    const rawR = Buffer.from(r, 'hex').reverse()
    const rawS = Buffer.from(s, 'hex').reverse()
    const der = encodeDERSignature(
      new Uint8Array(rawR),
      new Uint8Array(rawS)
    )

    return {
      msg,
      r,
      s,
      der_signature: Buffer.from(der).toString('hex'),
    }
  }

  // ECDSA: parse r, s from DER signature
  const { r, s } = parseDerSignature(sdkSig.signature)

  return {
    msg,
    r,
    s,
    der_signature: sdkSig.signature,
    recovery_id:
      sdkSig.recovery != null
        ? sdkSig.recovery.toString(16).padStart(2, '0')
        : undefined,
  }
}
