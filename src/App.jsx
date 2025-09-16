import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import tinycolor from 'tinycolor2'
import Navbar from './components/Navbar'
import GenerationControls from './components/GenerationControls'
import StyleControls from './components/StyleControls'
import SeparatorControls from './components/SeparatorControls'
import DownloadButtons from './components/DownloadButtons'
import GridCanvas from './components/GridCanvas'
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from './data/languages'
import { ALPHABETS } from './data/alphabets'
import { drawPreview } from './utils/previewRenderer'
import { pickRandomWordsForLanguage } from './utils/words'
import {
  APP_NAME,
  LANGUAGE_STORAGE_KEY,
  FONTS,
  DARK_PALETTE,
} from './constants/settings'
import { createAppState, createGenerationState } from './state/initialState'
import usePreviewBounds from './hooks/usePreviewBounds'

const ACTIONS = {
  SET_LANGUAGE: 'SET_LANGUAGE',
  UPDATE_GENERATION: 'UPDATE_GENERATION',
  UPDATE_STYLE: 'UPDATE_STYLE',
  UPDATE_SEPARATORS: 'UPDATE_SEPARATORS',
  RESET: 'RESET',
}

const getRandomPaletteColor = () =>
  DARK_PALETTE[Math.floor(Math.random() * DARK_PALETTE.length)]

const resolveInitialLanguage = () => {
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
}

const wordSearchReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_LANGUAGE:
      return { ...state, language: action.payload }
    case ACTIONS.UPDATE_GENERATION:
      return { ...state, generation: { ...state.generation, ...action.payload } }
    case ACTIONS.UPDATE_STYLE:
      return { ...state, style: { ...state.style, ...action.payload } }
    case ACTIONS.UPDATE_SEPARATORS:
      return { ...state, separators: { ...state.separators, ...action.payload } }
    case ACTIONS.RESET:
      return createAppState(state.language)
    default:
      return state
  }
}

