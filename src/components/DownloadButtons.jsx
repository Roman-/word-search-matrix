export default function DownloadButtons({ handleDownload }) {
  return (
    <div className="flex gap-2">
      <button className="btn" onClick={() => handleDownload('png')}>
        Download PNG
      </button>
      <button className="btn" onClick={() => handleDownload('jpeg')}>
        Download JPEG
      </button>
    </div>
  )
}
