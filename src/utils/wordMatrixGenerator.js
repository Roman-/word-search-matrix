/**
 * Generate a 2D grid of letters containing exactly one occurrence of `word`
 * (left-to-right or top-to-bottom), and every cell is a letter from `word`.
 *
 * @param {number} width
 * @param {number} height
 * @param {string} word - the word to hide (case-sensitive)
 * @param {Object} [opts]
 * @param {'H'|'V'|'random'} [opts.orientation='random'] - force horizontal, vertical, or random
 * @param {number} [opts.maxAttempts=500] - max tries over different placements
 * @param {number} [opts.seed] - optional seed for reproducibility
 * @returns {string[][]} grid of single-character strings
 * @throws if impossible to construct
 */
export function generateUniqueWordGrid(width, height, word, opts = {}) {
  if (!Number.isInteger(width) || width <= 0 ||
      !Number.isInteger(height) || height <= 0) {
    throw new Error("width and height must be positive integers.");
  }
  if (typeof word !== "string" || word.length === 0) {
    throw new Error("word must be a non-empty string.");
  }

  const L = word.length;
  const orientationPref = opts.orientation || 'random';
  const maxAttempts = opts.maxAttempts ?? 500;

  // Seedable RNG for stable output when you want it
  const rng = (() => {
    if (typeof opts.seed !== "number") return Math.random;
    // Mulberry32
    let t = opts.seed >>> 0;
    return function() {
      t += 0x6D2B79F5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  })();

  // Basic feasibility: at least one direction must fit.
  const fitsH = width >= L;
  const fitsV = height >= L;
  if (!fitsH && !fitsV) {
    throw new Error(`Grid too small to place "${word}" horizontally or vertically.`);
  }

  // Special-case: single unique letter is only solvable in 1×L or L×1,
  // otherwise duplicates are unavoidable.
  const uniqueLetters = [...new Set([...word])];
  if (uniqueLetters.length === 1) {
    if ((width === L && height === 1) || (width === 1 && height === L)) {
      // trivial: fill all with that letter (exactly one occurrence)
      const ch = uniqueLetters[0];
      const grid = Array.from({ length: height }, () => Array(width).fill(ch));
      return grid;
    }
    throw new Error(
      `The word "${word}" has only one unique letter. A unique placement is only possible on a ${L}×1 or 1×${L} grid.`
    );
  }

  // Helper utils
  const inBounds = (i, j) => i >= 0 && i < height && j >= 0 && j < width;
  const letters = uniqueLetters.slice();
  // Bias: avoid using word[0] unless needed—it helps prevent accidental starts.
  const preferredLetters = letters.filter(ch => ch !== word[0]).concat(letters.includes(word[0]) ? [word[0]] : []);

  function shuffle(arr) {
    const a = arr.slice();
    for (let k = a.length - 1; k > 0; k--) {
      const r = Math.floor(rng() * (k + 1));
      [a[k], a[r]] = [a[r], a[k]];
    }
    return a;
  }

  // Build every valid placement, then randomize the order we try them
  const placements = [];
  const wantH = orientationPref === 'H' || (orientationPref === 'random' && fitsH);
  const wantV = orientationPref === 'V' || (orientationPref === 'random' && fitsV);

  if (wantH && fitsH) {
    for (let i = 0; i < height; i++) {
      for (let j = 0; j <= width - L; j++) placements.push({ dir: 'H', i, j });
    }
  }
  if (wantV && fitsV) {
    for (let i = 0; i <= height - L; i++) {
      for (let j = 0; j < width; j++) placements.push({ dir: 'V', i, j });
    }
  }

  if (placements.length === 0) {
    throw new Error("No valid placements match the requested orientation.");
  }

  const shuffledPlacements = shuffle(placements);

  // Core checkers
  function segmentEqualsWord(grid, si, sj, dir) {
    for (let k = 0; k < L; k++) {
      const ii = dir === 'H' ? si : si + k;
      const jj = dir === 'H' ? sj + k : sj;
      if (!inBounds(ii, jj)) return false;
      const cell = grid[ii][jj];
      if (cell == null || cell !== word[k]) return false;
    }
    return true;
  }

  function countOccurrences(grid) {
    let count = 0;
    // Horizontal
    for (let i = 0; i < height; i++) {
      for (let j = 0; j <= width - L; j++) {
        if (segmentEqualsWord(grid, i, j, 'H')) count++;
      }
    }
    // Vertical
    for (let i = 0; i <= height - L; i++) {
      for (let j = 0; j < width; j++) {
        if (segmentEqualsWord(grid, i, j, 'V')) count++;
      }
    }
    return count;
  }

  function isPlacedStart(si, sj, dir, placement) {
    return placement.dir === dir && placement.i === si && placement.j === sj;
  }

  function createsUnwantedOccurrence(grid, i, j, placement) {
    // Check any complete horizontal segment that ends at (i,j)
    for (let start = j - (L - 1); start <= j; start++) {
      if (start < 0 || start + L - 1 >= width) continue;
      let complete = true;
      for (let k = 0; k < L; k++) {
        const cell = grid[i][start + k];
        if (cell == null) { complete = false; break; }
      }
      if (complete) {
        if (segmentEqualsWord(grid, i, start, 'H') && !isPlacedStart(i, start, 'H', placement)) {
          return true;
        }
      }
    }
    // Check any complete vertical segment that ends at (i,j)
    for (let start = i - (L - 1); start <= i; start++) {
      if (start < 0 || start + L - 1 >= height) continue;
      let complete = true;
      for (let k = 0; k < L; k++) {
        const cell = grid[start + k][j];
        if (cell == null) { complete = false; break; }
      }
      if (complete) {
        if (segmentEqualsWord(grid, start, j, 'V') && !isPlacedStart(start, j, 'V', placement)) {
          return true;
        }
      }
    }
    return false;
  }

  // Try different placements, backtracking-fill each time
  let attempts = 0;
  for (const placement of shuffledPlacements) {
    attempts++;
    if (attempts > maxAttempts) break;

    // Start with empty grid
    const grid = Array.from({ length: height }, () => Array(width).fill(null));

    // Place the word
    if (placement.dir === 'H') {
      for (let k = 0; k < L; k++) grid[placement.i][placement.j + k] = word[k];
    } else {
      for (let k = 0; k < L; k++) grid[placement.i + k][placement.j] = word[k];
    }

    // Build variable cell list (everything not already set)
    const vars = [];
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        if (grid[i][j] == null) vars.push([i, j]);
      }
    }

    // Heuristic: prioritize cells near placed word to prune sooner
    vars.sort((a, b) => {
      const da = Math.abs(a[0] - placement.i) + Math.abs(a[1] - placement.j);
      const db = Math.abs(b[0] - placement.i) + Math.abs(b[1] - placement.j);
      return da - db;
    });

    // Backtracking
    let solved = false;
    const letterOrders = preferredLetters.slice(); // reuse order

    (function fill(idx) {
      if (idx === vars.length) {
        // Final safety: exactly 1 occurrence overall
        solved = countOccurrences(grid) === 1;
        return;
      }
      const [i, j] = vars[idx];
      // Try letters in a lightly shuffled order to add variability
      const order = shuffle(letterOrders);
      for (const ch of order) {
        grid[i][j] = ch;
        if (!createsUnwantedOccurrence(grid, i, j, placement)) {
          fill(idx + 1);
          if (solved) return;
        }
        grid[i][j] = null; // backtrack
      }
    })(0);

    if (solved) {
      return grid.map(row => row.map(c => c ?? letters[0])); // all filled, but just in case
    }
  }

  throw new Error(`Couldn't build a unique grid for "${word}" at ${width}×${height}. Try a different size, word, or increase maxAttempts.`);
}

export default generateUniqueWordGrid;
