import tinycolor from 'tinycolor2'
import { ensureFontLoaded } from './font'

const getDashPattern = (style, lineThickness) => {
  const normalized = Math.max(1, lineThickness)
  const dashMap = {
    solid: [],
    dashed: [normalized * 2, normalized * 2],
    dotted: [normalized, normalized],
  }
  return dashMap[style] ?? []
}

export const renderGridToCanvas = async ({
  canvas,
  grid,
  words,
  style,
  separators,
  paletteColorProvider,
}) => {
  if (!canvas || !Array.isArray(grid) || grid.length === 0) {
    return null
  }

  const {
    cellSize,
    margin,
    font,
    bold,
    colorMode,
    solidColor,
    gradientColors,
  } = style
  const { showSeparators, showBorder, lineThickness, separatorColor, separatorStyle } =
    separators

  const rows = grid.length
  const cols = grid[0]?.length ?? 0
  if (rows === 0 || cols === 0) {
    return null
  }

  const cell = Number(cellSize) || 40
  const m = Number(margin) || 0

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return null
  }

  const fontSpec = `${bold ? 'bold ' : ''}${Math.floor(cell * 0.6)}px "${font}"`
  await ensureFontLoaded(fontSpec)

  canvas.width = cols * cell + m * 2
  canvas.height = rows * cell + m * 2

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = fontSpec

  const paletteProvider =
    typeof paletteColorProvider === 'function' ? paletteColorProvider : () => solidColor

  const getGradientColor = (i, j) => {
    if (!gradientColors) {
      return solidColor
    }
    const xRatio = cols <= 1 ? 0 : j / (cols - 1)
    const yRatio = rows <= 1 ? 0 : i / (rows - 1)
    const top = tinycolor.mix(gradientColors.tl, gradientColors.tr, xRatio * 100)
    const bottom = tinycolor.mix(gradientColors.bl, gradientColors.br, xRatio * 100)
    return tinycolor.mix(top, bottom, yRatio * 100).toHexString()
  }

  for (let i = 0; i < rows; i += 1) {
    for (let j = 0; j < cols; j += 1) {
      const x = m + j * cell + cell / 2
      const y = m + i * cell + cell / 2
      let fillStyle = solidColor
      if (colorMode === 'gradient') {
        fillStyle = getGradientColor(i, j)
      } else if (colorMode === 'random') {
        fillStyle = paletteProvider()
      }
      ctx.fillStyle = fillStyle
      ctx.fillText(grid[i][j], x, y)
    }
  }

  if (showSeparators || showBorder) {
    ctx.save()
    ctx.strokeStyle = separatorColor
    ctx.lineWidth = lineThickness
    ctx.setLineDash(getDashPattern(separatorStyle, lineThickness))

    if (showSeparators) {
      for (let i = 1; i < cols; i += 1) {
        const x = m + i * cell
        ctx.beginPath()
        ctx.moveTo(x, m)
        ctx.lineTo(x, m + rows * cell)
        ctx.stroke()
      }
      for (let i = 1; i < rows; i += 1) {
        const y = m + i * cell
        ctx.beginPath()
        ctx.moveTo(m, y)
        ctx.lineTo(m + cols * cell, y)
        ctx.stroke()
      }
    }

    if (showBorder) {
      ctx.strokeRect(m, m, cols * cell, rows * cell)
    }

    ctx.restore()
  }

  const firstWord = words?.trim().split(/\s+/)[0] || 'image'
  const baseFile = `${firstWord}_${canvas.width}x${canvas.height}px`
  const fileName = `${baseFile}.png`
  const dataUrl = canvas.toDataURL('image/png')
  const byteLength = Math.round((dataUrl.length - 'data:image/png;base64,'.length) * 0.75)
  const size = `${(byteLength / 1024).toFixed(2)} KB`

  return { name: fileName, size }
}

export default renderGridToCanvas
