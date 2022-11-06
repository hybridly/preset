import path from 'node:path'
import { defineConfig } from 'vite'
import laravel from 'laravel-vite-plugin'
import hybridly from 'hybridly/vite'
import vue from '@vitejs/plugin-vue'
import run from 'vite-plugin-run'

export default defineConfig({
	plugins: [
		laravel({
			input: 'resources/application/main.ts',
			// valetTls: true,
		}),
		run([
			{
				run: ['php', 'artisan', 'typescript:transform'],
				condition: (file) => ['Data.php', 'Enums/'].some((kw) => file.includes(kw)),
			},
		]),
		hybridly(),
		vue(),
	],
	resolve: {
		alias: {
			'@': path.join(process.cwd(), 'resources'),
		},
	},
})
