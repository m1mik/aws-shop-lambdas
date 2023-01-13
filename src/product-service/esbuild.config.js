const ESBuild = require('esbuild');
const path = require('path');
const { nodeExternalsPlugin } = require('esbuild-node-externals');

ESBuild.build({
  platform: 'node',
  target: 'node16',
  external: ['./node_modules/*'],
  tsconfig: path.resolve('tsconfig.json'),
  bundle: true,
  format: 'cjs',
  mainFields: ['main'],
  outdir: path.resolve(__dirname, 'dist'),
  plugins: [
    nodeExternalsPlugin({
      packagePath: './package.json',
    }),
  ],
  entryPoints: {
    'handlers': path.resolve(__dirname, './handlers.ts'),
  },
});