import { AddressBookItem } from '@core/ui/address-book/model'
import { ChainEntityIcon } from '@core/ui/chain/coin/icon/ChainEntityIcon'
import { getChainLogoSrc } from '@core/ui/chain/metadata/getChainLogoSrc'
import { PageHeaderBackButton } from '@core/ui/flow/PageHeaderBackButton'
import { useCoreNavigate } from '@core/ui/navigation/hooks/useCoreNavigate'
import {
  useAddressBookItems,
  useDeleteAddressBookItemMutation,
  useUpdateAddressBookItemMutation,
} from '@core/ui/storage/addressBook'
import { Button } from '@lib/ui/buttons/Button'
import { IconButton } from '@lib/ui/buttons/IconButton'
import { borderRadius } from '@lib/ui/css/borderRadius'
import { DnDList } from '@lib/ui/dnd/DnDList'
import { GripVerticalIcon } from '@lib/ui/icons/GripVerticalIcon'
import { IconWrapper } from '@lib/ui/icons/IconWrapper'
import { PencilIcon } from '@lib/ui/icons/PenciIcon'
import { TrashIcon2 } from '@lib/ui/icons/TrashIcon2'
import { HStack, VStack } from '@lib/ui/layout/Stack'
import { List } from '@lib/ui/list'
import { ListItem } from '@lib/ui/list/item'
import {
  DnDItemContainer,
  DnDItemHighlight,
} from '@lib/ui/list/item/DnDItemContainer'
import { PageContent } from '@lib/ui/page/PageContent'
import { PageFooter } from '@lib/ui/page/PageFooter'
import { PageHeader } from '@lib/ui/page/PageHeader'
import { Text } from '@lib/ui/text'
import { getColor } from '@lib/ui/theme/getters'
import { MiddleTruncate } from '@lib/ui/truncate'
import { sortEntitiesWithOrder } from '@lib/utils/entities/EntityWithOrder'
import { getNewOrder } from '@lib/utils/order/getNewOrder'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled, { useTheme } from 'styled-components'

import { useVultisigSdk } from '../../VultisigSdkProvider'

const StyledListItem = styled(ListItem)`
  background-color: transparent;
  border: 1px solid ${getColor('foregroundExtra')};
  ${borderRadius.m};
  padding: 16px 20px;
  max-height: 68px;
`

const AddressBookEditList = styled(List)`
  background: none;
`

export const SdkAddressBookPage = () => {
  const { t } = useTranslation()
  const { mutate: updateItem } = useUpdateAddressBookItemMutation()
  const { mutate: deleteFromStorage } = useDeleteAddressBookItemMutation()
  const [items, setItems] = useState<AddressBookItem[]>([])
  const [isEditMode, setIsEditMode] = useState(false)
  const addressBookItems = useAddressBookItems()
  const navigate = useCoreNavigate()
  const sdk = useVultisigSdk()
  const { colors } = useTheme()

  useEffect(() => setItems(addressBookItems), [addressBookItems])

  const handleDelete = async (item: AddressBookItem) => {
    // SDK delete first (fire-and-forget — don't block UI on SDK)
    sdk
      .removeAddressBookEntry([{ chain: item.chain, address: item.address }])
      .catch(() => {
        // SDK delete failed — extension storage is still the primary
      })

    // Extension storage delete
    deleteFromStorage(item.id)
  }

  const renderListItem = (item: AddressBookItem, isEdit: boolean) => {
    const { address, chain, id, title } = item
    const icon = (
      <ChainEntityIcon
        value={getChainLogoSrc(chain)}
        style={{ fontSize: 32 }}
      />
    )

    if (isEdit) {
      return (
        <HStack alignItems="center" gap={5}>
          <IconWrapper size={23} color="textShy">
            <GripVerticalIcon />
          </IconWrapper>
          <StyledListItem
            style={{
              flex: 1,
              background: colors.foreground.toCssValue(),
            }}
            description={<MiddleTruncate text={address} width={200} />}
            extra={
              <IconButton
                style={{ color: colors.textShy.toCssValue() }}
                onClick={() => handleDelete(item)}
              >
                <TrashIcon2 />
              </IconButton>
            }
            icon={icon}
            key={id}
            title={title}
            hoverable
          />
        </HStack>
      )
    }

    return (
      <StyledListItem
        description={<MiddleTruncate text={address} width={200} />}
        icon={icon}
        key={id}
        onClick={() =>
          navigate({ id: 'updateAddressBookItem', state: { id } })
        }
        title={title}
        hoverable
      />
    )
  }

  if (!addressBookItems.length) {
    return (
      <VStack fullHeight>
        <PageHeader
          primaryControls={<PageHeaderBackButton />}
          title={t('address_book')}
          hasBorder
        />
        <PageContent
          style={{ maxWidth: 265, marginInline: 'auto' }}
          gap={12}
          alignItems="center"
          justifyContent="center"
          flexGrow
        >
          <Text centerHorizontally color="contrast" size={16} weight={500}>
            {t('vault_settings_address_book_no_addresses_title')}
          </Text>
          <Text centerHorizontally color="shy" size={14} weight={500}>
            {t('vault_settings_address_book_no_addresses_description')}
          </Text>
          <Button
            style={{ alignSelf: 'center', width: 151, fontSize: 14 }}
            onClick={() => navigate({ id: 'createAddressBookItem' })}
          >
            {t('add_address')}
          </Button>
        </PageContent>
      </VStack>
    )
  }

  return (
    <VStack fullHeight>
      <PageHeader
        primaryControls={
          <PageHeaderBackButton
            onClick={isEditMode ? () => setIsEditMode(false) : undefined}
          />
        }
        secondaryControls={
          !isEditMode && (
            <IconButton onClick={() => setIsEditMode(true)}>
              <PencilIcon />
            </IconButton>
          )
        }
        title={t('address_book')}
        hasBorder
      />
      <PageContent flexGrow scrollable>
        {isEditMode ? (
          <DnDList
            items={items}
            getItemId={item => item.id}
            onChange={(id, { index }) => {
              const order = getNewOrder({
                orders: items.map(item => item.order),
                sourceIndex: items.findIndex(item => item.id === id),
                destinationIndex: index,
              })

              updateItem({ id, fields: { order } })

              setItems(prevItems =>
                sortEntitiesWithOrder(
                  prevItems.map(item =>
                    item.id === id ? { ...item, order } : item
                  )
                )
              )
            }}
            renderList={({ props: { children } }) => (
              <AddressBookEditList>{children}</AddressBookEditList>
            )}
            renderItem={({ item, draggableProps, dragHandleProps, status }) => (
              <DnDItemContainer
                {...draggableProps}
                {...dragHandleProps}
                status={status}
              >
                {renderListItem(item, true)}
                {status === 'overlay' && <DnDItemHighlight />}
              </DnDItemContainer>
            )}
          />
        ) : (
          <List>
            {items.map(item => renderListItem(item, false))}
          </List>
        )}
      </PageContent>
      {!isEditMode && (
        <PageFooter>
          <Button onClick={() => navigate({ id: 'createAddressBookItem' })}>
            {t('add_address')}
          </Button>
        </PageFooter>
      )}
    </VStack>
  )
}
