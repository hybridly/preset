import { initializeHybridly } from 'virtual:hybridly/config'
import { createHead } from '@unhead/vue'
import './tailwind.css'

initializeHybridly({
	enhanceVue: (vue) => {
		vue.use(createHead({
			titleTemplate: (title) => title ? `${title} — Hybridly` : 'Hybridly',
		}))
	},
})
