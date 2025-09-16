import RangeInput from './common/RangeInput'

const TOGGLE_OPTIONS = [
  { id: 'showSeparators', label: 'Separators' },
  { id: 'showBorder', label: 'Border' },
]

const SEPARATOR_STYLES = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
]

export default function SeparatorControls({ settings, onChange }) {
  const {
    showSeparators = true,
    showBorder = false,
    lineThickness = 1,
    separatorColor = '#808080',
    separatorStyle = 'solid',
  } = settings ?? {}

  const disabled = !showSeparators && !showBorder

  const handleToggle = (key) => (event) => {
    onChange?.({ [key]: event.target.checked })
  }

  const handleThicknessChange = (value) => {
    onChange?.({ lineThickness: value })
  }

  const handleColorChange = (event) => {
    onChange?.({ separatorColor: event.target.value })
  }

  const handleStyleChange = (event) => {
    onChange?.({ separatorStyle: event.target.value })
  }

  return (
    <div className="flex flex-col gap-2">
      {TOGGLE_OPTIONS.map(({ id, label }) => (
        <label key={id} className="label cursor-pointer gap-2">
          <span className="label-text">{label}</span>
          <input
            type="checkbox"
            className="checkbox"
            checked={id === 'showSeparators' ? showSeparators : showBorder}
            onChange={handleToggle(id)}
          />
        </label>
      ))}

      <RangeInput
        id="separator-thickness"
        label="Thickness"
        min={0}
        max={10}
        value={lineThickness}
        onChange={handleThicknessChange}
        disabled={disabled}
      />

      <label className="flex flex-col">
        <span className="label-text">Separators Color</span>
        <input
          type="color"
          className="h-10 w-16"
          value={separatorColor}
          onChange={handleColorChange}
          disabled={disabled}
        />
      </label>

      <label className="flex flex-col">
        <span className="label-text">Separators Style</span>
        <select
          className="select select-bordered"
          value={separatorStyle}
          onChange={handleStyleChange}
          disabled={disabled}
        >
          {SEPARATOR_STYLES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
