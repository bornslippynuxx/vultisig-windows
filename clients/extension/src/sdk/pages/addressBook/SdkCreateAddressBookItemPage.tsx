import {
  AddressBookForm,
  AddressBookFormValues,
} from '@core/ui/address-book/form'
import { useCore } from '@core/ui/state/core'
import {
  useAddressBookItemOrders,
  useCreateAddressBookItemMutation,
} from '@core/ui/storage/addressBook'
import { useNavigation } from '@lib/ui/navigation/state'
import { getLastItemOrder } from '@lib/utils/order/getLastItemOrder'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { v4 as uuidv4 } from 'uuid'

import { useVultisigSdk } from '../../VultisigSdkProvider'

export const SdkCreateAddressBookItemPage = () => {
  const [{ history }] = useNavigation()
  const currentView = history[history.length - 1]
  const state =
    currentView?.id === 'createAddressBookItem' ? currentView.state : undefined
  const { t } = useTranslation()
  const { mutateAsync: createInStorage } = useCreateAddressBookItemMutation()
  const addressBookItemOrders = useAddressBookItemOrders()
  const { goBack, goHome } = useCore()
  const sdk = useVultisigSdk()

  const cameFromKeysign = !!(state?.address && state?.chain)

  const dualWriteMutation = useMutation({
    mutationFn: async (values: AddressBookFormValues) => {
      const { address, chain, title } = values

      // SDK write first
      await sdk.addAddressBookEntry([
        {
          chain,
          address,
          name: title,
          source: 'saved',
          dateAdded: Date.now(),
        },
      ])

      // Extension storage write
      await createInStorage({
        address,
        chain,
        id: uuidv4(),
        order: getLastItemOrder(addressBookItemOrders),
        title,
      })
    },
    onSuccess: () => {
      if (cameFromKeysign) {
        goHome()
      } else {
        goBack()
      }
    },
  })

  return (
    <AddressBookForm
      defaultValues={{
        address: state?.address ?? '',
        chain: state?.chain,
        title: '',
      }}
      onBack={cameFromKeysign ? goHome : undefined}
      error={dualWriteMutation.error}
      isPending={dualWriteMutation.isPending}
      onSubmit={values => dualWriteMutation.mutate(values)}
      title={t('add_address')}
    />
  )
}
