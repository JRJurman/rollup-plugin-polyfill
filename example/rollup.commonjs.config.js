const polyfill = require('../src/index')

const plugins = [
  polyfill(['./string-reverse.js']),
]

export default {
  input: 'index.js',
  output: {
    file: 'bundle.js',
    format: 'commonjs',
    name: 'example',
    strict: false
  },
  plugins: plugins
}
