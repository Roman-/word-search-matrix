import RangeInput from './common/RangeInput'

const DIMENSION_CONTROLS = [
  { id: 'width', label: 'Width', min: 2, max: 15 },
  { id: 'height', label: 'Height', min: 2, max: 15 },
]

export default function GenerationControls({
  settings,
  onChange,
  onFillWords,
  onFillLetters,
  languages,
  language,
  onLanguageChange,
  onGenerate,
  isGenerating,
  progress,
  status,
}) {
  const { words = '', letters = '', width = 0, height = 0, encoding = 'free' } =
    settings ?? {}

  const languageOptions = Array.isArray(languages) ? languages : []

  const handleWordsChange = (event) => {
    onChange?.({ words: event.target.value })
  }

  const handleLettersChange = (event) => {
    onChange?.({ letters: event.target.value })
  }

  const handleFillWords = () => {
    onFillWords?.()
  }

  const handleFillLetters = () => {
    onFillLetters?.()
  }

  const handleLanguageSelect = (event) => {
    onLanguageChange?.(event.target.value)
  }

  const handleEncodingSelect = (event) => {
    onChange?.({ encoding: event.target.value })
  }

  const normalizedWordLetters = words.replace(/\s+/g, '').toUpperCase()
  const uniqueLetters = Array.from(new Set(normalizedWordLetters))
    .sort((a, b) => a.localeCompare(b))
    .join('')
  const baseLettersPlaceholder = 'Other letters to fill the grid'
  const lettersPlaceholder = uniqueLetters
    ? `${baseLettersPlaceholder}: ${uniqueLetters}`
    : baseLettersPlaceholder

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <input
          type="text"
          className="input input-bordered flex-1"
          value={words}
          onChange={handleWordsChange}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              onGenerate?.()
            }
          }}
          placeholder="Words (space-separated)"
        />
        <button
          type="button"
          className="btn btn-square"
          onClick={handleFillWords}
          aria-label="Fill words"
          title="Fill words"
        >
          🎲
        </button>
        <select
          className="select select-bordered select-sm w-16 text-center text-lg"
          value={language}
          onChange={handleLanguageSelect}
          aria-label="Select language"
          title="Select language"
        >
          {languageOptions.map((option) => (
            <option key={option.code} value={option.code} title={option.label}>
              {option.flag ?? option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          className="input input-bordered flex-1"
          value={letters}
          onChange={handleLettersChange}
          placeholder={lettersPlaceholder}
        />
        <button
          type="button"
          className="btn btn-square"
          onClick={handleFillLetters}
          aria-label="Fill letters"
          title="Fill letters"
        >
          🔤
        </button>
      </div>

      {DIMENSION_CONTROLS.map(({ id, label, min, max }) => (
        <RangeInput
          key={id}
          id={`dimension-${id}`}
          label={label}
          min={min}
          max={max}
          value={id === 'width' ? width : height}
          onChange={(value) => onChange?.({ [id]: value })}
        />
      ))}

      <label className="flex flex-col">
        <span className="label-text">Encoding Method</span>
        <select
          className="select select-bordered"
          value={encoding}
          onChange={handleEncodingSelect}
        >
          <option value="free">Free allocation (no intersections)</option>
          <option value="intersections">Force intersections</option>
        </select>
      </label>

      <button type="button" className="btn btn-primary" onClick={onGenerate}>
        Generate
      </button>

      <div className="h-4">
        {isGenerating && (
          <progress
            className="progress h-4 w-full"
            value={Math.min(100, Math.round(progress * 100))}
            max="100"
          ></progress>
        )}
      </div>

      {status && (
        <div className="text-sm text-warning" role="status" aria-live="polite">
          {status}
        </div>
      )}
    </div>
  )
}
