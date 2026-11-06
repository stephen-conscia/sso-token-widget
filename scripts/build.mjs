import * as esbuild from 'esbuild';
import { copyFile, mkdir } from 'node:fs/promises';

await mkdir('dist', { recursive: true });
await copyFile('index.html', 'dist/index.html');
const options = {
  entryPoints: ['src/widget.ts'],
  bundle: true,
  outfile: 'dist/sso-token-widget.js',
  format: 'iife',
  target: 'es2022',
  minify: true,
};
if (process.argv.includes('--serve')) {
  const context = await esbuild.context(options);
  await context.watch();
  const server = await context.serve({ servedir: 'dist', host: '127.0.0.1', port: 5173 });
  console.log(`Preview: http://127.0.0.1:${server.port} (Desktop SDK requires Webex Desktop)`);
} else {
  await esbuild.build(options);
}
