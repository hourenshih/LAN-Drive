import { defineConfig } from 'vite';
import { fsPlugin } from './vite.plugin.fs';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: true, // This will expose the server on all network interfaces
  },
  plugins: [fsPlugin()],
});
