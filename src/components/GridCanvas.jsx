export default function GridCanvas({ canvasRef, handleDownload }) {
  return (
    <canvas
      ref={canvasRef}
      className="border-2 border-base-300"
      onClick={() => handleDownload('png')}
    />
  )
}
