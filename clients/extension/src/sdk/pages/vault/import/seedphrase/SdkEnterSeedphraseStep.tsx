import { EnterSeedphraseHeader } from '@core/ui/vault/import/seedphrase/EnterSeedphraseHeader'
import { seedphraseWordCounts } from '@core/ui/vault/import/seedphrase/config'
import { Button } from '@lib/ui/buttons/Button'
import { getFormProps } from '@lib/ui/form/utils/getFormProps'
import { TextArea } from '@lib/ui/inputs/TextArea'
import { VStack } from '@lib/ui/layout/Stack'
import { Text } from '@lib/ui/text'
import type { SeedphraseValidation } from '@vultisig/sdk'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useVultisigSdk } from '../../../../VultisigSdkProvider'

const cleanMnemonic = (text: string) =>
  text.split(/\s+/).filter(Boolean).join(' ')

type Props = {
  mnemonic: string
  onMnemonicChange: (mnemonic: string) => void
  onSubmit: (cleanedMnemonic: string) => void
}

export const SdkEnterSeedphraseStep = ({
  mnemonic,
  onMnemonicChange,
  onSubmit,
}: Props) => {
  const { t } = useTranslation()
  const sdk = useVultisigSdk()
  const [validation, setValidation] = useState<SeedphraseValidation | null>(
    null
  )

  const cleaned = cleanMnemonic(mnemonic)

  // Validate via SDK when the cleaned mnemonic changes
  useEffect(() => {
    if (cleaned === '') {
      setValidation(null)
      return
    }

    let cancelled = false
    sdk.validateSeedphrase(cleaned).then(result => {
      if (!cancelled) setValidation(result)
    })
    return () => {
      cancelled = true
    }
  }, [cleaned, sdk])

  const error =
    validation && !validation.valid
      ? validation.invalidWords?.length
        ? t('seedphrase_invalid_error')
        : validation.error || t('seedphrase_invalid_error')
      : null

  const isValid = cleaned !== '' && validation?.valid === true

  const words = cleaned.split(' ')
  const wordsCount = cleaned === '' ? 0 : words.length
  const [minWordCount, maxWordCount] = seedphraseWordCounts
  const maxWords = wordsCount > minWordCount ? maxWordCount : minWordCount
  const accessory = `${wordsCount}/${maxWords}`

  return (
    <VStack
      as="form"
      gap={32}
      flexGrow
      {...getFormProps({
        onSubmit: () => onSubmit(cleaned),
        isDisabled: !isValid,
      })}
    >
      <EnterSeedphraseHeader />

      <VStack gap={8}>
        <TextArea
          autoFocus
          value={mnemonic}
          onValueChange={onMnemonicChange}
          accessory={accessory}
          validation={isValid ? 'valid' : error ? 'invalid' : undefined}
          placeholder={t('mnemonic_placeholder')}
        />

        {error && (
          <Text size={13} color="danger">
            {error}
          </Text>
        )}
      </VStack>

      <VStack flexGrow justifyContent="flex-end" fullWidth>
        <Button type="submit" disabled={!isValid}>
          {t('import')}
        </Button>
      </VStack>
    </VStack>
  )
}
