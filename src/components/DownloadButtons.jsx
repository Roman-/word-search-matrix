export default function DownloadButtons({ handleDownload, fileInfo }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-sm">
        {fileInfo.name} {fileInfo.size && `(${fileInfo.size})`}
      </div>
      <div className="flex gap-2">
        <button className="btn" onClick={() => handleDownload('png')}>
          Download PNG
        </button>
        <button className="btn" onClick={() => handleDownload('jpeg')}>
          Download JPEG
        </button>
      </div>
    </div>
  )
}
