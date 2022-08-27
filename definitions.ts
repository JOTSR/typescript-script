import type { Config } from 'https://esm.sh/@swc/core@1.2.212/types.d.ts'
import { transform } from 'https://deno.land/x/swc@0.2.1/mod.ts'

export type { Config }

const allowedMimeTypes = ['text/typescript', 'application/typescript', 'text/x-typescript', 'application/x-typescript']

export const cache = {
    _preffix: 'ts-script-tag',

    /* Setting the data in localStorage. */
    set (name: string, data: string) {
        localStorage.setItem(`${this._preffix}::${name}__${Date.now()}`, data)
    },

    /* A function that takes a string as a parameter and returns a string. */
    get (name: string): string {
        for (const entry in localStorage) {
            if (entry.includes(`${this._preffix}::${name}`)) {
                return localStorage.getItem(entry)!
            }
        }
        throw new Error(`[localStorage] Unkwon name "${name}"`)
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
    }
}

/**
 * It fetches the content of a script tag, and returns the content and the ETag
 * @param {HTMLScriptElement} script - The script element to get the content of.
 * @returns An object with two properties: data and eTag.
 */
export async function getContent(script: HTMLScriptElement): Promise<{data: string, eTag: string}> {
    if (script.type !== '' && !allowedMimeTypes.includes(script.type)) throw new TypeError(`Incorrect mime type for ${script}`)
    if (script.textContent !== '') return { data: script.textContent!, eTag: hashCode(script.textContent!) }
    const fetched = await fetch(script.src)
    if (!allowedMimeTypes.includes(fetched.headers.get('Content-Type') ?? '')) throw new TypeError(`Incorrect mime type for ${fetched}`)
    const text = await fetched.text()
    return { data: text, eTag: fetched.headers.get('ETag') ?? hashCode(text)}
}

/**
 * It takes a TypeScript string, an eTag, and a config object, and returns a JavaScript string
 * @param {string} typescript - The TypeScript code to compile.
 * @param {string} eTag - The eTag of the file.
 * @param {Config} config - Config
 * @returns The function compileAndCache
 */
export function compileAndCache(typescript: string, eTag: string, config: Config): string {
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
    let hash = 0, i, chr
    if (string.length === 0) return hash.toString(32).padStart(7, '0')
    for (i = 0; i < string.length; i++) {
        chr   = string.charCodeAt(i)
        hash  = ((hash << 5) - hash) + chr
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
export function injectCompiled(js: string): HTMLScriptElement {
    const script = document.createElement('script')
    script.textContent = `/* Compiled locally */ ${js}`
    script.type = 'application/javascript'
    return script
}

/**
 * It gets the config from the script tag with the data-model attribute set to swc-transpiler-config
 * @returns The return type is Promise<Config | null>
 */
export async function getConfig(): Promise<Config | null> {
    const config = document.querySelector<HTMLScriptElement>('script[data-model="swc-transpiler-config"]')
    const json = config?.textContent ?? await (await fetch(config?.src ?? '')).text()
    return json as Config
}