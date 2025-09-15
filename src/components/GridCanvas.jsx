export default function GridCanvas({ canvasRef, handleDownload }) {
  return (
    <canvas
      ref={canvasRef}
      className="border-2 border-base-300 cursor-pointer transition duration-300 hover:scale-105 hover:shadow-[0_0_10px_3px_rgba(59,130,246,0.7)]"
      onClick={() => handleDownload('png')}
    />
  )
}
