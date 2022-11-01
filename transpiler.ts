import {
	cache,
	compileAndCache,
	Config,
	getConfig,
	getContent,
	hashCode,
	injectCompiled,
	isTypescript,
} from './definitions.ts'

const scripts = document.querySelectorAll<HTMLScriptElement>('script')

const config: Config = (await getConfig()) ?? {
	jsc: {
		target: 'es2022',
		parser: {
			syntax: 'typescript',
		},
	},
	minify: true,
	sourceMaps: true,
	module: {
		type: 'es6',
	},
}

const configEtag = hashCode(JSON.stringify(config))

cache.clean()

for (const script of scripts) {
	if (!(await isTypescript(script))) continue
	try {
		const { data, eTag, module } = await getContent(script)
		const compiled = compileAndCache(data, eTag + configEtag, config)
		const jsBalise = injectCompiled(compiled, module)
		document.body.appendChild(jsBalise)
	} catch (e) {
		//Unresolved script
		console.warn(`script ${script.src} was not transpiled, { cause: ${e} }`)
	}
}
