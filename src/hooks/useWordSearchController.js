import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { ACTIONS, wordSearchReducer } from '../state/appReducer'
import { createAppState, createGenerationState } from '../state/initialState'
import usePreviewBounds from './usePreviewBounds'
import { drawPreview } from '../utils/previewRenderer'
import { renderGridToCanvas } from '../utils/gridRenderer'
import { downloadCanvasImage, downloadJSON } from '../utils/download'
import getRandomPaletteColor from '../utils/colors'
import { resolveInitialLanguage } from '../utils/language'
import { pickRandomWordsForLanguage } from '../utils/words'
import { ALPHABETS } from '../data/alphabets'
import { SUPPORTED_LANGUAGES } from '../data/languages'
import { LANGUAGE_STORAGE_KEY } from '../constants/settings'

const DEFAULT_FILE_INFO = { name: '', size: '' }

export const useWordSearchController = () => {
  const initialLanguage = useMemo(() => resolveInitialLanguage(), [])
  const [state, dispatch] = useReducer(
    wordSearchReducer,
    initialLanguage,
    (language) => createAppState(language)
  )

  const { language, generation, style, separators } = state
  const { words, letters, width, height, encoding } = generation

  const canvasRef = useRef(null)
  const workerRef = useRef(null)
  const lastPreviewSignatureRef = useRef(null)
  const handleGenerateRef = useRef(() => {})

  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [gridData, setGridData] = useState(null)
  const [gridStatus, setGridStatus] = useState('preview')
  const [fileInfo, setFileInfo] = useState(DEFAULT_FILE_INFO)
  const [previewState, setPreviewState] = useState('idle')
  const [previewError, setPreviewError] = useState('')

  const previewBounds = usePreviewBounds({ verticalPadding: 112 })
  const downloadOptions = useMemo(
    () => [
      { format: 'png', label: 'Download PNG' },
      { format: 'jpeg', label: 'Download JPEG' },
      { format: 'json', label: 'Download JSON' },
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
        setFileInfo(DEFAULT_FILE_INFO)
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
      if ('width' in changes || 'height' in changes) {
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
    if (style.colorMode === 'gradient') {
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
  }, [style.colorMode, invalidateGrid])

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
      dispatch({
        type: ACTIONS.UPDATE_GENERATION,
        payload: createGenerationState(value),
      })
      invalidateGrid({ refreshPreview: true })
      setStatus('')
    },
    [invalidateGrid]
  )

  const drawGrid = useCallback(
    async (grid) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const info = await renderGridToCanvas({
        canvas,
        grid,
        words,
        style,
        separators,
        paletteColorProvider: getRandomPaletteColor,
      })
      if (info) {
        setFileInfo(info)
        setPreviewState('ready')
      }
    },
    [separators, style, words]
  )

  const handleDownload = useCallback(
    (format = 'png') => {
      if (format === 'json') {
        if (!gridData) {
          setStatus('Generate a grid first to download JSON data.')
          return
        }
        downloadJSON(gridData, words)
      } else {
        const canvas = canvasRef.current
        if (!canvas) return
        downloadCanvasImage(canvas, words, format)
      }
    },
    [words, gridData]
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
    setFileInfo(DEFAULT_FILE_INFO)
    setPreviewState('idle')
    setPreviewError('')
    lastPreviewSignatureRef.current = null
  }, [])

  const handleGenerate = useCallback(() => {
    if (isGenerating || workerRef.current) {
      return
    }

    const trimmedWords = words.trim()
    if (!trimmedWords || !width || !height) {
      setStatus('Add at least one word to generate a grid.')
      return
    }

    const wordsArr = trimmedWords.split(/\s+/).filter(Boolean)
    const lettersArr = letters.split('').filter(Boolean)
    const wordsUpper = wordsArr.map((w) => w.toUpperCase())
    const tooLong = wordsUpper.find((word) => word.length > width || word.length > height)

    setProgress(0)
    setStatus('Preparing grid…')
    setIsGenerating(true)
    setGridStatus('generating')
    setFileInfo(DEFAULT_FILE_INFO)

    if (tooLong) {
      const limits = []
      if (tooLong.length > width) limits.push(`width ${width}`)
      if (tooLong.length > height) limits.push(`height ${height}`)
      const limitText = limits.length === 2 ? `${limits[0]} and ${limits[1]}` : limits[0]
      setStatus(
        `Cannot place ${tooLong} because its length (${tooLong.length}) exceeds ${limitText}.`
      )
      setIsGenerating(false)
      setGridStatus('preview')
      return
    }

    const worker = new Worker(new URL('../utils/generateWorker.js', import.meta.url), {
      type: 'module',
    })
    workerRef.current = worker

    worker.onmessage = (event) => {
      const { type } = event.data
      if (type === 'progress') {
        setProgress(event.data.progress ?? 0)
      } else if (type === 'result') {
        const { grid, partial, placements } = event.data.result
        setGridData({ grid, partial, placements })
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
        setFileInfo(DEFAULT_FILE_INFO)
      }
    }

    worker.postMessage({
      words: wordsArr,
      letters: lettersArr,
      width,
      height,
      options: { maxIterations: 50000, encoding },
    })
  }, [encoding, height, isGenerating, letters, width, words])

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
      /* ignore storage issues */
    }
  }, [language])

  useEffect(() => {
    if (!gridData) {
      return
    }
    drawGrid(gridData.grid)
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
      ...style,
      ...separators,
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
          ...style,
          ...separators,
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
  }, [gridStatus, height, separators, style, width])

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

  return {
    language,
    generation,
    style,
    separators,
    canvasRef,
    downloadOptions,
    previewBounds,
    fileInfo,
    isGenerating,
    progress,
    status,
    gridStatus,
    isPreviewLoading,
    previewMessage,
    handleGenerate,
    handleReset,
    handleDownload,
    handleGenerationSettingsChange,
    handleStyleChange,
    handleSeparatorChange,
    handleRandomizeColors,
    fillWordsWithRandomSet,
    fillLettersWithAlphabet,
    handleLanguageChange,
  }
}

export default useWordSearchController
