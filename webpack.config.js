const { readFileSync } = require('fs');
const { resolve } = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  output: {
    path: resolve(__dirname, 'dist'),
    filename: 'tfinjs.js',
    library: 'tfinjs',
    libraryExport: 'default',
    libraryTarget: 'commonjs2',
  },
  externals: nodeExternals(),
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: JSON.parse(readFileSync(resolve(__dirname, '.babelrc'))),
        },
      },
    ],
  },
};
