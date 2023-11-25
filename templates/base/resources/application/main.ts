import { initializeHybridly } from 'virtual:hybridly/config'
import { createHead, useHead } from '@unhead/vue'
import './tailwind.css'

initializeHybridly({
	enhanceVue: (vue) => {
		vue.use(createHead()))
		
		useHead({
			titleTemplate: (title) => title ? `${title} — Hybridly` : 'Hybridly',
		}
	},
})
