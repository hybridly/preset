import fs from 'node:fs'

interface Options {
	i18n: boolean
	pest: boolean
	strict: boolean
}

export default definePreset<Options>({
	name: 'laravel:hybridly',
	options: {
		i18n: false,
		pest: true,
		strict: true,
	},
	handler: async({ options }) => {
		if (options.pest && !fs.existsSync('tests/Pest.php')) {
			await applyNestedPreset({
				title: 'install Pest',
				preset: 'laravel-presets/pest',
			})
		}

		await installBase(options)

		if (options.i18n) {
			await group({
				title: 'install i18n',
				handler: async() => await installI18n(),
			})
		}

		if (options.strict) {
			await group({
				title: 'apply strict mode',
				handler: async() => await applyStrictMode(),
			})
		}
	},
})

async function installBase({ i18n }: Options) {
	await deletePaths({
		title: 'delete unused project files',
		paths: [
			'vite.config.js',
			'resources',
		],
	})

	await editFiles({
		title: 'update .gitignore',
		files: '.gitignore',
		operations: {
			type: 'add-line',
			position: 'append',
			lines: '.hybridly',
		},
	})

	await editFiles({
		title: 'update CreatesApplication.php',
		files: 'tests/CreatesApplication.php',
		operations: {
			type: 'add-line',
			position: 'after',
			match: /\$app->make\(Kernel::class\)/,
			lines: [
				'',
				'$this->afterApplicationCreated(function () {',
				'    $this->withoutVite();',
				'});',
			],
		},
	})

	await editFiles({
		title: 'update Kernel.php',
		files: 'app/Http/Kernel.php',
		operations: {
			type: 'add-line',
			match: /SubstituteBindings::class/,
			position: 'after',
			lines: [
				'\\App\\Http\\Middleware\\HandleHybridRequests::class',
			],
		},
	})

	await extractTemplates({
		title: 'extract templates',
		from: 'base',
	})

	await editFiles({
		title: 'remove unused dependencies',
		files: 'package.json',
		operations: {
			type: 'edit-json',
			delete: [
				'devDependencies.lodash',
				'devDependencies.laravel-vite-plugin',
			],
		},
	})

	await installPackages({
		title: 'add npm dependencies',
		for: 'node',
		dev: true,
		packages: [
			'hybridly',
			'axios',
			// Other
			'@types/node',
			'typescript',
			// Vue
			'vue',
			'@vue/runtime-core',
			'@vueuse/core',
			'@vueuse/head',
			// Tailwind CSS
			'autoprefixer',
			'tailwindcss',
			'postcss',
			'@tailwindcss/forms',
			// i18n
			...(i18n ? [
				'@intlify/unplugin-vue-i18n',
				'vue-i18n',
			] : []),
		],
	})

	await editFiles({
		title: 'configure PostCSS',
		files: 'package.json',
		operations: {
			type: 'edit-json',
			merge: {
				postcss: {
					plugins: {
						autoprefixer: {},
						tailwindcss: {},
					},
				},
			},
		},
	})

	await installPackages({
		title: 'add php dependencies',
		for: 'php',
		packages: [
			'hybridly/laravel:0.1.0-alpha.3',
			'spatie/laravel-data',
		],
	})

	await installPackages({
		title: 'add php dev dependencies',
		for: 'php',
		dev: true,
		packages: [
			'spatie/laravel-typescript-transformer',
		],
	})

	await executeCommand({
		title: 'publish typescript transformer config',
		command: 'php',
		arguments: ['artisan', 'vendor:publish', '--tag=typescript-transformer-config'],
	})

	await editFiles({
		title: 'update typescript transformer config',
		files: 'config/typescript-transformer.php',
		operations: [
			{
				type: 'remove-line',
				match: /Spatie\\TypeScriptTransformer\\Collectors\\DefaultCollector::class,/,
			},
			{
				type: 'add-line',
				match: /'collectors' => \[/,
				position: 'after',
				indent: '        ',
				lines: [
					'Hybridly\\Support\\TypeScriptTransformer\\DataResourceTypeScriptCollector::class,',
					'Spatie\\LaravelData\\Support\\TypeScriptTransformer\\DataTypeScriptCollector::class,',
					'Spatie\\TypeScriptTransformer\\Collectors\\EnumCollector::class,',
				],
			},
			{
				type: 'remove-line',
				match: /Spatie\\LaravelTypeScriptTransformer\\Transformers\\SpatieStateTransformer::class,/,
				count: 3,
			},
			{
				type: 'add-line',
				match: /'transformers' => \[/,
				position: 'after',
				indent: '        ',
				lines: [
					'Spatie\\LaravelData\\Support\\TypeScriptTransformer\\DataTypeScriptTransformer::class,',
					'Spatie\\TypeScriptTransformer\\Transformers\\EnumTransformer::class,',
				],
			},
		],
	})

	// Fixes view:cache
	await editFiles({
		title: 'update views config',
		files: 'config/view.php',
		operations: {
			type: 'update-content',
			update: (content) => content.replace('resource_path(\'views\')', 'resource_path()'),
		},
	})

	await editFiles({
		title: 'update welcome route',
		files: 'routes/web.php',
		operations: {
			type: 'update-content',
			update: (content) => content.replace('view(', 'hybridly('),
		},
	})
}

async function installI18n() {
	await extractTemplates({
		title: 'extract i18n scaffolding',
		from: 'i18n',
	})

	await editFiles({
		title: 'register Vue i18n plugin',
		files: 'resources/application/main.ts',
		operations: [
			// add import
			{
				type: 'add-line',
				match: /@vueuse\/head/,
				position: 'after',
				lines: "import i18n from './i18n'",
			},
			// add plugin
			{
				type: 'add-line',
				match: /vue\.use\(/,
				position: 'before',
				lines: 'vue.use(i18n)',
			},
		],
	})

	await editFiles({
		title: 'register Vite i18n plugin',
		files: 'vite.config.ts',
		operations: [
			// add import
			{
				type: 'add-line',
				match: /import run from 'vite-plugin-run'/,
				position: 'after',
				lines: "import i18n from '@intlify/unplugin-vue-i18n/vite'",
			},
			// add plugin
			{
				type: 'add-line',
				match: /vue\(/,
				position: 'after',
				lines: [
					'i18n({',
					"	include: path.resolve(__dirname, '.hybridly/locales.json'),",
					'}),',
				],
			},
			// add auto-imports
			{
				type: 'add-line',
				match: /laravel: {/,
				position: 'before',
				lines: [
					'autoImports: {',
					'	imports: [',
					'		{ \'@/application/i18n\': [\'t\', \'i18n\'] },',
					'	],',
					'},',
				],
			},
		],
	})
}

async function applyStrictMode() {
	await editFiles({
		files: 'app/Providers/AppServiceProvider.php',
		operations: [
			{
				type: 'add-line',
				match: /use Illuminate\\Support\\ServiceProvider;/,
				position: 'after',
				lines: [
					'use App\\Models\\User;',
					'use Carbon\\CarbonImmutable;',
					'use Illuminate\\Database\\Eloquent\\Model;',
					'use Illuminate\\Database\\Eloquent\\Relations\\Relation;',
					'use Illuminate\\Foundation\\Console\\CliDumper;',
					'use Illuminate\\Foundation\\Http\\HtmlDumper;',
					'use Illuminate\\Support\\Facades\\Date;',
					'use Illuminate\\Support\\Facades\\Validator;',
				],
			},
			{
				type: 'add-line',
				match: /public function boot\(\)/,
				position: 'after',
				lines: [
					'{',
					'    HtmlDumper::dontIncludeSource();',
					'    CliDumper::dontIncludeSource();',
					'',
					'    Validator::excludeUnvalidatedArrayKeys();',
					'    Model::shouldBeStrict();',
					'    Model::unguard();',
					'    Relation::enforceMorphMap([',
					"        'user' => User::class,",
					'    ]);',
					'    Date::use(CarbonImmutable::class);',
				],
			},
			{
				type: 'remove-line',
				match: /Date::use/,
				start: 1,
				count: 2,
			},
		],
	})
}
