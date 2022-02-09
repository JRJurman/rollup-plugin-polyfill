const polyfill = require('../src/index')
const {nodeResolve} = require('@rollup/plugin-node-resolve')
const commonjs = require('@rollup/plugin-commonjs')

const plugins = [
  nodeResolve(),
  commonjs(),
  polyfill(['es6-object-assign/auto', './string-reverse.js']),
]

export default {
  input: 'index.js',
  output: {
    file: 'bundle.js',
    format: 'iife',
    name: 'example'
  },
  plugins: plugins
}
