import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite configuration: enables React (JSX + fast refresh) support.
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        // Put the big libraries in their own files. They rarely change, so the
        // browser can keep them cached when only our own code is updated.
        codeSplitting: {
          groups: [
            { name: 'three', test: /node_modules[\\/]three[\\/]/ },
            // `(?!postprocessing)`: @react-three/postprocessing goes in the effects group instead.
            { name: 'r3f', test: /node_modules[\\/](@react-three[\\/](?!postprocessing)|three-stdlib|camera-controls|maath)/ },
            // Post-processing (ambient occlusion, bloom, tone mapping).
            { name: 'effects', test: /node_modules[\\/](postprocessing|n8ao|@react-three[\\/]postprocessing)[\\/]/ },
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
          ],
        },
      },
    },
    // Three.js alone is ~700 kB before gzip (~180 kB gzipped), which is normal for a 3D app.
    chunkSizeWarningLimit: 800,
  },
})
