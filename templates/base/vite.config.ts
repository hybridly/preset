import { defineConfig } from 'vite'
import hybridly from 'hybridly/vite'

export default defineConfig({
	plugins: [
		hybridly({
			laravel: {
				// valetTls: true,
			},
		}),
	],
})
