export default function DownloadButtons({
  fileInfo,
  onDownload,
  downloadOptions = [],
  onReset,
}) {
  const infoText = [fileInfo?.name, fileInfo?.size ? `(${fileInfo.size})` : '']
    .filter(Boolean)
    .join(' ')

  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm break-all" aria-live="polite">
        {infoText || 'No file generated yet'}
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {downloadOptions.map(({ format, label }) => (
          <button
            key={format}
            type="button"
            className="btn"
            onClick={() => onDownload?.(format)}
          >
            {label}
          </button>
        ))}
        <button type="button" className="btn btn-warning" onClick={onReset}>
          Reset to defaults
        </button>
      </div>
    </div>
  )
}
