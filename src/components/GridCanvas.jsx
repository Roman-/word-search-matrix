export default function GridCanvas({ canvasRef, handleDownload }) {
  return (
    <canvas
      ref={canvasRef}
      className="border border-base-300"
      onClick={() => handleDownload('png')}
    />
  )
}
