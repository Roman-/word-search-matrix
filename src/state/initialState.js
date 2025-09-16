import {
  DEFAULT_DIMENSIONS,
  DEFAULT_ENCODING,
  createDefaultSeparatorState,
  createDefaultStyleState,
} from '../constants/settings'
import { getDefaultWordsForLanguage } from '../utils/words'

export const createGenerationState = (language, overrides = {}) => {
  const width = overrides.width ?? DEFAULT_DIMENSIONS.width
  const height = overrides.height ?? DEFAULT_DIMENSIONS.height
  const baseWords =
    typeof overrides.words === 'string'
      ? overrides.words
      : getDefaultWordsForLanguage(language, width, height)

  return {
    words: baseWords,
    letters: overrides.letters ?? '',
    width,
    height,
    encoding: overrides.encoding ?? DEFAULT_ENCODING,
  }
}

export const createAppState = (language) => ({
  language,
  generation: createGenerationState(language),
  style: createDefaultStyleState(),
  separators: createDefaultSeparatorState(),
})
