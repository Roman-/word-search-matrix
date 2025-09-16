import { WORD_SETS, WORDS_PER_FILL } from '../data/wordSets'
import { DEFAULT_DIMENSIONS } from '../constants/settings'
import { getRandomUniqueItems } from './random'

export const filterWordsByDimensions = (wordList, maxWidth, maxHeight) =>
  wordList.filter((word) => word.length <= maxWidth && word.length <= maxHeight)

export const pickRandomWordsForLanguage = (
  language,
  width = DEFAULT_DIMENSIONS.width,
  height = DEFAULT_DIMENSIONS.height
) => {
  const availableWords = WORD_SETS[language] ?? []
  const filteredWords = filterWordsByDimensions(availableWords, width, height)
  return getRandomUniqueItems(filteredWords, WORDS_PER_FILL)
}

export const getDefaultWordsForLanguage = (
  language,
  width = DEFAULT_DIMENSIONS.width,
  height = DEFAULT_DIMENSIONS.height
) => {
  const randomWords = pickRandomWordsForLanguage(language, width, height)
  return randomWords.length ? randomWords.join(' ') : ''
}
