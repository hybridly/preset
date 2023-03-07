import { createI18n } from 'vue-i18n'
import messages from '#/locales.json'

export type MessageSchema = typeof messages['en']

declare module 'vue-i18n' {
	export interface DefineLocaleMessage extends MessageSchema {}
}

const i18n = createI18n<[MessageSchema], 'en'>({
	locale: 'en',
	messages,
})

const { t } = i18n.global
export { t }

export default i18n
