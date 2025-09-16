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

export default downloadCanvasImage
