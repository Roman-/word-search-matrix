export default function Navbar({ title, language, languages, onLanguageChange }) {
  const languageOptions = Array.isArray(languages) ? languages : []
  const handleChange = (event) => {
    onLanguageChange(event.target.value)
  }

  return (
    <header className="bg-base-100 shadow">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3">
        <span className="text-lg font-semibold">{title}</span>
        <label className="flex items-center gap-2 text-sm font-medium">
          <span className="hidden sm:inline">Language</span>
          <select className="select select-sm select-bordered" value={language} onChange={handleChange}>
            {languageOptions.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </header>
  )
}
