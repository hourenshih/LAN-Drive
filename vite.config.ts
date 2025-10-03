import { defineConfig } from 'vite';
import { fsPlugin } from './vite.plugin.fs';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0', // This will expose the server on all network interfaces
  },
  plugins: [fsPlugin()],
});
