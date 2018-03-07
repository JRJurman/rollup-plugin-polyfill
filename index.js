const MagicString = require('magic-string');

module.exports = (main, packages, { sourceMap = true } = {}) => ({
  name: 'polyfill',
  transform: (source, id) => {
    if (!id.match(main)) return null;

    const magicString = new MagicString(source);
    magicString.prepend(
      packages
        .map(pkg => `require("${pkg}");`)
        .join('\n') + '\n\n'
    )

    return {
      code: magicString.toString(),
      map: sourceMap ? magicString.generateMap() : null,
    }
  }
})
