import RangeInput from './common/RangeInput'

const STYLE_SLIDERS = [
  { id: 'cellSize', label: 'Cell', min: 5, max: 200 },
  { id: 'margin', label: 'Margin', min: 0, max: 400 },
]

export default function StyleControls({ settings, onChange, fonts, onRandomizeColors }) {
  const {
    cellSize = 0,
    margin = 0,
    font = fonts?.[0] ?? '',
    bold = false,
    colorMode = 'gradient',
    solidColor = '#000000',
    gradientColors = {},
  } = settings ?? {}

  const handleFontChange = (event) => {
    onChange?.({ font: event.target.value })
  }

  const handleBoldToggle = (event) => {
    onChange?.({ bold: event.target.checked })
  }

  const handleColorModeChange = (event) => {
    onChange?.({ colorMode: event.target.value })
  }

  const handleSolidColorChange = (event) => {
    onChange?.({ solidColor: event.target.value })
  }

  const handleGradientColorChange = (key, value) => {
    onChange?.({ gradientColors: { ...gradientColors, [key]: value } })
  }

  const gradientEntries = [
    { key: 'tl', label: 'TL' },
    { key: 'tr', label: 'TR' },
    { key: 'bl', label: 'BL' },
    { key: 'br', label: 'BR' },
  ]

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3">
        {STYLE_SLIDERS.map(({ id, label, min, max }) => (
          <RangeInput
            key={id}
            id={`style-${id}`}
            label={label}
            min={min}
            max={max}
            value={id === 'cellSize' ? cellSize : margin}
            onChange={(value) => onChange?.({ [id]: value })}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select className="select select-bordered" value={font} onChange={handleFontChange}>
          {fonts.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <label className="label cursor-pointer gap-2">
          <span className="label-text">Bold</span>
          <input
            type="checkbox"
            className="checkbox"
            checked={bold}
            onChange={handleBoldToggle}
          />
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <select
            className="select select-bordered flex-1"
            value={colorMode}
            onChange={handleColorModeChange}
          >
            <option value="solid">Solid Color</option>
            <option value="gradient">Gradient</option>
            <option value="random">Random</option>
          </select>
          <button type="button" className="btn btn-square" onClick={onRandomizeColors}>
            🎲
          </button>
        </div>

        {colorMode === 'solid' && (
          <input
            type="color"
            className="h-10 w-16"
            value={solidColor}
            onChange={handleSolidColorChange}
          />
        )}

        {colorMode === 'gradient' && (
          <div className="grid grid-cols-2 gap-2">
            {gradientEntries.map(({ key, label }) => (
              <label key={key} className="flex flex-col items-center">
                <span className="label-text">{label}</span>
                <input
                  type="color"
                  className="h-10 w-16"
                  value={gradientColors[key] ?? '#000000'}
                  onChange={(event) => handleGradientColorChange(key, event.target.value)}
                />
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
