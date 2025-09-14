export default function generateFreeWordSearchGrid(words, letters, width, height, options = {}) {
  if (!Array.isArray(words)) throw new Error('words must be an array');
  if (!Array.isArray(letters)) throw new Error('letters must be an array');
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new Error('width and height must be positive integers.');
  }

  const cleanWords = words.map(w => String(w).trim().toUpperCase()).filter(w => w.length > 0);
  const allowed = new Set();
  for (const ch of letters) {
    const c = String(ch ?? '').toUpperCase();
    if (c.length === 1) allowed.add(c);
  }
  for (const w of cleanWords) for (const ch of w) allowed.add(ch);
  if (allowed.size === 0) throw new Error('No letters available to fill the grid.');

  const grid = Array.from({ length: height }, () => Array(width).fill(null));
  const placements = [];
  let placed = 0;
  const onProgress = options.onProgress;
  const wordsSorted = cleanWords.slice().sort((a, b) => b.length - a.length);

  function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  for (const word of wordsSorted) {
    const L = word.length;
    const possible = [];

    for (let r = 0; r < height; r++) {
      for (let c = 0; c <= width - L; c++) {
        let ok = true;
        for (let k = 0; k < L; k++) {
          if (grid[r][c + k] !== null) { ok = false; break; }
        }
        if (ok) possible.push({ row: r, col: c, dir: 'H' });
      }
    }
    for (let r = 0; r <= height - L; r++) {
      for (let c = 0; c < width; c++) {
        let ok = true;
        for (let k = 0; k < L; k++) {
          if (grid[r + k][c] !== null) { ok = false; break; }
        }
        if (ok) possible.push({ row: r, col: c, dir: 'V' });
      }
    }

    if (possible.length === 0) {
      break;
    }

    const chosen = randomChoice(possible);
    if (chosen.dir === 'H') {
      for (let k = 0; k < L; k++) grid[chosen.row][chosen.col + k] = word[k];
    } else {
      for (let k = 0; k < L; k++) grid[chosen.row + k][chosen.col] = word[k];
    }
    placements.push({ word, row: chosen.row, col: chosen.col, dir: chosen.dir });
    placed++;
    if (onProgress) onProgress(placed / wordsSorted.length);
  }

  const allowedArr = [...allowed];
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (grid[r][c] === null) grid[r][c] = randomChoice(allowedArr);
    }
  }
  if (onProgress) onProgress(1);
  const rows = grid.map(row => row.join(''));
  return { grid: rows, placements, partial: placed < wordsSorted.length };
}
