import { getResolvedQuery, pendingQuery, Query } from '@lib/ui/query/Query'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { useSdkVault } from '../SdkVaultProvider'

export const useVaultTotalBalanceQuery = (): Query<number> => {
  const vault = useSdkVault()

  const query = useQuery({
    queryKey: ['sdk', 'totalValue', vault?.id],
    queryFn: () => vault!.getTotalValue(),
    enabled: !!vault,
  })

  return useMemo((): Query<number> => {
    if (!vault || query.isPending) return pendingQuery

    if (query.data) {
      return getResolvedQuery(parseFloat(query.data.amount))
    }

    return {
      isPending: false,
      data: undefined,
      error: query.error ?? null,
    }
  }, [vault, query.isPending, query.data, query.error])
}
