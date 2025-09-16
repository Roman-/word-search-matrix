export default function GridCanvas({
  canvasRef,
  onDownload,
  maxHeight,
  isLoading = false,
  statusMessage,
}) {
  const containerStyle =
    typeof maxHeight === 'number'
      ? { maxHeight: `${Math.max(0, maxHeight)}px` }
      : undefined

  const canvasStyle =
    typeof maxHeight === 'number'
      ? { maxHeight: `${Math.max(0, maxHeight - 16)}px` }
      : undefined

  return (
    <div
      className="relative flex w-full items-center justify-center"
      style={containerStyle}
      aria-busy={isLoading}
    >
      <canvas
        ref={canvasRef}
        className="m-3 max-h-full max-w-full cursor-pointer rounded-lg border-2 border-base-300 bg-base-100/70 transition duration-300 ease-in-out hover:scale-105 hover:shadow-[0_0_10px_3px_rgba(59,130,246,0.45)]"
        style={canvasStyle}
        onClick={() => onDownload?.('png')}
      />
      {(isLoading || statusMessage) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-lg bg-base-200/70 text-sm font-medium text-base-content">
          {isLoading ? (
            <>
              <span className="loading loading-spinner loading-lg text-primary" aria-hidden />
              <span>Preparing preview…</span>
            </>
          ) : (
            <span>{statusMessage}</span>
          )}
        </div>
      )}
    </div>
  )
}
