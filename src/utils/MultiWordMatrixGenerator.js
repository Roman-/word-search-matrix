/**
 * Generate a word-search grid where each word appears exactly once
 * (or exactly N times if it occurs N times in the input), readable
 * only left->right or top->bottom. No accidental extra copies.
 *
 * Letters set is normalized to unique uppercase single chars and
 * expanded to include all letters used by the words.
 *
 * @param {string[]} words   Words to hide.
 * @param {string[]} letters Allowed letters (single chars). Can be empty; missing letters are auto-added.
 * @param {number} width     Grid width (columns).
 * @param {number} height    Grid height (rows).
 * @returns {{
 *   grid: string[],   // array of row strings
 *   placements: Array<{word:string,row:number,col:number,dir:'H'|'V'}>
 * }}
 * @throws Error when impossible (e.g., longest word too long, or constraints make a grid impossible).
 *
 * Notes:
 * - Case-insensitive: everything is uppercased internally.
 * - “Exactly once” means: for each UNIQUE word text in the input,
 *   the total # of forward (H/V) occurrences in the final grid equals
 *   its multiplicity in the input. (No extras.)
 * - Words are placed left->right or top->bottom. (No diagonals, no backwards.)
 * - Single-letter words are handled carefully to avoid double-counting H vs V.
 */
