import { IconButton } from '@lib/ui/buttons/IconButton'
import { IconWrapper } from '@lib/ui/icons/IconWrapper'
import { RefreshCwIcon } from '@lib/ui/icons/RefreshCwIcon'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useSdkVault } from '../../../../SdkVaultProvider'

export const RefreshVaultBalance = () => {
  const queryClient = useQueryClient()
  const vault = useSdkVault()

  const { mutate: refresh, isPending } = useMutation({
    mutationFn: async () => {
      if (vault) {
        await vault.updateTotalValue()
      }
      await queryClient.invalidateQueries({
        queryKey: ['sdk'],
      })
    },
  })

  return (
    <IconButton loading={isPending} onClick={() => refresh()}>
      <IconWrapper size={24}>
        <RefreshCwIcon />
      </IconWrapper>
    </IconButton>
  )
}
