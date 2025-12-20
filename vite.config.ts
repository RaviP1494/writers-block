import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import devtools from 'solid-devtools/vite';

export default defineConfig({
  plugins: [devtools(), solidPlugin()],
  server: {
    port: 3000,
    watch: {
      // THE DAVE RULE: Ignore Emacs backup files and lockfiles
      ignored: ['**/*~', '**/.#*', '**/!*'] 
    }
  },
  build: {
    target: 'esnext',
  },
});
