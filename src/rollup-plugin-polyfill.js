const MagicString = require('magic-string');

const methods = {
  'import': pkg => `import "${pkg}";`,
  'require': pkg => `require("${pkg}");`,
};

/**
 * rollup-plugin-polyfill
 * prepends entry files with a source file or module
 * @param packages - list of files or modules to import
 * @param options - configurations for the plugin,
 *  can set to use import or require statements,
 *  and to include sourceMap or not
 *
 * @see https://github.com/JRJurman/rollup-plugin-polyfill
 *
 */
module.exports = (packages, {
  sourceMap = true,
  method = 'import',
} = {}) => ({
  name: 'polyfill',
  transform: function(source, id) {
    // polyfills should go only on the top most files
    // so we only apply this transform to entries
    if (!this.getModuleInfo(id).isEntry) return null;

    // create a new magic-string object to prepend our imports on
    const magicString = new MagicString(source);
    magicString.prepend(
      packages
        .map(pkg => methods[method](pkg))
        .join('\n') + '\n\n'
    )

    return {
      code: magicString.toString(),
      map: sourceMap ? magicString.generateMap() : null,
    }
  }
});
