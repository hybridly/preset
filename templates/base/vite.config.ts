import { defineConfig } from 'vite'
import hybridly from 'hybridly/vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
	plugins: [
    tailwindcss(),
		hybridly(),
	],
})
