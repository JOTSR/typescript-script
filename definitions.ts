import type { Config } from 'https://esm.sh/@swc/core@1.2.212/types.d.ts'
import { transform } from 'https://deno.land/x/swc@0.2.1/mod.ts'

export type { Config }

const allowedMimeTypes = [
	'text/typescript',
	'application/typescript',
	'text/x-typescript',
	'application/x-typescript',
	'video/mp2t',
]

export const cache = {
	_preffix: 'ts-script-tag',

	/* Setting the data in localStorage. */
	set(name: string, data: string) {
		localStorage.setItem(`${this._preffix}::${name}__${Date.now()}`, data)
	},

	/* A function that takes a string as a parameter and returns a string. */
	get(name: string): string | null {
		for (const entry in localStorage) {
			if (entry.includes(`${this._preffix}::${name}`)) {
				return localStorage.getItem(entry)!
			}
		}
		// throw new Error(`[localStorage] Unkwon name "${name}"`)
		return null
	},

	/**
	 * It removes all the items from localStorage that are older than 30 days.
	 * @param [lifetime=30] - The number of days to keep the data in localStorage.
	 */
	clean(lifetime = 30) {
		const now = Date.now()

		for (const entry in localStorage) {
			const timestamp = parseInt(entry.split('__')[1])
			if (timestamp + lifetime * 24 * 3_600 > now) {
				localStorage.removeItem(entry)
			}
		}
	},
}

/**
 * It fetches the content of a script tag, and returns the content and the ETag
 * @param {HTMLScriptElement} script - The script element to get the content of.
 * @returns An object with two properties: data and eTag.
 */
export async function getContent(
	script: HTMLScriptElement
): Promise<{ data: string; eTag: string; module: boolean }> {
	if (!isTypescript(script))
		throw new TypeError(`Incorrect mime type for ${script}`)
	const module = (script.dataset?.type ?? '') === 'module'
	const { data, eTag } = await getRawText(script)
	return { data, eTag, module }
}

/**
 * It fetches the script's source if it's not inline, and returns the text content and the ETag
 * @param {HTMLScriptElement} script - The script element to get the raw text from.
 * @returns An object with two properties: data and eTag.
 */
async function getRawText(
	script: HTMLScriptElement
): Promise<{ data: string; eTag: string }> {
	if (script.textContent !== '')
		return {
			data: script.textContent!,
			eTag: hashCode(script.textContent!),
		}
	const fetched = await fetch(script.src)
	const text = await fetched.text()
	return { data: text, eTag: fetched.headers.get('ETag') ?? hashCode(text) }
}

/**
 * It takes a TypeScript string, an eTag, and a config object, and returns a JavaScript string
 * @param {string} typescript - The TypeScript code to compile.
 * @param {string} eTag - The eTag of the file.
 * @param {Config} config - Config
 * @returns The function compileAndCache
 */
export function compileAndCache(
	typescript: string,
	eTag: string,
	config: Config
): string {
	const exists = cache.get(eTag)
	if (exists) return exists

	const { code: javascript } = transform(typescript, config)
	cache.set(eTag, javascript)

	return javascript
}

/**
 * Convert a string to a 32 bit hash code.
 * @param {string} string - The string to hash.
 * @returns A string of 7 characters, each character is a digit from 0 to 9 or a letter from a to z.
 */
export function hashCode(string: string): string {
	let hash = 0,
		i,
		chr
	if (string.length === 0) return hash.toString(32).padStart(7, '0')
	for (i = 0; i < string.length; i++) {
		chr = string.charCodeAt(i)
		hash = (hash << 5) - hash + chr
		hash |= 0
	}
	return hash.toString(32).padStart(7, '0')
}

/**
 * It creates a script element, sets its text content to the compiled JavaScript, and sets its type to
 * application/javascript
 * @param {string} js - The compiled JavaScript code.
 * @returns A function that takes a string and returns a script element.
 */
export function injectCompiled(js: string, module: boolean): HTMLScriptElement {
	const script = document.createElement('script')
	script.textContent = `/* Compiled locally */ ${js}`
	script.type = module ? 'module' : 'application/javascript'
	return script
}

/**
 * It gets the config from the script tag with the data-model attribute set to swc-transpiler-config
 * @returns The return type is Promise<Config | null>
 */
export async function getConfig(): Promise<Config | null> {
	const config = document.querySelector<HTMLScriptElement>(
		'script[data-model="swc-transpiler-config"]'
	)
	try {
		const json =
			JSON.parse(config?.textContent ?? '') ??
			(await (await fetch(config?.src ?? '')).json())
		return json as Config
	} catch {
		return null
	}
}

/**
 * It checks if the script is a typescript code, if it has a valid mime type, if it has a valid data URI, or
 * if it has a valid file extension
 * @param {HTMLScriptElement} script - The script element to check
 * @returns A function that returns a promise that resolves to a boolean.
 */
export async function isTypescript(
	script: HTMLScriptElement
): Promise<boolean> {
	try {
		if (script.tagName !== 'SCRIPT') return false
		if (allowedMimeTypes.includes(script.type)) return true
		if (
			script.src.match(RegExp(`^data:(${allowedMimeTypes.join('|')})`)) ||
			script.src.endsWith('.ts')
		)
			return true
		if (
			allowedMimeTypes.includes(
				(await fetch(script.src)).headers.get('content-type') ?? ''
			)
		)
			return true
		if (
			allowedMimeTypes.includes(
				(await fetch(script.src)).headers.get('Content-Type') ?? ''
			)
		)
			return true
	} catch {
		return false
	}
	return false
}
