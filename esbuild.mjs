import * as esbuild from 'esbuild'

const commonParameters = {
  entryPoints: ['src/js/index.ts'],
  platform: 'browser',
  bundle: true,
  loader: {
    '.png': 'dataurl',
    '.jpg': 'file',
    '.svg': 'base64'
  },
  target: 'es2020',
  outdir: 'build/',
};

await esbuild.build(Object.assign(commonParameters, {
  sourcemap: false,
  minify: true,
}))
