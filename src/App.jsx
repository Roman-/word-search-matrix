import { useState, useRef } from 'react'
import generateWordSearchGrid from './utils/MultiWordMatrixGenerator.js'

const fonts = ['Roboto', 'Open Sans', 'Lato', 'Poppins', 'Montserrat']

function App() {
  const [words, setWords] = useState('WORD')
  const [letters, setLetters] = useState('')
  const [size, setSize] = useState('6x6')
  const [font, setFont] = useState(fonts[0])
  const [cellSize, setCellSize] = useState(40)
  const [margin, setMargin] = useState(10)
  const [bold, setBold] = useState(true)
  const canvasRef = useRef(null)

  const handleGenerate = () => {
    const [wStr, hStr] = size.toLowerCase().split('x')
    const width = parseInt(wStr, 10)
    const height = parseInt(hStr ?? wStr, 10)
    if (!words || !width || !height) return

    try {
      const wordsArr = words.trim().split(/\s+/).filter(Boolean)
      const lettersArr = letters.split('').filter(Boolean)
      const { grid } = generateWordSearchGrid(wordsArr, lettersArr, width, height)
      drawGrid(grid)
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
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[0].length; j++) {
        const x = m + j * cell + cell / 2
        const y = m + i * cell + cell / 2
        ctx.fillText(grid[i][j], x, y)
      }
    }
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