function App() {
  const initialLanguage = useMemo(() => resolveInitialLanguage(), [])
  const [state, dispatch] = useReducer(
    wordSearchReducer,
    initialLanguage,
    (language) => createAppState(language)
  )

  const { language, generation, style, separators } = state
  const { words, letters, width, height, encoding } = generation
  const { cellSize, margin, font, bold, colorMode, solidColor, gradientColors } = style
  const { showSeparators, showBorder, lineThickness, separatorColor, separatorStyle } =
    separators

  const canvasRef = useRef(null)
  const workerRef = useRef(null)
  const lastPreviewSignatureRef = useRef(null)
  const handleGenerateRef = useRef(() => {})

  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [gridData, setGridData] = useState(null)
  const [gridStatus, setGridStatus] = useState('preview')
  const [fileInfo, setFileInfo] = useState({ name: '', size: '' })
  const [previewState, setPreviewState] = useState('idle')
  const [previewError, setPreviewError] = useState('')

  const previewBounds = usePreviewBounds({ verticalPadding: 112 })
  const downloadOptions = useMemo(
    () => [
      { format: 'png', label: 'Download PNG' },
      { format: 'jpeg', label: 'Download JPEG' },
    ],
    []
  )

  const invalidateGrid = useCallback(
    ({ refreshPreview = false } = {}) => {
      const shouldReset = gridStatus !== 'preview' || refreshPreview
      if (shouldReset) {
        lastPreviewSignatureRef.current = null
        setPreviewState('idle')
        setPreviewError('')
        setFileInfo({ name: '', size: '' })
        setGridData(null)
      }
      if (gridStatus !== 'preview') {
        setGridStatus('preview')
      }
    },
    [gridStatus]
  )

  const handleGenerationSettingsChange = useCallback(
    (changes) => {
      dispatch({ type: ACTIONS.UPDATE_GENERATION, payload: changes })
      setStatus('')
      if (
        Object.prototype.hasOwnProperty.call(changes, 'width') ||
        Object.prototype.hasOwnProperty.call(changes, 'height')
      ) {
        invalidateGrid({ refreshPreview: true })
      } else {
        invalidateGrid()
      }
    },
    [invalidateGrid]
  )

  const handleStyleChange = useCallback(
    (changes) => {
      dispatch({ type: ACTIONS.UPDATE_STYLE, payload: changes })
      invalidateGrid({ refreshPreview: true })
    },
    [invalidateGrid]
  )

  const handleSeparatorChange = useCallback(
    (changes) => {
      dispatch({ type: ACTIONS.UPDATE_SEPARATORS, payload: changes })
      invalidateGrid({ refreshPreview: true })
    },
    [invalidateGrid]
  )

  const handleRandomizeColors = useCallback(() => {
    if (colorMode === 'gradient') {
      dispatch({
        type: ACTIONS.UPDATE_STYLE,
        payload: {
          gradientColors: {
            tl: getRandomPaletteColor(),
            tr: getRandomPaletteColor(),
            bl: getRandomPaletteColor(),
            br: getRandomPaletteColor(),
          },
        },
      })
    } else {
      dispatch({
        type: ACTIONS.UPDATE_STYLE,
        payload: { solidColor: getRandomPaletteColor() },
      })
    }
    invalidateGrid({ refreshPreview: true })
  }, [colorMode, invalidateGrid])

  const fillWordsWithRandomSet = useCallback(() => {
    const randomWords = pickRandomWordsForLanguage(language, width, height)
    if (randomWords.length) {
      handleGenerationSettingsChange({ words: randomWords.join(' ') })
    }
  }, [language, width, height, handleGenerationSettingsChange])

  const fillLettersWithAlphabet = useCallback(() => {
    const alphabet = ALPHABETS[language]
    if (alphabet) {
      handleGenerationSettingsChange({ letters: alphabet })
    }
  }, [language, handleGenerationSettingsChange])

  const handleLanguageChange = useCallback(
    (value) => {
      if (!SUPPORTED_LANGUAGES.some((option) => option.code === value)) {
        return
      }
      dispatch({ type: ACTIONS.SET_LANGUAGE, payload: value })
      dispatch({ type: ACTIONS.UPDATE_GENERATION, payload: createGenerationState(value) })
      invalidateGrid({ refreshPreview: true })
      setStatus('')
    },
    [invalidateGrid]
  )

  const drawGrid = useCallback(
    async (grid) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const cell = Number(cellSize) || 40
      const m = Number(margin) || 0

      const fontSpec = `${bold ? 'bold ' : ''}${Math.floor(cell * 0.6)}px "${font}"`
      if (document.fonts?.load) {
        try {
          await document.fonts.load(fontSpec)
        } catch {
          // ignore font loading issues
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

      for (let i = 0; i < rows; i += 1) {
        for (let j = 0; j < cols; j += 1) {
          const x = m + j * cell + cell / 2
          const y = m + i * cell + cell / 2
          const fillStyle =
            colorMode === 'gradient'
              ? getGradientColor(i, j)
              : colorMode === 'random'
              ? getRandomPaletteColor()
              : solidColor
          ctx.fillStyle = fillStyle
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
      setPreviewState('ready')
    },
    [
      bold,
      cellSize,
      colorMode,
      font,
      gradientColors,
      lineThickness,
      margin,
      separatorColor,
      separatorStyle,
      showBorder,
      showSeparators,
      solidColor,
      words,
    ]
  )

  const handleDownload = useCallback(
    (format = 'png') => {
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
    },
    [words]
  )

  const handleReset = useCallback(() => {
    workerRef.current?.terminate()
    workerRef.current = null
    dispatch({ type: ACTIONS.RESET })
    setIsGenerating(false)
    setProgress(0)
    setStatus('')
    setGridStatus('preview')
    setGridData(null)
    setFileInfo({ name: '', size: '' })
    setPreviewState('idle')
    setPreviewError('')
    lastPreviewSignatureRef.current = null
  }, [])

  const handleGenerate = useCallback(() => {
    const trimmedWords = words.trim()
    if (!trimmedWords || !width || !height) {
      setStatus('Add at least one word to generate a grid.')
      return
    }

    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
    }

    const wordsArr = trimmedWords.split(/\s+/).filter(Boolean)
    const lettersArr = letters.split('').filter(Boolean)
    const wordsUpper = wordsArr.map((w) => w.toUpperCase())
    const tooLong = wordsUpper.find(
      (word) => word.length > width || word.length > height
    )

    setProgress(0)
    setStatus('Preparing grid…')
    setIsGenerating(true)
    setGridStatus('generating')
    setFileInfo({ name: '', size: '' })

    if (tooLong) {
      const limits = []
      if (tooLong.length > width) limits.push(`width ${width}`)
      if (tooLong.length > height) limits.push(`height ${height}`)
      const limitText =
        limits.length === 2 ? `${limits[0]} and ${limits[1]}` : limits[0]
      setStatus(
        `Cannot place ${tooLong} because its length (${tooLong.length}) exceeds ${limitText}.`
      )
      setIsGenerating(false)
      setGridStatus('preview')
      return
    }

    const worker = new Worker(new URL('./utils/generateWorker.js', import.meta.url), {
      type: 'module',
    })
    workerRef.current = worker

    worker.onmessage = (event) => {
      const { type } = event.data
      if (type === 'progress') {
        setProgress(event.data.progress ?? 0)
      } else if (type === 'result') {
        const { grid, partial, placements } = event.data.result
        setGridData(grid)
        setGridStatus('generated')
        setIsGenerating(false)
        setProgress(1)
        worker.terminate()
        workerRef.current = null
        const missing = wordsUpper.filter(
          (word) => !placements.some((placement) => placement.word === word)
        )
        if (partial) {
          setStatus(`Generation stopped early; missing words: ${missing.join(', ')}`)
        } else if (missing.length) {
          setStatus(`Missing words: ${missing.join(', ')}`)
        } else {
          setStatus('')
        }
      } else if (type === 'error') {
        worker.terminate()
        workerRef.current = null
        setIsGenerating(false)
        setGridStatus('preview')
        setStatus(event.data.message)
        setGridData(null)
        lastPreviewSignatureRef.current = null
        setFileInfo({ name: '', size: '' })
      }
    }

    worker.postMessage({
      words: wordsArr,
      letters: lettersArr,
      width,
      height,
      options: { maxIterations: 50000, encoding },
    })
  }, [encoding, height, letters, width, words])

  useEffect(() => {
    handleGenerateRef.current = handleGenerate
  }, [handleGenerate])

  useEffect(() => {
    handleGenerateRef.current()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    } catch {
      // ignore storage issues
    }
  }, [language])

  useEffect(() => {
    if (!gridData) {
      return
    }
    drawGrid(gridData)
  }, [gridData, drawGrid])

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
      setPreviewState('loading')
      setPreviewError('')
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
          setPreviewState('ready')
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to render preview', error)
          setPreviewState('error')
          setPreviewError('Unable to render preview')
        }
      }
    }

    renderPreview()

    return () => {
      cancelled = true
    }
  }, [
    bold,
    cellSize,
    colorMode,
    font,
    gradientColors,
    gridStatus,
    height,
    lineThickness,
    margin,
    separatorColor,
    separatorStyle,
    showBorder,
    showSeparators,
    solidColor,
    width,
  ])

  useEffect(
    () => () => {
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
      }
    },
    []
  )

  const isPreviewLoading = gridStatus === 'preview' && previewState === 'loading'
  const previewMessage =
    gridStatus === 'preview' && previewState === 'error' ? previewError : undefined

  return (
    <div className="flex min-h-screen flex-col bg-base-200">
      <Navbar title={APP_NAME} />
      <div className="flex flex-1 min-h-0 flex-col md:flex-row">
        <div className="flex w-full flex-col gap-6 bg-base-100 p-4 shadow-xl md:w-1/3 md:overflow-y-auto">
          <GenerationControls
            settings={generation}
            onChange={handleGenerationSettingsChange}
            onFillWords={fillWordsWithRandomSet}
            onFillLetters={fillLettersWithAlphabet}
            languages={SUPPORTED_LANGUAGES}
            language={language}
            onLanguageChange={handleLanguageChange}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            progress={progress}
            status={status}
          />
          <StyleControls
            settings={style}
            onChange={handleStyleChange}
            fonts={FONTS}
            onRandomizeColors={handleRandomizeColors}
          />
          <SeparatorControls settings={separators} onChange={handleSeparatorChange} />
          <DownloadButtons
            fileInfo={fileInfo}
            onDownload={handleDownload}
            downloadOptions={downloadOptions}
            onReset={handleReset}
          />
        </div>
        <div className="flex-1 min-h-0 p-4">
          <div className="flex h-full w-full items-center justify-center overflow-auto">
            <GridCanvas
              canvasRef={canvasRef}
              onDownload={handleDownload}
              maxHeight={previewBounds.maxHeight}
              isLoading={isPreviewLoading}
              statusMessage={previewMessage}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