function generateWordSearchGrid(words, letters, width, height) {
  // --------- Validation & normalization ---------
  if (!Array.isArray(words)) throw new Error("words must be an array of strings.");
  if (!Array.isArray(letters)) throw new Error("letters must be an array of strings.");
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new Error("width and height must be positive integers.");
  }

  const cleanWords = words
      .map(w => String(w).trim().toUpperCase())
      .filter(w => w.length > 0);

  // Build letters set from input + words (auto-expand) and dedupe
  const allowed = normalizeAndExpandLetters(letters, cleanWords);
  if (cleanWords.length === 0) {
    if (allowed.size === 0) {
      throw new Error("No words and empty letters; nothing to fill the grid with.");
    }
    // No words to place: just fill with random allowed letters
    const grid = Array.from({ length: height }, () =>
        Array.from({ length: width }, () => randomFromSet(allowed)).join("")
    );
    return { grid, placements: [] };
  }

  // Longest word must fit into at least one dimension
  const maxDim = Math.max(width, height);
  const longest = cleanWords.reduce((m, w) => Math.max(m, w.length), 0);
  if (longest > maxDim) {
    throw new Error(`The longest word length (${longest}) exceeds max(width, height) = ${maxDim}.`);
  }

  // Count required multiplicities per unique word
  const requiredCount = new Map();
  for (const w of cleanWords) requiredCount.set(w, (requiredCount.get(w) || 0) + 1);

  // --------- Grid + bookkeeping ---------
  const grid = Array.from({ length: height }, () => Array.from({ length: width }, () => null));
  const wordObjs = cleanWords
      .map((w, i) => ({ id: i, word: w, len: w.length }))
      .sort((a, b) => b.len - a.len); // longer first for better pruning

  // Store best full solution we can find (max intersections)
  let best = null; // { placementsById: Map, intersections: number, filledGridRows: string[] }
  const currentPlacements = new Map(); // id -> {row,col,dir,score}
  let currentIntersections = 0;

  // --------- Helpers ---------
  function normalizeAndExpandLetters(lettersArr, wordsArr) {
    const s = new Set();
    for (const t of lettersArr) {
      const ch = String(t ?? "").toUpperCase();
      if (ch.length === 1) s.add(ch);
    }
    // Expand by letters appearing in the words
    for (const w of wordsArr) for (const ch of w) s.add(ch);
    return s;
  }
  function randomFromSet(s) { const a = [...s]; return a[Math.floor(Math.random() * a.length)]; }
  function shuffled(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function enumeratePlacements(word) {
    const L = word.length;
    const placements = [];

    // Horizontal (left->right)
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

    // Vertical (top->bottom) — but skip for single-letter words to avoid H/V double-counting traps
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

    // Prefer more intersections
    placements.sort((a, b) => b.score - a.score);
    return placements;
  }

  function placeWord(word, p) {
    const newly = [];
    if (p.dir === 'H') {
      for (let k = 0; k < word.length; k++) {
        const r = p.row, c = p.col + k;
        if (grid[r][c] === null) { grid[r][c] = word[k]; newly.push([r, c]); }
      }
    } else { // 'V'
      for (let k = 0; k < word.length; k++) {
        const r = p.row + k, c = p.col;
        if (grid[r][c] === null) { grid[r][c] = word[k]; newly.push([r, c]); }
      }
    }
    return newly;
  }
  function undo(newly) {
    for (const [r, c] of newly) grid[r][c] = null;
  }

  // Count forward (H/V) occurrences of a given word using only known letters (null breaks matches)
  // Special: for length==1, we ONLY count horizontal to avoid H/V double-counting the same cell.
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

  // Quick sanity check after each placement: no unique word exceeds its required count already.
  function countsWithinLimits() {
    // Deduplicate list of unique words to check
    const seen = new Set();
    for (const w of cleanWords) {
      if (seen.has(w)) continue;
      seen.add(w);
      const cnt = countOccurrencesStrictForWord(w);
      if (cnt > (requiredCount.get(w) || 0)) return false;
    }
    return true;
  }

  // Try to fill remaining null cells with letters without creating extra occurrences.
  // Returns {ok:boolean, changedCells?:Array<[r,c]>} where changedCells are the filled cells.
  function fillEmptiesAvoidingExtras() {
    const empties = [];
    for (let r = 0; r < height; r++) for (let c = 0; c < width; c++) {
      if (grid[r][c] === null) empties.push([r, c]);
    }
    if (empties.length === 0) return { ok: true, changedCells: [] };

    // Precompute lengths and how many unique words per length (for ordering heuristic)
    const uniqueWords = [...new Set(cleanWords)];
    const wordsByLen = new Map();
    for (const w of uniqueWords) {
      const L = w.length;
      if (!wordsByLen.has(L)) wordsByLen.set(L, []);
      wordsByLen.get(L).push(w);
    }
    const lengths = [...wordsByLen.keys()];

    // Order empties by "danger" (# of potential windows it participates in, weighted by #words of that length).
    function windowsThroughCell(r, c, L) {
      const minStartH = Math.max(0, c - (L - 1));
      const maxStartH = Math.min(c, width - L);
      const countH = Math.max(0, maxStartH - minStartH + 1);
      const minStartV = Math.max(0, r - (L - 1));
      const maxStartV = Math.min(r, height - L);
      const countV = L === 1 ? 0 : Math.max(0, maxStartV - minStartV + 1); // no V for L=1
      return countH + countV;
    }
    empties.sort((a, b) => {
      const sa = lengths.reduce((acc, L) => acc + windowsThroughCell(a[0], a[1], L) * wordsByLen.get(L).length, 0);
      const sb = lengths.reduce((acc, L) => acc + windowsThroughCell(b[0], b[1], L) * wordsByLen.get(L).length, 0);
      return sb - sa; // most constrained first
    });

    // Current strict counts per unique word (from placed words only)
    const currentCounts = new Map();
    for (const w of uniqueWords) currentCounts.set(w, countOccurrencesStrictForWord(w));

    // Shortcut: if any word is already over its required count, fail (shouldn't happen here)
    for (const w of uniqueWords) {
      if (currentCounts.get(w) > requiredCount.get(w)) return { ok: false };
    }

    const allowedArr = [...allowed];

    function countNewOccurrencesAtCell(word, r, c, ch) {
      const L = word.length;
      let inc = 0;

      // Horizontal windows that include (r,c)
      let minStart = Math.max(0, c - (L - 1));
      let maxStart = Math.min(c, width - L);
      for (let s = minStart; s <= maxStart; s++) {
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

      // Vertical (skip for L==1 to keep single-letter counting consistent)
      if (L > 1) {
        minStart = Math.max(0, r - (L - 1));
        maxStart = Math.min(r, height - L);
        for (let s = minStart; s <= maxStart; s++) {
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
      const lettersOrder = shuffled(allowedArr);

      for (const ch of lettersOrder) {
        if (grid[r][c] !== null) continue; // safety
        let ok = true;

        // track per-word increments caused by placing ch at (r,c)
        const deltas = new Map();

        for (const [L, wordsOfLen] of wordsByLen) {
          // Quick bound: if no window of this L passes through (r,c), skip
          const hasWindows =
              (c - (L - 1) <= c && c <= Math.min(c, width - L)) ||
              (L === 1 ? false : (r - (L - 1) <= r && r <= Math.min(r, height - L)));
          if (!hasWindows) continue;

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

  // --------- Backtracking search for placements (max intersections) ---------
  function search(remaining) {
    if (remaining.length === 0) {
      // All words placed: ensure placed letters alone haven't already created extra copies
      const uniqueSet = new Set(cleanWords);
      for (const w of uniqueSet) {
        const cnt = countOccurrencesStrictForWord(w);
        if (cnt !== requiredCount.get(w)) {
          return; // either less (shouldn't happen) or more (dup formed by placed letters)
        }
      }

      // Fill remaining cells so we don't create extra occurrences
      const fill = fillEmptiesAvoidingExtras();
      if (!fill.ok) return;

      // Snapshot result
      const rows = grid.map(row => row.join(""));
      const snapshot = new Map(currentPlacements);
      const record = { placementsById: snapshot, intersections: currentIntersections, filledGridRows: rows };

      if (!best || record.intersections > best.intersections) {
        best = record;
      }

      // Undo the filler so other branches can try different layouts
      if (fill.changedCells) {
        for (const [r, c] of fill.changedCells) grid[r][c] = null;
      }
      return;
    }

    // Choose the next word with the fewest valid placements (fail-fast),
    // tie-break by longer word (more constraining), then by max placement score.
    let chosenIdx = -1;
    let chosenPlacements = null;
    let minCount = Infinity;
    let bestLen = -1;
    let bestMaxScore = -1;

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
        minCount = plist.length;
        bestLen = w.len;
        bestMaxScore = maxScore;
        chosenIdx = i;
        chosenPlacements = plist;
      }
    }

    const chosen = remaining[chosenIdx];
    const rest = remaining.slice(0, chosenIdx).concat(remaining.slice(chosenIdx + 1));

    for (const p of chosenPlacements) {
      const newly = placeWord(chosen.word, p);
      currentPlacements.set(chosen.id, { word: chosen.word, row: p.row, col: p.col, dir: p.dir, score: p.score });
      currentIntersections += p.score;

      // Prune if any unique word already exceeds its required count
      if (countsWithinLimits()) {
        search(rest);
      }

      currentIntersections -= p.score;
      currentPlacements.delete(chosen.id);
      undo(newly);
    }
  }

  search(wordObjs);

  if (!best) {
    throw new Error("Unable to generate a valid grid with the provided words/letters/dimensions under the exactly-once constraint.");
  }

  // Build final return from the best solution
  // First, clear grid and re-apply the best placements
  for (let r = 0; r < height; r++) for (let c = 0; c < width; c++) grid[r][c] = null;

  const placementsOut = [];
  // Reapply placements in the wordObjs order (sorted) using best.placementsById
  for (const { id, word } of wordObjs) {
    const p = best.placementsById.get(id);
    if (!p) throw new Error("Internal error: best solution incomplete.");
    placeWord(word, p);
    placementsOut.push({ word, row: p.row, col: p.col, dir: p.dir });
  }

  // Fill empties again following the same rules (deterministic feasibility)
  const fillFinal = fillEmptiesAvoidingExtras();
  if (!fillFinal.ok) {
    // Extremely unlikely given we succeeded during search, but be safe:
    throw new Error("Internal error: failed to finalize grid fill without duplicates.");
  }

  const gridRows = grid.map(row => row.join(""));
  return { grid: gridRows, placements: placementsOut };
}
