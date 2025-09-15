export default function GenerationControls({
  words,
  setWords,
  letters,
  setLetters,
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
  const fillLetters = () => {
    const unique = Array.from(
      new Set(words.replace(/[^A-Za-z]/g, '').toUpperCase().split(''))
    )
    setLetters(unique.sort().join(''))
  }
  return (
    <div className="flex flex-col gap-3">
      <input
        type="text"
        className="input input-bordered w-full"
        value={words}
        onChange={(e) => setWords(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleGenerate()
        }}
        placeholder="Words (space-separated)"
      />
      <div className="flex gap-2">
        <input
          type="text"
          className="input input-bordered flex-1"
          value={letters}
          onChange={(e) => setLetters(e.target.value)}
          placeholder="Possible letters (e.g. ABCD)"
        />
        <button className="btn btn-square" onClick={fillLetters}>
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
