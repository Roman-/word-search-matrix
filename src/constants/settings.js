export const APP_NAME = 'Word Search Matrix'
export const LANGUAGE_STORAGE_KEY = 'word-search-language'

export const FONTS = ['Roboto', 'Open Sans', 'Lato', 'Poppins', 'Montserrat']

export const DARK_PALETTE = [
  '#1f2937',
  '#1e40af',
  '#5b21b6',
  '#065f46',
  '#7c2d12',
  '#9d174d',
]

export const DEFAULT_DIMENSIONS = {
  width: 6,
  height: 6,
}

export const DEFAULT_ENCODING = 'free'
export const DEFAULT_CELL_SIZE = 90
export const DEFAULT_MARGIN = 0
export const DEFAULT_SOLID_COLOR = '#000000'

export const DEFAULT_GRADIENT_COLORS = {
  tl: '#ff0000',
  tr: '#00ff00',
  bl: '#0000ff',
  br: '#890A6E',
}

export const createDefaultStyleState = () => ({
  cellSize: DEFAULT_CELL_SIZE,
  margin: DEFAULT_MARGIN,
  font: FONTS[0],
  bold: true,
  colorMode: 'gradient',
  solidColor: DEFAULT_SOLID_COLOR,
  gradientColors: { ...DEFAULT_GRADIENT_COLORS },
})

export const createDefaultSeparatorState = () => ({
  showSeparators: true,
  showBorder: false,
  lineThickness: 1,
  separatorColor: '#808080',
  separatorStyle: 'solid',
})
