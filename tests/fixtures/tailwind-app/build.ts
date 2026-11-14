import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { build } from 'vite'

const root = fileURLToPath(new URL('.', import.meta.url))

/**
 * Builds the app, a page on Tailwind CSS v4 that imports the system's entry by the package's
 * name, as an app does. It reads dist/, so build the package first.
 */
export async function buildTailwindApp(outDir: string): Promise<void> {
  await build({
    root,
    configFile: false,
    logLevel: 'error',
    plugins: [tailwindcss()],
    build: { outDir, emptyOutDir: true },
  })
}
