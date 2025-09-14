export default function StyleControls({
  cellSize,
  setCellSize,
  margin,
  setMargin,
  font,
  setFont,
  bold,
  setBold,
  colorMode,
  setColorMode,
  solidColor,
  setSolidColor,
  gradientColors,
  setGradientColors,
  randomizeColors,
  fonts,
}) {
  return (
    <div className="flex flex-col gap-3">
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
        <div className="flex items-center gap-2">
          <select
            className="select select-bordered flex-1"
            value={colorMode}
            onChange={(e) => setColorMode(e.target.value)}
          >
            <option value="solid">Solid Color</option>
            <option value="gradient">Gradient</option>
            <option value="random">Random</option>
          </select>
          <button className="btn btn-square" onClick={randomizeColors}>
            🎲
          </button>
        </div>
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
    </div>
  )
}
