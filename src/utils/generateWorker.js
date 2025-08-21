import generateWordSearchGrid from './MultiWordMatrixGenerator.js';

self.onmessage = (e) => {
  const { words, letters, width, height, options } = e.data;
  try {
    const result = generateWordSearchGrid(words, letters, width, height, {
      ...options,
      onProgress: (p) => self.postMessage({ type: 'progress', progress: p })
    });
    self.postMessage({ type: 'result', result });
  } catch (err) {
    self.postMessage({ type: 'error', message: err.message });
  }
};
