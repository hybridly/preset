/** @type import('tailwindcss').Config */
module.exports = {
	content: [
		'./resources/**/*.{js,ts,vue,blade.php}',
	],
	theme: {
		extend: {},
	},
	plugins: [
		require('@tailwindcss/forms'),
	],
}
