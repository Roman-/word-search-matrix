export default function RangeInput({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  disabled = false,
  formatValue,
}) {
  const displayValue =
    typeof formatValue === 'function' ? formatValue(value) : value

  return (
    <label className="flex flex-col" htmlFor={id}>
      <span className="label-text">
        {label}
        {displayValue !== undefined ? `: ${displayValue}` : ''}
      </span>
      <input
        id={id}
        type="range"
        className="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange?.(Number(event.target.value))}
        disabled={disabled}
      />
    </label>
  )
}
