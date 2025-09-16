export default function GenerationControls({
  words,
  setWords,
  letters,
  setLetters,
  onFillWords,
  onFillLetters,
  languages,
  language,
  onLanguageChange,
  width,
  setWidth,
  height,
  setHeight,
  encoding,
  setEncoding,
  handleGenerate,
  isGenerating,
  progress,
  status,
}) {
  const languageOptions = Array.isArray(languages) ? languages : []
  const handleFillWords = () => {
    if (onFillWords) {
      onFillWords()
    }
  }

  const handleFillLetters = () => {
    if (onFillLetters) {
      onFillLetters()
    }
  }

  const handleLanguageChange = (event) => {
    if (onLanguageChange) {
      onLanguageChange(event.target.value)
    }
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
      <div className="flex gap-2 items-center">
        <input
          type="text"
          className="input input-bordered flex-1"
          value={words}
          onChange={(e) => setWords(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleGenerate()
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
          className="select select-bordered select-sm w-16 text-lg text-center"
          value={language}
          onChange={handleLanguageChange}
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
          onChange={(e) => setLetters(e.target.value)}
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
      <label className="flex flex-col">
        <span className="label-text">Width: {width}</span>
        <input
          type="range"
          min="2"
          max="15"
          value={width}
          onChange={(e) => setWidth(parseInt(e.target.value, 10))}
          className="range"
        />
      </label>
      <label className="flex flex-col">
        <span className="label-text">Height: {height}</span>
        <input
          type="range"
          min="2"
          max="15"
          value={height}
          onChange={(e) => setHeight(parseInt(e.target.value, 10))}
          className="range"
        />
      </label>
      <label className="flex flex-col w-full">
        <span className="label-text">Encoding Method</span>
        <select
          className="select select-bordered"
          value={encoding}
          onChange={(e) => setEncoding(e.target.value)}
        >
          <option value="free">Free allocation (no intersections)</option>
          <option value="intersections">Force intersections</option>
        </select>
      </label>
      <button className="btn btn-primary" onClick={handleGenerate}>
        Generate
      </button>
      <div className="h-4">
        {isGenerating && (
          <progress
            className="progress w-full h-4"
            value={progress * 100}
            max="100"
          ></progress>
        )}
      </div>
      {status && <div className="text-warning text-sm">{status}</div>}
    </div>
  )
}
