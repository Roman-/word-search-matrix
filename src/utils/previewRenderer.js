import tinycolor from 'tinycolor2'

const DOT_CHARACTER = '•'
const HINT_LINES = ['Press', 'GENERATE', 'to create grid']

const getDashPattern = (style, lineThickness) => {
  const normalized = Math.max(1, lineThickness)
  const dashMap = {
    solid: [],
    dashed: [normalized * 2, normalized * 2],
    dotted: [normalized, normalized],
  }
  return dashMap[style] ?? []
}

const ensureFontLoaded = async (fontSpec) => {
  if (typeof document === 'undefined' || !document.fonts?.load) {
    return
  }
  try {
    await document.fonts.load(fontSpec)
  } catch {
    /* ignore font loading issues */
  }
}

export const drawPreview = async ({
  canvas,
  width,
  height,
  cellSize,
  margin,
  font,
  bold,
  colorMode,
  solidColor,
  gradientColors,
  showSeparators,
  showBorder,
  lineThickness,
  separatorColor,
  separatorStyle,
  paletteColorProvider,
}) => {
  if (!canvas) {
    return
  }

  const rows = Math.max(0, height)
  const cols = Math.max(0, width)
  const cell = parseInt(cellSize, 10) || 40
  const m = parseInt(margin, 10) || 0

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return
  }

  const previewWidth = cols * cell + m * 2
  const previewHeight = rows * cell + m * 2

  canvas.width = previewWidth
  canvas.height = previewHeight
  ctx.clearRect(0, 0, previewWidth, previewHeight)

  const letterFontSpec = `${bold ? 'bold ' : ''}${Math.floor(cell * 0.6)}px "${font}"`
  await ensureFontLoaded(letterFontSpec)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = letterFontSpec

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
      } else if (colorMode === 'random' && typeof paletteColorProvider === 'function') {
        fillStyle = paletteColorProvider()
      }
      ctx.fillStyle = fillStyle
      ctx.fillText(DOT_CHARACTER, x, y)
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

  const widthBasedSize = previewWidth > 0 ? previewWidth * 0.1 : 0
  const hintFontSize = Math.max(16, Math.min(widthBasedSize, 64))
  const hintFontWeight = bold ? '600 ' : ''
  const hintFontSpec = `${hintFontWeight}${Math.round(hintFontSize)}px "${font}"`
  await ensureFontLoaded(hintFontSpec)

  ctx.save()
  ctx.font = hintFontSpec
  ctx.fillStyle = 'rgba(55, 65, 81, 0.85)'
  ctx.shadowColor = 'rgba(255, 255, 255, 0.8)'
  ctx.shadowBlur = Math.max(4, hintFontSize / 6)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const lineHeight = hintFontSize * 1.1
  const totalHeight = lineHeight * HINT_LINES.length
  const startY = previewHeight / 2 - totalHeight / 2 + lineHeight / 2
  HINT_LINES.forEach((line, index) => {
    const y = startY + index * lineHeight
    ctx.fillText(line, previewWidth / 2, y)
  })
  ctx.restore()
}

export default drawPreview
