export default function Navbar({ title }) {
  return (
    <header className="bg-base-100 shadow">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3">
        <span className="text-lg font-semibold">{title}</span>
      </div>
    </header>
  )
}
