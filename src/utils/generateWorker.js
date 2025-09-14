import generateWordSearchGrid from './MultiWordMatrixGenerator.js';
import generateFreeWordSearchGrid from './freeWordSearchGenerator.js';

self.onmessage = (e) => {
  const { words, letters, width, height, options } = e.data;
  const { encoding = 'free', ...rest } = options || {};
  try {
    const generator = encoding === 'intersections'
      ? generateWordSearchGrid
      : generateFreeWordSearchGrid;
    const result = generator(words, letters, width, height, {
      ...rest,
      onProgress: (p) => self.postMessage({ type: 'progress', progress: p })
    });
    self.postMessage({ type: 'result', result });
  } catch (err) {
    self.postMessage({ type: 'error', message: err.message });
  }
};
