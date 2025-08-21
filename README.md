## Word Search Matrix

Generate customizable word search puzzles directly in the browser. You can control the grid size, font, and now the letter colors.

### Development

This project is built with React and Vite.
Run `npm run dev` to start the development server.

### Word generation

The word-search generator uses a backtracking algorithm. To keep the UI responsive it now stops after a configurable number of search iterations and returns the best grid found so far. You can adjust this limit by passing `maxIterations` to `generateWordSearchGrid`.
