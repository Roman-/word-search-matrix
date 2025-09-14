export default function SeparatorControls({
  showSeparators,
  setShowSeparators,
  showBorder,
  setShowBorder,
  lineThickness,
  setLineThickness,
  separatorColor,
  setSeparatorColor,
  separatorStyle,
  setSeparatorStyle,
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="label cursor-pointer gap-2">
        <span className="label-text">Separators</span>
        <input
          type="checkbox"
          className="checkbox"
          checked={showSeparators}
          onChange={(e) => setShowSeparators(e.target.checked)}
        />
      </label>
      <label className="label cursor-pointer gap-2">
        <span className="label-text">Border</span>
        <input
          type="checkbox"
          className="checkbox"
          checked={showBorder}
          onChange={(e) => setShowBorder(e.target.checked)}
        />
      </label>
      <label className="flex flex-col">
        <span className="label-text">Thickness</span>
        <input
          type="range"
          min="0"
          max="10"
          value={lineThickness}
          onChange={(e) => setLineThickness(parseInt(e.target.value, 10))}
        />
      </label>
      <label className="flex flex-col">
        <span className="label-text">Separators Color</span>
        <input
          type="color"
          className="w-16 h-10"
          value={separatorColor}
          onChange={(e) => setSeparatorColor(e.target.value)}
        />
      </label>
      <label className="flex flex-col">
        <span className="label-text">Separators Style</span>
        <select
          className="select select-bordered"
          value={separatorStyle}
          onChange={(e) => setSeparatorStyle(e.target.value)}
        >
          <option value="solid">Solid</option>
          <option value="dashed">Dashed</option>
          <option value="dotted">Dotted</option>
        </select>
      </label>
    </div>
  )
}
