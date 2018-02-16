module.exports = (main, packages) => ({
  name: 'polyfill',
  transform: (source, id) =>
    packages
      .filter(() => id.match(main))
      .map(pkg => `require("${pkg}");`)
      .join('\n').concat(source)
})
