import fs from 'node:fs'

interface Options {
	i18n: boolean
	pest: boolean
	strict: boolean
	ide: boolean
}

export default definePreset<Options>({
	name: 'laravel:hybridly',
	options: {
		i18n: false,
		pest: true,
		strict: true,
		ide: true,
	},
	handler: async ({ options }) => {
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
				handler: async () => await installI18n(),
			})
		}

		if (options.strict) {
			await group({
				title: 'apply strict mode',
				handler: async () => await applyStrictMode(),
			})
		}

		if (options.ide) {
			await group({
				title: 'setup ide helper',
				handler: async () => await applyIdeHelper(),
			})
		}
	},
})

async function installBase({ i18n, ide }: Options) {
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
		operations: [
			{
				type: 'add-line',
				position: 'append',
				lines: '.hybridly',
			},
			...(ide
				? [{
						type: 'add-line' as const,
						position: 'append' as const,
						lines: ['_ide_helper*', '.phpstorm.meta.php'],
					}]
				: []),
		],
	})

	await editFiles({
		title: 'add middleware',
		files: 'bootstrap/app.php',
		operations: [
			{
				type: 'remove-line',
				match: /\/\//,
			},
			{
				type: 'add-line',
				match: /->withMiddleware/,
				position: 'after',
				indent: 8,
				lines: [
					'$middleware->appendToGroup(\'web\', [\\App\\Http\\Middleware\\HandleHybridRequests::class]);',
				],
			},
		],
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
			'@unhead/vue',
			// Tailwind CSS
			'autoprefixer',
			'tailwindcss',
			'postcss',
			'@tailwindcss/forms',
			// i18n
			...(i18n
				? [
						'@intlify/unplugin-vue-i18n',
						'vue-i18n',
					]
				: []),
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
			'hybridly/laravel',
			'spatie/laravel-data',
		],
		additionalArgs: ['-W'],
	})

	await installPackages({
		title: 'add php dev dependencies',
		for: 'php',
		dev: true,
		packages: [
			'spatie/laravel-typescript-transformer',
			...(ide ? ['barryvdh/laravel-ide-helper'] : []),
		],
		additionalArgs: ['-W'],
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
				match: /@unhead\/vue/,
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
				position: 'before',
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

async function applyIdeHelper() {
	await editFiles({
		title: 'add ide helper scripts',
		files: 'composer.json',
		operations: [
			{
				type: 'edit-json',
				delete: 'scripts',
			},
			{
				type: 'edit-json',
				merge: {
					scripts: {
						'test': 'pest',
						'lint': 'php-cs-fixer fix --allow-risky=yes --dry-run',
						'lint:fix': 'php-cs-fixer fix --allow-risky=yes',
						'post-update-cmd': '@php artisan vendor:publish --tag=laravel-assets --ansi --force',
						'post-root-package-install': "@php -r \"file_exists('.env') || copy('.env.example', '.env');\"",
						'post-autoload-dump': [
							'Illuminate\\Foundation\\ComposerScripts::postAutoloadDump',
							'@php artisan package:discover --ansi',
							'([ $COMPOSER_DEV_MODE -eq 1 ] && composer autocomplete) || true',
						],
						'autocomplete': [
							'@php artisan ide-helper:eloquent || true',
							'@php artisan ide-helper:generate || true',
							'@php artisan ide-helper:meta || true',
							'@php artisan ide-helper:models -M || true',
						],
					},
				},
			},
		],
	})

	await executeCommand({
		title: 'generate ide helpers',
		command: 'composer',
		arguments: ['autocomplete'],
		ignoreExitCode: true,
	})
}
