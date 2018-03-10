# rollup-plugin-polyfill
Rollup Plugin to include a polyfill in your bundle.
Literally injects a require or import statement in your bundle.
This is useful if you only want to include certain logic in some variants of
your build (e.g. polyfills for a UMD).

## API
### `polyfill(file, packages[, options])`
* `file` is the module that the package will be prepended to.
* `packages` is a list of modules to be resolved in your bundle.
* `options` (optional) is an object that includes different configurations:
  * `method` can either be `'commonjs'` or `'import'`, and determines if a require
statement or import statement should be prepended to the file. By default
it is import.
_(If you use commonjs, you'll need to resolve require statments
in the build)_

## Usage
Check out the example folder to see it in action!
```javascript
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
```
