import { useEffect, useState } from 'react'

/**
 * Minimal interface for anything with an `on()` subscription method.
 * Matches Vultisig (SdkEvents) and VaultBase (VaultEvents).
 */
type EventSource<Events> = {
  on<K extends keyof Events>(
    event: K,
    handler: (data: Events[K]) => void
  ): () => void
}

/**
 * Subscribe to a single event on an SDK emitter and return the latest payload.
 *
 * Returns `null` until the first event fires.
 * Automatically unsubscribes when the component unmounts or the source/event changes.
 *
 * @example
 * ```tsx
 * const sdk = useVultisigSdk()
 * const progress = useSdkEvent(sdk, 'vaultCreationProgress')
 * // progress: { vault?, step } | null
 * ```
 *
 * @example
 * ```tsx
 * const vault = useSdkVault()
 * const balance = useSdkEvent(vault, 'balanceUpdated')
 * // balance: { chain, balance, tokenId? } | null
 * ```
 */
export function useSdkEvent<
  Events extends Record<string, unknown>,
  K extends keyof Events,
>(source: EventSource<Events> | null | undefined, event: K): Events[K] | null {
  const [value, setValue] = useState<Events[K] | null>(null)

  useEffect(() => {
    if (!source) return
    setValue(null)
    return source.on(event, data => {
      setValue(data)
    })
  }, [source, event])

  return value
}

/**
 * Subscribe to a single event and invoke a callback without storing state.
 *
 * Useful for fire-and-forget side effects (logging, analytics, toast notifications).
 *
 * @example
 * ```tsx
 * const vault = useSdkVault()
 * useSdkEventCallback(vault, 'error', (err) => showToast(err.message))
 * ```
 */
export function useSdkEventCallback<
  Events extends Record<string, unknown>,
  K extends keyof Events,
>(
  source: EventSource<Events> | null | undefined,
  event: K,
  callback: (data: Events[K]) => void
): void {
  useEffect(() => {
    if (!source) return
    return source.on(event, callback)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, event])
}
