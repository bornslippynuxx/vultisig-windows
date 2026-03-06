import {
  AddressBookForm,
  AddressBookFormValues,
} from '@core/ui/address-book/form'
import { useCoreViewState } from '@core/ui/navigation/hooks/useCoreViewState'
import { useCore } from '@core/ui/state/core'
import {
  useAddressBookItems,
  useUpdateAddressBookItemMutation,
} from '@core/ui/storage/addressBook'
import { useMutation } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { useVultisigSdk } from '../../VultisigSdkProvider'

export const SdkUpdateAddressBookItemPage = () => {
  const { t } = useTranslation()
  const [{ id }] = useCoreViewState<'updateAddressBookItem'>()
  const { mutateAsync: updateInStorage } = useUpdateAddressBookItemMutation()
  const addressBookItems = useAddressBookItems()
  const { goBack } = useCore()
  const sdk = useVultisigSdk()

  const addressBookItem = useMemo(
    () => addressBookItems.find(item => item.id === id),
    [addressBookItems, id]
  )

  const dualWriteMutation = useMutation({
    mutationFn: async (values: AddressBookFormValues) => {
      const { address, chain, title } = values

      if (!addressBookItem) throw new Error('Address book item not found')

      const oldChain = addressBookItem.chain
      const oldAddress = addressBookItem.address

      // If chain/address changed, SDK needs remove + add (keyed by chain+address)
      if (oldChain !== chain || oldAddress !== address) {
        await sdk.removeAddressBookEntry([
          { chain: oldChain, address: oldAddress },
        ])
        await sdk.addAddressBookEntry([
          {
            chain,
            address,
            name: title,
            source: 'saved',
            dateAdded: Date.now(),
          },
        ])
      } else {
        // Only name changed
        await sdk.updateAddressBookEntry(chain, address, title)
      }

      // Extension storage write
      await updateInStorage({ id, fields: { address, chain, title } })
    },
    onSuccess: goBack,
  })

  return (
    <AddressBookForm
      defaultValues={addressBookItem}
      error={dualWriteMutation.error}
      isPending={dualWriteMutation.isPending}
      onSubmit={values => dualWriteMutation.mutate(values)}
      title={t('edit_address')}
    />
  )
}
