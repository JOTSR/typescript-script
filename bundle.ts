import * as esbuild from 'https://deno.land/x/esbuild@v0.15.12/mod.js'

const devMode = Deno.args.includes('--dev')

const process = Deno.run({
	cmd: ['deno', 'bundle', './transpiler.ts', './transpiler.js'],
})

await process.status()

await esbuild.build({
	entryPoints: ['./transpiler.js'],
	bundle: true,
	minify: true,
	format: 'esm',
	write: true,
	allowOverwrite: true,
	outfile: './transpiler.js',
	target: ['chrome100', 'firefox100', 'edge100', 'safari15'],
	sourcemap: devMode,
})
esbuild.stop()
