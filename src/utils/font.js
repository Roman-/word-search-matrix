export const ensureFontLoaded = async (fontSpec) => {
  if (typeof document === 'undefined' || !document.fonts?.load) {
    return
  }
  try {
    await document.fonts.load(fontSpec)
  } catch {
    /* ignore font loading issues */
  }
}

export default ensureFontLoaded
