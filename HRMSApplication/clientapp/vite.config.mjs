import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'path';

export default defineConfig(({ mode }) => {
    const basePath = process.env.VITE_BASE_PATH || '/';

    return {
        plugins: [react()],
        base: basePath,
        build: {
            outDir: '../wwwroot',
            emptyOutDir: true,
            rollupOptions: {
                input: path.resolve(__dirname, 'index.html'),
                output: {
                    entryFileNames: 'static/js/main.js',
                    assetFileNames: (assetInfo) => {
                        if (assetInfo.name.endsWith('.css')) {
                            return 'static/css/style.css';
                        }
                        return 'static/assets/[name].[ext]';
                    }
                }
            }
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src')
            }
        }
    };
});
