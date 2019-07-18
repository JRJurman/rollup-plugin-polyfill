var originalObject = { description: 'This is a project example' }

// Object.assign requires a polyfill for IE
var newObject = Object.assign({}, originalObject, { title: 'Polyfill Example' })

// String.prototype.reverse is a custom function we defined locally
console.log(newObject.title.reverse())
