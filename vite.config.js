import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './src', // muito importante! garante paths relativos
  plugins: [react()],
});
