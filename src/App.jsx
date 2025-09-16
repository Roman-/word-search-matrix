import Navbar from './components/Navbar'
import GenerationControls from './components/GenerationControls'
import StyleControls from './components/StyleControls'
import SeparatorControls from './components/SeparatorControls'
import DownloadButtons from './components/DownloadButtons'
import GridCanvas from './components/GridCanvas'
import { APP_NAME, FONTS } from './constants/settings'
import { SUPPORTED_LANGUAGES } from './data/languages'
import useWordSearchController from './hooks/useWordSearchController'

function App() {
  const {
    language,
    generation,
    style,
    separators,
    canvasRef,
    downloadOptions,
    previewBounds,
    fileInfo,
    isGenerating,
    progress,
    status,
    isPreviewLoading,
    previewMessage,
    handleGenerate,
    handleReset,
    handleDownload,
    handleGenerationSettingsChange,
    handleStyleChange,
    handleSeparatorChange,
    handleRandomizeColors,
    fillWordsWithRandomSet,
    fillLettersWithAlphabet,
    handleLanguageChange,
  } = useWordSearchController()

  return (
    <div className="flex min-h-screen flex-col bg-base-200">
      <Navbar title={APP_NAME} />
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="flex w-full flex-col gap-6 bg-base-100 p-4 shadow-xl md:w-1/3 md:overflow-y-auto">
          <GenerationControls
            settings={generation}
            onChange={handleGenerationSettingsChange}
            onFillWords={fillWordsWithRandomSet}
            onFillLetters={fillLettersWithAlphabet}
            languages={SUPPORTED_LANGUAGES}
            language={language}
            onLanguageChange={handleLanguageChange}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            progress={progress}
            status={status}
          />
          <StyleControls
            settings={style}
            onChange={handleStyleChange}
            fonts={FONTS}
            onRandomizeColors={handleRandomizeColors}
          />
          <SeparatorControls settings={separators} onChange={handleSeparatorChange} />
          <DownloadButtons
            fileInfo={fileInfo}
            onDownload={handleDownload}
            downloadOptions={downloadOptions}
            onReset={handleReset}
          />
        </div>
        <div className="flex-1 min-h-0 p-4">
          <div className="flex h-full w-full items-start justify-center overflow-auto">
            <GridCanvas
              canvasRef={canvasRef}
              maxHeight={previewBounds.maxHeight}
              isLoading={isPreviewLoading}
              statusMessage={previewMessage}
              onGenerate={handleGenerate}
              disableInteraction={isGenerating}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
