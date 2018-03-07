const MagicString = require('magic-string');

const methods = {
  'import': pkg => `import "${pkg}";`,
  'commonjs': pkg => `require("${pkg}");`,
};

module.exports = (main, packages, {
  sourceMap = true,
  method = 'import',
} = {}) => ({
  name: 'polyfill',
  transform: (source, id) => {
    if (!id.match(main)) return null;

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
