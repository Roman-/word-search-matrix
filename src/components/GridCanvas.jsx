export default function GridCanvas({ canvasRef, handleDownload }) {
  return (
    <canvas
      ref={canvasRef}
      className="border-2 border-base-300 cursor-pointer transition duration-300 hover:scale-105 hover:border-primary"
      onClick={() => handleDownload('png')}
    />
  )
}
