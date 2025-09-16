export const getRandomUniqueItems = (items, count) => {
  if (!Array.isArray(items) || items.length === 0 || count <= 0) {
    return []
  }

  const pool = [...new Set(items)]
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }

  return pool.slice(0, Math.min(count, pool.length))
}
