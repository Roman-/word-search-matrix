import { useState, useRef } from 'react'
import './App.css'
import { generateUniqueWordGrid } from './utils/wordMatrixGenerator.js'

const fonts = ['Roboto', 'Open Sans', 'Lato']

function App() {
  const [word, setWord] = useState('')
  const [size, setSize] = useState('5x5')
  const [font, setFont] = useState(fonts[0])
  const canvasRef = useRef(null)

  const handleGenerate = () => {
    const [wStr, hStr] = size.toLowerCase().split('x')
    const width = parseInt(wStr, 10)
    const height = parseInt(hStr ?? wStr, 10)
    if (!word || !width || !height) return

    try {
      const grid = generateUniqueWordGrid(width, height, word)
      drawGrid(grid)
    } catch (err) {
      // Clear canvas on error and log
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
    const cell = 40
    canvas.width = grid[0].length * cell
    canvas.height = grid.length * cell
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `20px "${font}"`
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[0].length; j++) {
        const x = j * cell + cell / 2
        const y = i * cell + cell / 2
        ctx.fillText(grid[i][j], x, y)
      }
    }
  }

  return (
    <div className="app">
      <input
        type="text"
        value={word}
        onChange={(e) => setWord(e.target.value)}
        placeholder="Word"
      />
      <input
        type="text"
        value={size}
        onChange={(e) => setSize(e.target.value)}
        placeholder="Grid size (e.g. 5x5)"
      />
      <select value={font} onChange={(e) => setFont(e.target.value)}>
        {fonts.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>
      <button onClick={handleGenerate}>Generate</button>
      <canvas ref={canvasRef} />
    </div>
  )
}

export default App

