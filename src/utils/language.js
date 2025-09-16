import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '../data/languages'
import { LANGUAGE_STORAGE_KEY } from '../constants/settings'

export const resolveInitialLanguage = () => {
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE
  }
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
    return SUPPORTED_LANGUAGES.some((option) => option.code === stored)
      ? stored
      : DEFAULT_LANGUAGE
  } catch {
    return DEFAULT_LANGUAGE
  }
}

export default resolveInitialLanguage
