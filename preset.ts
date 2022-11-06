export default definePreset({
	name: 'hybridly',
	options: {
		// ...
	},
	handler: async() => {
		await extractTemplates()
		// ...
	},
})
