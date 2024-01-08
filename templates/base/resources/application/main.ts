import { initializeHybridly } from 'virtual:hybridly/config'
import { createHead, useHead } from '@unhead/vue'
import './tailwind.css'

initializeHybridly({
	enhanceVue: (vue) => {
		const head = createHead();
		head.push({
			titleTemplate: (title) => title ? `${title} — Hybridly` : 'Hybridly',
		});
		vue.use(head);
	},
})
