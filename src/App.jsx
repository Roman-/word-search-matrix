import { useState, useRef } from 'react'
import tinycolor from 'tinycolor2'
import generateWordSearchGrid from './utils/MultiWordMatrixGenerator.js'

const fonts = ['Roboto', 'Open Sans', 'Lato', 'Poppins', 'Montserrat']

function App() {
  const [words, setWords] = useState('WORD')
  const [letters, setLetters] = useState('')
  const [size, setSize] = useState('6x6')
  const [font, setFont] = useState(fonts[0])
  const [cellSize, setCellSize] = useState(90)
  const [margin, setMargin] = useState(10)
  const [bold, setBold] = useState(true)
  const [colorMode, setColorMode] = useState('solid')
  const [solidColor, setSolidColor] = useState('#000000')
  const [gradientColors, setGradientColors] = useState({
    tl: '#ff0000',
    tr: '#00ff00',
    bl: '#0000ff',
    br: '#890A6E',
  })
  const canvasRef = useRef(null)

  const handleGenerate = () => {
    const [wStr, hStr] = size.toLowerCase().split('x')
    const width = parseInt(wStr, 10)
    const height = parseInt(hStr ?? wStr, 10)
    if (!words || !width || !height) return

    try {
      const wordsArr = words.trim().split(/\s+/).filter(Boolean)
      const lettersArr = letters.split('').filter(Boolean)
      const { grid, partial } = generateWordSearchGrid(wordsArr, lettersArr, width, height, { maxIterations: 50000 })
      drawGrid(grid)
      if (partial) console.warn('Generation stopped early; result may be incomplete.')
    } catch (err) {
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
      console.error(err)
    }
  }

  const drawGrid = (grid) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const cell = parseInt(cellSize, 10) || 40
    const m = parseInt(margin, 10) || 0
    canvas.width = grid[0].length * cell + m * 2
    canvas.height = grid.length * cell + m * 2
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `${bold ? 'bold ' : ''}${Math.floor(cell * 0.6)}px "${font}"`

    const rows = grid.length
    const cols = grid[0].length

    const getGradientColor = (i, j) => {
      const xRatio = cols <= 1 ? 0 : j / (cols - 1)
      const yRatio = rows <= 1 ? 0 : i / (rows - 1)
      const top = tinycolor.mix(gradientColors.tl, gradientColors.tr, xRatio * 100)
      const bottom = tinycolor.mix(gradientColors.bl, gradientColors.br, xRatio * 100)
      return tinycolor.mix(top, bottom, yRatio * 100).toHexString()
    }

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const x = m + j * cell + cell / 2
        const y = m + i * cell + cell / 2
        ctx.fillStyle =
          colorMode === 'gradient'
            ? getGradientColor(i, j)
            : solidColor
        ctx.fillText(grid[i][j], x, y)
      }
    }
    console.log(grid)
    console.log(grid.join("\n"))
  }

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    const fileName = (words || 'image').replace(/\s+/g, '_')
    link.download = `${fileName}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl p-4 gap-4">
        <div className="flex flex-col gap-3">
          <input
            type="text"
            className="input input-bordered w-full"
            value={words}
            onChange={(e) => setWords(e.target.value)}
            placeholder="Words (space-separated)"
          />
          <input
            type="text"
            className="input input-bordered w-full"
            value={letters}
            onChange={(e) => setLetters(e.target.value)}
            placeholder="Possible letters (e.g. ABCD)"
          />
          <input
            type="text"
            className="input input-bordered w-full"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            placeholder="Grid size (e.g. 6x6)"
          />
          <div className="flex flex-wrap gap-2">
            <label className="flex flex-col w-24">
              <span className="label-text">Cell</span>
              <input
                type="number"
                className="input input-bordered"
                value={cellSize}
                onChange={(e) => setCellSize(e.target.value)}
              />
            </label>
            <label className="flex flex-col w-24">
              <span className="label-text">Margin</span>
              <input
                type="number"
                className="input input-bordered"
                value={margin}
                onChange={(e) => setMargin(e.target.value)}
              />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="select select-bordered"
              value={font}
              onChange={(e) => setFont(e.target.value)}
            >
              {fonts.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <label className="label cursor-pointer gap-2">
              <span className="label-text">Bold</span>
              <input
                type="checkbox"
                className="checkbox"
                checked={bold}
                onChange={(e) => setBold(e.target.checked)}
              />
            </label>
          </div>
          <div className="flex flex-col gap-2">
            <select
              className="select select-bordered"
              value={colorMode}
              onChange={(e) => setColorMode(e.target.value)}
            >
              <option value="solid">Solid Color</option>
              <option value="gradient">Gradient</option>
            </select>
            {colorMode === 'solid' && (
              <input
                type="color"
                className="w-16 h-10"
                value={solidColor}
                onChange={(e) => setSolidColor(e.target.value)}
              />
            )}
            {colorMode === 'gradient' && (
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col items-center">
                  <span className="label-text">TL</span>
                  <input
                    type="color"
                    className="w-16 h-10"
                    value={gradientColors.tl}
                    onChange={(e) =>
                      setGradientColors({ ...gradientColors, tl: e.target.value })
                    }
                  />
                </label>
                <label className="flex flex-col items-center">
                  <span className="label-text">TR</span>
                  <input
                    type="color"
                    className="w-16 h-10"
                    value={gradientColors.tr}
                    onChange={(e) =>
                      setGradientColors({ ...gradientColors, tr: e.target.value })
                    }
                  />
                </label>
                <label className="flex flex-col items-center">
                  <span className="label-text">BL</span>
                  <input
                    type="color"
                    className="w-16 h-10"
                    value={gradientColors.bl}
                    onChange={(e) =>
                      setGradientColors({ ...gradientColors, bl: e.target.value })
                    }
                  />
                </label>
                <label className="flex flex-col items-center">
                  <span className="label-text">BR</span>
                  <input
                    type="color"
                    className="w-16 h-10"
                    value={gradientColors.br}
                    onChange={(e) =>
                      setGradientColors({ ...gradientColors, br: e.target.value })
                    }
                  />
                </label>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={handleGenerate}>
              Generate
            </button>
            <button className="btn" onClick={handleDownload}>
              Download PNG
            </button>
          </div>
        </div>
        <canvas
          ref={canvasRef}
          className="mt-4 border border-base-300 self-center"
        />
      </div>
    </div>
  )
}

export default App
