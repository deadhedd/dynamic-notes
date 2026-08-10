import esbuild from 'esbuild';

const production = process.argv[2] === 'production';

const context = await esbuild.context({
	entryPoints: ['src/main.ts'],
	bundle: true,
	external: ['obsidian'],
	format: 'cjs',
	target: 'es2021',
	logLevel: 'info',
	sourcemap: production ? false : 'inline',
	treeShaking: true,
	minify: production,
	outfile: 'main.js',
});

if (production) {
	await context.rebuild();
	process.exit(0);
}

await context.watch();
