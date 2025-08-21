/**
 * Generate a word-search grid where each word appears exactly once
 * (or N times if duplicated in the input), readable left->right or top->bottom.
 * Letters are uppercased; the allowed letters set is deduped and auto-expanded
 * to include all letters from the words (if empty, it becomes exactly those letters).
 *
 * @param {string[]} words
 * @param {string[]} letters
 * @param {number} width
 * @param {number} height
 * @param {{ seed?: number|string, tieBreaker?: 'random'|'center', maxIterations?: number, onProgress?: (ratio:number)=>void }} [options]
 * @returns {{ grid: string[], placements: Array<{word:string,row:number,col:number,dir:'H'|'V'}>, partial?: boolean }}
 */
export function generateWordSearchGrid(words, letters, width, height, options = {}) {
  // ---- RNG (seedable) ----
  const rand = makeRNG(options.seed);
  function shuffleInPlace(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function randomChoice(arr) { return arr[Math.floor(rand() * arr.length)]; }

  // ---- Validation & normalization ----
  if (!Array.isArray(words)) throw new Error("words must be an array of strings.");
  if (!Array.isArray(letters)) throw new Error("letters must be an array of strings.");
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new Error("width and height must be positive integers.");
  }
  const cleanWords = words.map(w => String(w).trim().toUpperCase()).filter(w => w.length > 0);

  // Auto-expand letters from words, and dedupe
  const allowed = normalizeAndExpandLetters(letters, cleanWords);
  if (cleanWords.length === 0) {
    if (allowed.size === 0) throw new Error("No words and empty letters; nothing to fill the grid with.");
    const gridOnly = Array.from({ length: height }, () =>
        Array.from({ length: width }, () => randomChoice([...allowed])).join("")
    );
    return { grid: gridOnly, placements: [] };
  }

  const maxDim = Math.max(width, height);
  const longest = cleanWords.reduce((m, w) => Math.max(m, w.length), 0);
  if (longest > maxDim) {
    throw new Error(`The longest word length (${longest}) exceeds max(width, height) = ${maxDim}.`);
  }

  // multiplicities per unique word
  const requiredCount = new Map();
  for (const w of cleanWords) requiredCount.set(w, (requiredCount.get(w) || 0) + 1);

  // ---- Grid + bookkeeping ----
  const grid = Array.from({ length: height }, () => Array.from({ length: width }, () => null));
  const wordObjs = cleanWords
      .map((w, i) => ({ id: i, word: w, len: w.length }))
      .sort((a, b) => b.len - a.len); // longer first

  let best = null; // { placementsById, intersections, filledGridRows }
  const currentPlacements = new Map();
  let currentIntersections = 0;
  const maxIterations = options.maxIterations ?? 50000;
  const onProgress = options.onProgress;
  let iterations = 0;
  let cancelled = false;
  let bestPartial = null; // { placementsById, intersections, filledGridRows, placedCount }

  function recordPartial() {
    const placedCount = currentPlacements.size;
    if (
      !bestPartial ||
      placedCount > bestPartial.placedCount ||
      (placedCount === bestPartial.placedCount && currentIntersections > bestPartial.intersections)
    ) {
      const rows = grid.map(row => row.map(ch => ch ?? randomChoice([...allowed])).join(""));
      bestPartial = {
        placementsById: new Map(currentPlacements),
        intersections: currentIntersections,
        filledGridRows: rows,
        placedCount
      };
    }
  }

  // ---- Helpers ----
  function normalizeAndExpandLetters(lettersArr, wordsArr) {
    const s = new Set();
    for (const t of lettersArr) {
      const ch = String(t ?? "").toUpperCase();
      if (ch.length === 1) s.add(ch);
    }
    for (const w of wordsArr) for (const ch of w) s.add(ch);
    return s;
  }

  // Randomized tie-breaking inside equal-score placements
  function enumeratePlacements(word) {
    const L = word.length;
    const placements = [];

    // Horizontal
    for (let r = 0; r < height; r++) {
      for (let c = 0; c <= width - L; c++) {
        let ok = true, score = 0;
        for (let k = 0; k < L; k++) {
          const cell = grid[r][c + k];
          const ch = word[k];
          if (cell !== null && cell !== ch) { ok = false; break; }
          if (cell === ch) score++;
        }
        if (ok) placements.push({ row: r, col: c, dir: 'H', score });
      }
    }
    // Vertical (skip for L==1 to avoid H/V double-counting)
    if (L > 1) {
      for (let r = 0; r <= height - L; r++) {
        for (let c = 0; c < width; c++) {
          let ok = true, score = 0;
          for (let k = 0; k < L; k++) {
            const cell = grid[r + k][c];
            const ch = word[k];
            if (cell !== null && cell !== ch) { ok = false; break; }
            if (cell === ch) score++;
          }
          if (ok) placements.push({ row: r, col: c, dir: 'V', score });
        }
      }
    }

    // Add a tiebreak key per placement
    const centerR = (height - 1) / 2;
    const centerC = (width - 1) / 2;
    function distToCenter(p) {
      // center of the word's span
      const rr = p.dir === 'H' ? p.row : p.row + (L - 1) / 2;
      const cc = p.dir === 'H' ? p.col + (L - 1) / 2 : p.col;
      const dr = rr - centerR, dc = cc - centerC;
      return Math.hypot(dr, dc);
    }
    const tieMode = options.tieBreaker || 'random';
    for (const p of placements) {
      p._tie = tieMode === 'center' ? distToCenter(p) : rand(); // smaller is better
    }

    // Sort by: intersections desc, then tiebreak asc
    placements.sort((a, b) => (b.score - a.score) || (a._tie - b._tie));
    return placements;
  }

  function placeWord(word, p) {
    const newly = [];
    if (p.dir === 'H') {
      for (let k = 0; k < word.length; k++) {
        const r = p.row, c = p.col + k;
        if (grid[r][c] === null) { grid[r][c] = word[k]; newly.push([r, c]); }
      }
    } else {
      for (let k = 0; k < word.length; k++) {
        const r = p.row + k, c = p.col;
        if (grid[r][c] === null) { grid[r][c] = word[k]; newly.push([r, c]); }
      }
    }
    return newly;
  }
  function undo(newly) { for (const [r, c] of newly) grid[r][c] = null; }

  // Count forward-only occurrences of a word in the *current* grid (null breaks matches).
  function countOccurrencesStrictForWord(word) {
    const L = word.length;
    let count = 0;

    // Horizontal
    for (let r = 0; r < height; r++) {
      for (let c = 0; c <= width - L; c++) {
        let ok = true;
        for (let k = 0; k < L; k++) {
          if (grid[r][c + k] !== word[k]) { ok = false; break; }
        }
        if (ok) count++;
      }
    }
    // Vertical (skip if L==1)
    if (L > 1) {
      for (let r = 0; r <= height - L; r++) {
        for (let c = 0; c < width; c++) {
          let ok = true;
          for (let k = 0; k < L; k++) {
            if (grid[r + k][c] !== word[k]) { ok = false; break; }
          }
          if (ok) count++;
        }
      }
    }
    return count;
  }

  function countsWithinLimits() {
    const seen = new Set();
    for (const w of cleanWords) {
      if (seen.has(w)) continue;
      seen.add(w);
      const cnt = countOccurrencesStrictForWord(w);
      if (cnt > (requiredCount.get(w) || 0)) return false;
    }
    return true;
  }

  // Fill remaining cells without creating extra forward occurrences
  function fillEmptiesAvoidingExtras() {
    const empties = [];
    for (let r = 0; r < height; r++) for (let c = 0; c < width; c++) {
      if (grid[r][c] === null) empties.push([r, c]);
    }
    if (empties.length === 0) return { ok: true, changedCells: [] };

    const uniqueWords = [...new Set(cleanWords)];
    const wordsByLen = new Map();
    for (const w of uniqueWords) {
      const L = w.length;
      if (!wordsByLen.has(L)) wordsByLen.set(L, []);
      wordsByLen.get(L).push(w);
    }
    const lengths = [...wordsByLen.keys()];

    function windowsThroughCell(r, c, L) {
      const hStartMin = Math.max(0, c - (L - 1));
      const hStartMax = Math.min(c, width - L);
      const anyH = hStartMin <= hStartMax ? (hStartMax - hStartMin + 1) : 0;
      if (L === 1) return anyH;
      const vStartMin = Math.max(0, r - (L - 1));
      const vStartMax = Math.min(r, height - L);
      const anyV = vStartMin <= vStartMax ? (vStartMax - vStartMin + 1) : 0;
      return anyH + anyV;
    }
    // Most "dangerous" cells (participate in many windows) first
    empties.sort((a, b) => {
      const sa = lengths.reduce((acc, L) => acc + windowsThroughCell(a[0], a[1], L) * wordsByLen.get(L).length, 0);
      const sb = lengths.reduce((acc, L) => acc + windowsThroughCell(b[0], b[1], L) * wordsByLen.get(L).length, 0);
      return sb - sa;
    });

    const currentCounts = new Map();
    for (const w of uniqueWords) currentCounts.set(w, countOccurrencesStrictForWord(w));
    for (const w of uniqueWords) if (currentCounts.get(w) > requiredCount.get(w)) return { ok: false };

    const allowedArr = [...allowed];

    function countNewOccurrencesAtCell(word, r, c, ch) {
      const L = word.length;
      let inc = 0;

      // Horizontal windows including (r,c)
      const hStartMin = Math.max(0, c - (L - 1));
      const hStartMax = Math.min(c, width - L);
      for (let s = hStartMin; s <= hStartMax; s++) {
        const pos = c - s;
        if (word[pos] !== ch) continue;
        let ok = true;
        for (let k = 0; k < L; k++) {
          if (k === pos) continue;
          const cell = grid[r][s + k];
          if (cell !== word[k]) { ok = false; break; }
        }
        if (ok) inc++;
      }

      // Vertical (skip for L==1)
      if (L > 1) {
        const vStartMin = Math.max(0, r - (L - 1));
        const vStartMax = Math.min(r, height - L);
        for (let s = vStartMin; s <= vStartMax; s++) {
          const pos = r - s;
          if (word[pos] !== ch) continue;
          let ok = true;
          for (let k = 0; k < L; k++) {
            if (k === pos) continue;
            const cell = grid[s + k][c];
            if (cell !== word[k]) { ok = false; break; }
          }
          if (ok) inc++;
        }
      }
      return inc;
    }

    function tryFill(idx) {
      if (idx === empties.length) return true;
      const [r, c] = empties[idx];
      const lettersOrder = shuffleInPlace([...allowedArr]); // randomized per step

      for (const ch of lettersOrder) {
        if (grid[r][c] !== null) continue;
        let ok = true;
        const deltas = new Map();

        for (const [L, wordsOfLen] of wordsByLen) {
          // quick bound: if no window of this L goes through (r,c), skip
          const hasH = Math.max(0, c - (L - 1)) <= Math.min(c, width - L);
          const hasV = L === 1 ? false : (Math.max(0, r - (L - 1)) <= Math.min(r, height - L));
          if (!hasH && !hasV) continue;

          for (const w of wordsOfLen) {
            const inc = countNewOccurrencesAtCell(w, r, c, ch);
            if (inc === 0) continue;
            const next = (currentCounts.get(w) || 0) + (deltas.get(w) || 0) + inc;
            if (next > requiredCount.get(w)) { ok = false; break; }
            deltas.set(w, (deltas.get(w) || 0) + inc);
          }
          if (!ok) break;
        }
        if (!ok) continue;

        // commit
        grid[r][c] = ch;
        for (const [w, inc] of deltas.entries()) currentCounts.set(w, currentCounts.get(w) + inc);

        if (tryFill(idx + 1)) return true;

        // undo
        for (const [w, inc] of deltas.entries()) currentCounts.set(w, currentCounts.get(w) - inc);
        grid[r][c] = null;
      }
      return false;
    }

    const ok = tryFill(0);
    return { ok, changedCells: ok ? empties : undefined };
  }

  // ---- Backtracking search (aim for max intersections) ----
  function search(remaining) {
    if (cancelled) return;
    recordPartial();
    if (iterations++ > maxIterations) { cancelled = true; return; }
    if (onProgress && iterations % 1000 === 0) onProgress(iterations / maxIterations);
    if (remaining.length === 0) {
      // Ensure placed letters alone give exactly the required counts
      const uniq = new Set(cleanWords);
      for (const w of uniq) {
        if (countOccurrencesStrictForWord(w) !== requiredCount.get(w)) return;
      }
      const fill = fillEmptiesAvoidingExtras();
      if (!fill.ok) return;

      const rows = grid.map(row => row.join(""));
      const snapshot = new Map(currentPlacements);
      const record = { placementsById: snapshot, intersections: currentIntersections, filledGridRows: rows };
      if (!best || record.intersections > best.intersections) best = record;

      // undo filler to keep exploring
      if (fill.changedCells) for (const [r, c] of fill.changedCells) grid[r][c] = null;
      return;
    }

    // Choose next word (fail-fast): fewest placements, tie -> longer, tie -> higher max score
    let chosenIdx = -1, chosenPlacements = null;
    let minCount = Infinity, bestLen = -1, bestMaxScore = -1;

    for (let i = 0; i < remaining.length; i++) {
      const w = remaining[i];
      const plist = enumeratePlacements(w.word);
      if (plist.length === 0) return; // dead branch
      const maxScore = plist[0].score;
      if (
          plist.length < minCount ||
          (plist.length === minCount && w.len > bestLen) ||
          (plist.length === minCount && w.len === bestLen && maxScore > bestMaxScore)
      ) {
        minCount = plist.length; bestLen = w.len; bestMaxScore = maxScore;
        chosenIdx = i; chosenPlacements = plist;
      }
    }

    const chosen = remaining[chosenIdx];
    const rest = remaining.slice(0, chosenIdx).concat(remaining.slice(chosenIdx + 1));

    for (const p of chosenPlacements) {
      if (cancelled) return;
      const newly = placeWord(chosen.word, p);
      currentPlacements.set(chosen.id, { word: chosen.word, row: p.row, col: p.col, dir: p.dir, score: p.score });
      currentIntersections += p.score;

      if (countsWithinLimits()) search(rest);

      currentIntersections -= p.score;
      currentPlacements.delete(chosen.id);
      undo(newly);
      if (cancelled) return;
    }
  }

  search(wordObjs);
  if (best) {
    if (onProgress) onProgress(1);
    const placementsOut = [];
    for (const { id, word } of wordObjs) {
      const p = best.placementsById.get(id);
      placementsOut.push({ word, row: p.row, col: p.col, dir: p.dir });
    }
    return { grid: best.filledGridRows.slice(), placements: placementsOut, partial: false };
  }

  if (bestPartial) {
    if (onProgress) onProgress(1);
    const placementsOut = [];
    for (const p of bestPartial.placementsById.values()) {
      placementsOut.push({ word: p.word, row: p.row, col: p.col, dir: p.dir });
    }
    return { grid: bestPartial.filledGridRows.slice(), placements: placementsOut, partial: true };
  }

  const msg = cancelled
    ? `Unable to generate a valid grid within ${maxIterations} iterations.`
    : "Unable to generate a valid grid under the exactly-once constraint.";
  if (onProgress) onProgress(1);
  throw new Error(msg);

  // ---- tiny seedable RNG (mulberry32 via xmur3 hash) ----
  function makeRNG(seed) {
    if (seed === undefined || seed === null) return Math.random;
    const s = typeof seed === 'number' ? (seed >>> 0) : xmur3(String(seed))();
    const m = mulberry32(s);
    return () => m();
  }
  function xmur3(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return function() {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      h ^= h >>> 16;
      return h >>> 0;
    };
  }
  function mulberry32(a) {
    return function() {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
}

export default generateWordSearchGrid;
