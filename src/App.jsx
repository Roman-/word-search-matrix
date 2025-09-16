import { useEffect, useRef, useState } from 'react'
import tinycolor from 'tinycolor2'
import Navbar from './components/Navbar'
import GenerationControls from './components/GenerationControls'
import StyleControls from './components/StyleControls'
import SeparatorControls from './components/SeparatorControls'
import DownloadButtons from './components/DownloadButtons'
import GridCanvas from './components/GridCanvas'
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from './data/languages'
import { WORD_SETS, WORDS_PER_FILL } from './data/wordSets'
import { ALPHABETS } from './data/alphabets'
import { getRandomUniqueItems } from './utils/random'
import { drawPreview } from './utils/previewRenderer'

const fonts = ['Roboto', 'Open Sans', 'Lato', 'Poppins', 'Montserrat']
const darkPalette = [
  '#1f2937',
  '#1e40af',
  '#5b21b6',
  '#065f46',
  '#7c2d12',
  '#9d174d',
]

const getRandomPaletteColor = () =>
  darkPalette[Math.floor(Math.random() * darkPalette.length)]

const LANGUAGE_STORAGE_KEY = 'word-search-language'
const APP_NAME = 'Word Search Matrix'

function App() {
  const [language, setLanguage] = useState(() => {
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
  })
  const [words, setWords] = useState('hello world')
  const [letters, setLetters] = useState('')
  const [width, setWidth] = useState(6)
  const [height, setHeight] = useState(6)
  const [font, setFont] = useState(fonts[0])
  const [cellSize, setCellSize] = useState(90)
  const [margin, setMargin] = useState(0)
  const [bold, setBold] = useState(true)
  const [colorMode, setColorMode] = useState('gradient')
  const [solidColor, setSolidColor] = useState('#000000')
  const [encoding, setEncoding] = useState('free')
  const [gradientColors, setGradientColors] = useState({
    tl: '#ff0000',
    tr: '#00ff00',
    bl: '#0000ff',
    br: '#890A6E',
  })
  const canvasRef = useRef(null)
  const workerRef = useRef(null)
  const lastPreviewSignatureRef = useRef(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [gridData, setGridData] = useState(null)
  const [gridStatus, setGridStatus] = useState('preview')

  const [showSeparators, setShowSeparators] = useState(true)
  const [showBorder, setShowBorder] = useState(false)
  const [lineThickness, setLineThickness] = useState(1)
  const [separatorColor, setSeparatorColor] = useState('#808080')
  const [separatorStyle, setSeparatorStyle] = useState('solid')
  const [fileInfo, setFileInfo] = useState({ name: '', size: '' })

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    } catch {
      /* ignore local storage errors */
    }
  }, [language])

  useEffect(() => {
    if (gridData) {
      drawGrid(gridData)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    gridData,
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
  ])

  useEffect(() => {
    if (gridStatus !== 'preview') {
      return
    }
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const signature = JSON.stringify({
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
    })

    if (lastPreviewSignatureRef.current === signature) {
      return
    }

    let cancelled = false

    const renderPreview = async () => {
      try {
        await drawPreview({
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
          paletteColorProvider: getRandomPaletteColor,
        })
        if (!cancelled) {
          lastPreviewSignatureRef.current = signature
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to render preview', error)
        }
      }
    }

    renderPreview()

    return () => {
      cancelled = true
    }
  }, [
    gridStatus,
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
  ])

  useEffect(() => {
    handleGenerate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const invalidateGrid = ({ refreshPreview = false } = {}) => {
    const shouldReset = gridStatus !== 'preview' || refreshPreview
    if (shouldReset) {
      lastPreviewSignatureRef.current = null
      setFileInfo({ name: '', size: '' })
      setGridData((prev) => (prev ? null : prev))
    }
    if (gridStatus !== 'preview') {
      setGridStatus('preview')
    }
  }

  const handleWordsChange = (value) => {
    setWords(value)
    invalidateGrid()
  }

  const handleLettersChange = (value) => {
    setLetters(value)
    invalidateGrid()
  }

  const handleWidthChange = (value) => {
    setWidth(value)
    invalidateGrid({ refreshPreview: true })
  }

  const handleHeightChange = (value) => {
    setHeight(value)
    invalidateGrid({ refreshPreview: true })
  }

  const handleEncodingChange = (value) => {
    setEncoding(value)
    invalidateGrid()
  }

  const handleLanguageChange = (value) => {
    if (SUPPORTED_LANGUAGES.some((option) => option.code === value)) {
      setLanguage(value)
    }
  }

  const randomizeColors = () => {
    if (colorMode === 'gradient') {
      setGradientColors({
        tl: getRandomPaletteColor(),
        tr: getRandomPaletteColor(),
        bl: getRandomPaletteColor(),
        br: getRandomPaletteColor(),
      })
    } else {
      setSolidColor(getRandomPaletteColor())
    }
  }

  const fillWordsWithRandomSet = () => {
    const availableWords = WORD_SETS[language] ?? []
    const randomWords = getRandomUniqueItems(availableWords, WORDS_PER_FILL)
    if (randomWords.length) {
      handleWordsChange(randomWords.join(' '))
    }
  }

  const fillLettersWithAlphabet = () => {
    const alphabet = ALPHABETS[language]
    if (alphabet) {
      handleLettersChange(alphabet)
    }
  }

  const handleGenerate = () => {
    if (!words || !width || !height) return

    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
    }

    const wordsArr = words.trim().split(/\s+/).filter(Boolean)
    const lettersArr = letters.split('').filter(Boolean)
    const wordsUpper = wordsArr.map((w) => w.toUpperCase())
    const tooLong = wordsUpper.find((word) => word.length > width || word.length > height)

    setProgress(0)
    setStatus('')

    if (tooLong) {
      const limits = []
      if (tooLong.length > width) limits.push(`width ${width}`)
      if (tooLong.length > height) limits.push(`height ${height}`)
      const limitText = limits.length === 2 ? `${limits[0]} and ${limits[1]}` : limits[0]
      setStatus(
        `Cannot place ${tooLong} because its length (${tooLong.length}) exceeds ${limitText}.`
      )
      setIsGenerating(false)
      return
    }

    setIsGenerating(true)

    const worker = new Worker(new URL('./utils/generateWorker.js', import.meta.url), { type: 'module' })
    workerRef.current = worker
    worker.onmessage = async (e) => {
      const { type } = e.data
      if (type === 'progress') {
        setProgress(e.data.progress)
      } else if (type === 'result') {
        const { grid, partial, placements } = e.data.result
        setGridData(grid)
        setGridStatus('generated')
        setIsGenerating(false)
        setProgress(1)
        worker.terminate()
        const wordsUpper = wordsArr.map((w) => w.toUpperCase())
        const missing = wordsUpper.filter((w) => !placements.some((p) => p.word === w))
        if (partial) {
          setStatus(`Generation stopped early; missing words: ${missing.join(', ')}`)
        } else if (missing.length) {
          setStatus(`Missing words: ${missing.join(', ')}`)
        } else {
          setStatus('')
        }
      } else if (type === 'error') {
        setIsGenerating(false)
        worker.terminate()
        setStatus(e.data.message)
        setGridData(null)
        const canvas = canvasRef.current
        if (canvas) {
          const ctx = canvas.getContext('2d')
          ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
        lastPreviewSignatureRef.current = null
        setGridStatus('preview')
        setFileInfo({ name: '', size: '' })
      }
    }
    worker.postMessage({
      words: wordsArr,
      letters: lettersArr,
      width,
      height,
      options: { maxIterations: 50000, encoding }
    })
  }

  const drawGrid = async (grid) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const cell = parseInt(cellSize, 10) || 40
    const m = parseInt(margin, 10) || 0

    const fontSpec = `${bold ? 'bold ' : ''}${Math.floor(cell * 0.6)}px "${font}"`
    if (document.fonts?.load) {
      try {
        await document.fonts.load(fontSpec)
      } catch {
        /* ignore font loading errors */
      }
    }

    canvas.width = grid[0].length * cell + m * 2
    canvas.height = grid.length * cell + m * 2
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = fontSpec

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
            : colorMode === 'random'
            ? getRandomPaletteColor()
            : solidColor
        ctx.fillText(grid[i][j], x, y)
      }
    }
    if (showSeparators || showBorder) {
      ctx.strokeStyle = separatorColor
      ctx.lineWidth = lineThickness
      const dashMap = {
        solid: [],
        dashed: [lineThickness * 2, lineThickness * 2],
        dotted: [lineThickness, lineThickness],
      }
      ctx.setLineDash(dashMap[separatorStyle] ?? [])
      if (showSeparators) {
        for (let i = 1; i < cols; i++) {
          const x = m + i * cell
          ctx.beginPath()
          ctx.moveTo(x, m)
          ctx.lineTo(x, m + rows * cell)
          ctx.stroke()
        }
        for (let i = 1; i < rows; i++) {
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
      ctx.setLineDash([])
    }
    const firstWord = words.trim().split(/\s+/)[0] || 'image'
    const baseFile = `${firstWord}_${canvas.width}x${canvas.height}px`
    const fileName = `${baseFile}.png`
    const dataUrl = canvas.toDataURL('image/png')
    const byteLength = Math.round(
      (dataUrl.length - 'data:image/png;base64,'.length) * 0.75
    )
    const size = `${(byteLength / 1024).toFixed(2)} KB`
    setFileInfo({ name: fileName, size })
  }

  const handleDownload = (format = 'png') => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    const firstWord = words.trim().split(/\s+/)[0] || 'image'
    const baseFile = `${firstWord}_${canvas.width}x${canvas.height}px`
    if (format === 'jpeg') {
      const tmp = document.createElement('canvas')
      tmp.width = canvas.width
      tmp.height = canvas.height
      const ctx = tmp.getContext('2d')
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

  return (
    <div className="min-h-screen flex flex-col bg-base-200">
      <Navbar
        title={APP_NAME}
        language={language}
        languages={SUPPORTED_LANGUAGES}
        onLanguageChange={handleLanguageChange}
      />
      <div className="flex flex-1 flex-col md:flex-row">
        <div className="w-full md:w-1/3 bg-base-100 p-4 flex flex-col gap-6 shadow-xl">
          <GenerationControls
            words={words}
            setWords={handleWordsChange}
            letters={letters}
            setLetters={handleLettersChange}
            onFillWords={fillWordsWithRandomSet}
            onFillLetters={fillLettersWithAlphabet}
            width={width}
            setWidth={handleWidthChange}
            height={height}
            setHeight={handleHeightChange}
            encoding={encoding}
            setEncoding={handleEncodingChange}
            handleGenerate={handleGenerate}
            isGenerating={isGenerating}
            progress={progress}
            status={status}
          />
          <StyleControls
            cellSize={cellSize}
            setCellSize={setCellSize}
            margin={margin}
            setMargin={setMargin}
            font={font}
            setFont={setFont}
            bold={bold}
            setBold={setBold}
            colorMode={colorMode}
            setColorMode={setColorMode}
            solidColor={solidColor}
            setSolidColor={setSolidColor}
            gradientColors={gradientColors}
            setGradientColors={setGradientColors}
            randomizeColors={randomizeColors}
            fonts={fonts}
          />
          <SeparatorControls
            showSeparators={showSeparators}
            setShowSeparators={setShowSeparators}
            showBorder={showBorder}
            setShowBorder={setShowBorder}
            lineThickness={lineThickness}
            setLineThickness={setLineThickness}
            separatorColor={separatorColor}
            setSeparatorColor={setSeparatorColor}
            separatorStyle={separatorStyle}
            setSeparatorStyle={setSeparatorStyle}
          />
          <DownloadButtons handleDownload={handleDownload} fileInfo={fileInfo} />
        </div>
        <div className="flex-1 p-4 flex items-center justify-center">
          <GridCanvas canvasRef={canvasRef} handleDownload={handleDownload} />
        </div>
      </div>
    </div>
  )
}

export default App

