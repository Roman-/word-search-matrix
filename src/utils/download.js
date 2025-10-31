export const downloadCanvasImage = (canvas, words, format = 'png') => {
  if (!canvas) {
    return
  }

  const firstWord = words?.trim().split(/\s+/)[0] || 'image'
  const baseFile = `${firstWord}_${canvas.width}x${canvas.height}px`
  const link = document.createElement('a')

  if (format === 'jpeg') {
    const tmp = document.createElement('canvas')
    tmp.width = canvas.width
    tmp.height = canvas.height
    const ctx = tmp.getContext('2d')
    if (!ctx) {
      return
    }
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, tmp.width, tmp.height)
    ctx.drawImage(canvas, 0, 0)
    link.href = tmp.toDataURL('image/jpeg')
    link.download = `${baseFile}.jpeg`
  } else {
    link.href = canvas.toDataURL('image/png')
    link.download = `${baseFile}.png`
  }

  link.click()
}

export const downloadJSON = (gridData, words) => {
  if (!gridData) {
    return
  }

  const wordsArray = words?.trim().split(/\s+/).filter(Boolean) || []
  const firstWord = wordsArray[0] || 'wordsearch'
  const filename = `${firstWord}_${gridData.grid[0]?.length || 0}x${gridData.grid?.length || 0}.json`
  
  const jsonData = {
    words: wordsArray,
    grid: gridData.grid,
    placements: gridData.placements || [],
    dimensions: {
      width: gridData.grid[0]?.length || 0,
      height: gridData.grid?.length || 0
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      partial: gridData.partial || false
    }
  }

  const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

export default downloadCanvasImage
