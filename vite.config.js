import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: '.',
    emptyOutDir: false,
    rollupOptions: {
      // Always trace from the JS entry point — never from index.html —
      // so rebuilds don't pick up the previously-built bundle.
      input: { game: 'src/main.js' },
      output: {
        entryFileNames: 'assets/game.js',   // stable name — index.html never needs updating
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
});
