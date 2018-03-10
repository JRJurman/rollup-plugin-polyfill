const polyfill = require('rollup-plugin-polyfill')

const plugins = [
  polyfill('index.js', ['./thing-to-polyfill'])
]

export default {
  input: 'index.js',
  output: {
    file: 'bundle.js',
    format: 'umd',
    name: 'example'
  },
  plugins: plugins
}
