# rollup-plugin-polyfill
Rollup Plugin to include a polyfill in your bundle.
Literally injects a require or import statement in the beginning of your entry files.
This is useful if you only want to include certain logic in some variants of
your build.

## API
### `polyfill(packages[, options])`
* `packages` is a list of modules to be resolved in your bundle.
* `options` (optional) is an object that includes different configurations:
  * `method` can either be `'require'` or `'import'`, and determines if a require
statement or import statement should be prepended to the file. By default
it is import.
_(If you use commonjs, you'll need to resolve require statments
in the build)_

## Usage
Check out the example folder to see more configurations
```javascript
const polyfill = require('rollup-plugin-polyfill')
const resolve = require('rollup-plugin-node-resolve')
const commonjs = require('rollup-plugin-commonjs')

const plugins = [
  resolve(),
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
```
