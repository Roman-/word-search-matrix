import { DARK_PALETTE } from '../constants/settings'

export const getRandomPaletteColor = () =>
  DARK_PALETTE[Math.floor(Math.random() * DARK_PALETTE.length)]

export default getRandomPaletteColor
