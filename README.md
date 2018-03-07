# rollup-plugin-polyfill
Rollup Plugin to include a polyfill in your bundle.
Literally injects a require or import statement in your bundle, which you can then use `rollup-plugin-node-resolve` to resolve.

## API
### `polyfill(file, packages)`
`file` is the module that the package will be prepended to.
`packages` is a list of modules to be resolved in your bundle.

## Usage
```javascript
const builtins = require('rollup-plugin-node-builtins')
const commonjs = require('rollup-plugin-commonjs')
const globals = require('rollup-plugin-node-globals')
const resolve = require('rollup-plugin-node-resolve')
const polyfill = require('rollup-plugin-polyfill')

const pkg = require('../package.json')

const plugins = [
  polyfill('tram-one.js', ['es6-object-assign/auto'], {
    method: 'import', // or 'commonjs'
  }),
  resolve({
    main: true,
    preferBuiltins: true,
    browser: true
  }),
  builtins(),
  commonjs(),
  globals(),
  builtins()
]

export default {
  input: 'tram-one.js',
  output: {
    file: pkg.main,
    format: 'umd'
  },
  plugins: plugins,
  name: 'tram-one'
}
```
