const path = require('path').posix;
const {rollup} = require('rollup');
const commonjs = require('@rollup/plugin-commonjs');
const polyfill = require('..');

it('injects a polyfill', async () => {
    const bundle = await rollup({
        input: '/main.js',
        plugins: [
            loader({
                '/main.js': 'expect(global.polyfilled).toBe(true);',
                polyfill: 'global.polyfilled = true;'
            }),
            polyfill(['polyfill'])
        ]
    });
    await executeBundle(bundle, 'main.js')
});

it('injects multiple polyfills in given order', async () => {
    const bundle = await rollup({
        input: '/main.js',
        plugins: [
            loader({
                '/main.js': 'expect(global.polyfill1).toBe(true); expect(global.polyfill2).toBe(true); expect(global.polyfill3).toBe(true); global.main = true;',
                polyfill1: 'global.polyfill1 = true;',
                polyfill2: 'expect(global.polyfill1).toBe(true); global.polyfill2 = true;',
                polyfill3: 'expect(global.polyfill2).toBe(true); global.polyfill3 = true;'
            }),
            polyfill(['polyfill1', 'polyfill2', 'polyfill3'])
        ]
    });
    expect((await executeBundle(bundle, 'main.js')).global).toEqual({
        main: true,
        polyfill1: true,
        polyfill2: true,
        polyfill3: true
    });
});

it('maintains entry signature', async () => {
    const bundle = await rollup({
        input: '/main.js',
        plugins: [
            loader({
                '/main.js': 'expect(global.polyfilled).toBe(true); export const foo = "foo"; export default "default";',
                polyfill: 'global.polyfilled = true;'
            }),
            polyfill(['polyfill'])
        ]
    });
    expect((await executeBundle(bundle, 'main.js')).exports).toEqual({
        default: "default",
        foo: "foo"
    });
});

it('handles multiple entry points', async () => {
    const bundle = await rollup({
        input: ['/main.js', '/other.js'],
        plugins: [
            loader({
                '/main.js': 'import "./shared.js"; expect(global.polyfilled).toBe(true); global.main = true;',
                '/other.js': 'import "./shared.js"; expect(global.polyfilled).toBe(true); global.other = true;',
                '/shared.js': 'expect(global.polyfilled).toBe(true); global.shared = true;',
                polyfill: 'global.polyfilled = true;'
            }),
            polyfill(['polyfill'])
        ]
    });
    expect((await executeBundle(bundle, 'main.js')).global).toEqual({
        polyfilled: true,
        main: true,
        shared: true
    });
    expect((await executeBundle(bundle, 'other.js')).global).toEqual({
        polyfilled: true,
        other: true,
        shared: true
    });
});

it('handles files promoted to entry points via this.emitFile', async () => {
    const bundle = await rollup({
        input: '/main.js',
        plugins: [
            loader({
                '/main.js': 'import "./other.js"; expect(global.polyfilled).toBe(true); global.main = true;',
                '/other.js': 'expect(global.polyfilled).toBe(true); global.other = true;',
                polyfill: 'global.polyfilled = true;'
            }),
            polyfill(['polyfill']),
            {
                transform(code, id) {
                    if (id === '/other.js') {
                        this.emitFile({type: 'chunk', id: '/other.js', fileName: 'other.js'})
                    }
                }
            }
        ]
    });
    expect((await executeBundle(bundle, 'main.js')).global).toEqual({
        polyfilled: true,
        main: true,
        other: true
    });
    expect((await executeBundle(bundle, 'other.js')).global).toEqual({
        polyfilled: true,
        other: true,
    });
});

it('works if a plugin preloads entry points via this.load', async () => {
    const bundle = await rollup({
        input: '/main.js',
        plugins: [
            {
                async resolveId(source, importer, options) {
                    const resolved = await this.resolve(source, importer, {...options, skipSelf: true});
                    await this.load(resolved);
                }
            },
            loader({
                '/main.js': 'expect(global.polyfilled).toBe(true);',
                polyfill: 'global.polyfilled = true;'
            }),
            polyfill(['polyfill']),
        ]
    });
    await executeBundle(bundle, 'main.js');
});

it('fails with the proper error for external entry points', async () => {
    await expect(rollup({
        input: 'external',
        external: ['external'],
        plugins: [
            loader({
                polyfill: 'global.polyfilled = true;'
            }),
            polyfill(['polyfill']),
        ]
    })).rejects.toEqual(new Error('Entry module cannot be external (external).'))
});

it('fails with the proper error for missing entry points', async () => {
    await expect(rollup({
        input: 'missing',
        plugins: [
            loader({
                polyfill: 'global.polyfilled = true;'
            }),
            polyfill(['polyfill']),
        ]
    })).rejects.toEqual(new Error('Could not resolve entry module (missing).'))
});

it('ensures entry points and polyfill side effects are always respected', async () => {
    const bundle = await rollup({
        input: '/main.js',
        treeshake: {moduleSideEffects: false},
        plugins: [
            loader({
                '/main.js': 'global.main = true; expect(global.polyfilled).toBe(true);',
                polyfill: 'global.polyfilled = true;'
            }),
            polyfill(['polyfill']),
        ]
    });
    expect((await executeBundle(bundle, 'main.js')).global).toEqual({
        main: true,
        polyfilled: true
    });
});

it('throws a helpful error for unresolved polyfills', async () => {
    await expect(rollup({
        plugins: [
            polyfill(['unresolved']),
        ]
    })).rejects.toEqual(new Error('Could not resolve polyfill "unresolved". If you do not want to bundle your polyfills ' +
        'and just want to inject imports, please mark them as external by using Rollup\'s "external" option.'))
});

it('allows polyfills to be external', async () => {
    const bundle = await rollup({
        input: '/main.js',
        external: ['polyfill'],
        plugins: [
            loader({
                '/main.js': 'expect(global.polyfilled).toBe(true);',
            }),
            polyfill(['polyfill'])
        ]
    });
    expect(await getCodeMapFromBundle(bundle)).toEqual({
        'main.js': "'use strict';\n\nrequire('polyfill');\n\nexpect(global.polyfilled).toBe(true);\n"
    })
});

it('works with commonjs entry points', async () => {
    const bundle = await rollup({
        input: '/main.js',
        plugins: [
            loader({
                '/main.js': 'expect(global.polyfilled).toBe(true); exports.foo = require("./foo.js");',
                '/foo.js': 'module.exports = "foo";',
                polyfill: 'global.polyfilled = true;'
            }),
            // We need `ignoreGlobal` just because of our test setup
            commonjs({ignoreGlobal: true}),
            polyfill(['polyfill'])
        ]
    });
    expect((await executeBundle(bundle, 'main.js')).exports).toEqual({
        default: { foo: "foo" },
        foo: "foo"
    });
});

// A simple plugin to resolve and load some virtual files
function loader(modules) {
    return {
        name: 'loader',
        load(id) {
            if (Object.hasOwnProperty.call(modules, id)) {
                return modules[id];
            }
            return null;
        },
        resolveId(source, importer) {
            const id = source.startsWith('.') ? path.join(path.dirname(importer), source) : source;
            if (Object.hasOwnProperty.call(modules, id)) {
                return id;
            }
            return null;
        }
    };
}

// helpers to run tests with virtual files
function requireWithContext(code, context) {
    const module = {exports: {}};
    const contextWithExports = {...context, module, exports: module.exports};
    const contextKeys = Object.keys(contextWithExports);
    const contextValues = contextKeys.map((key) => contextWithExports[key]);
    try {
        const fn = new Function(contextKeys, code);
        fn.apply({}, contextValues);
    } catch (error) {
        error.exports = module.exports;
        throw error;
    }
    return contextWithExports.module.exports;
}

function runCodeSplitTest(codeMap, entry) {
    const requireFromOutputVia = (importer) => (source) => {
        const outputId = path.join(path.dirname(importer), source);
        const code = codeMap[outputId];
        if (typeof code !== 'undefined') {
            return requireWithContext(
                code,
                {require: requireFromOutputVia(outputId), ...context}
            );
        }
        return require(source);
    };

    if (!codeMap[entry]) {
        throw new Error(
            `Could not find entry "${entry}" in generated output.\nChunks:\n${Object.keys(
                codeMap
            ).join('\n')}`
        );
    }
    const global = {};
    const context = {global}
    return {
        exports: requireWithContext(codeMap[entry], {
            require: requireFromOutputVia('main.js'),
            ...context
        }),
        global
    };
}

async function executeBundle(bundle, entry) {
    const codeMap = await getCodeMapFromBundle(bundle);
    try {
        return runCodeSplitTest(codeMap, entry);
    } catch (error) {
        error.message += `\n\n${stringifyCodeMap(codeMap)}`
        throw error;
    }
}

async function getCodeMapFromBundle(bundle) {
    const generated = await bundle.generate({exports: 'named', format: 'cjs'});
    const codeMap = {};
    for (const chunk of generated.output) {
        codeMap[chunk.fileName] = chunk.code;
    }
    return codeMap;
}

function stringifyCodeMap(codeMap) {
    return Object.keys(codeMap).map(module => `===> ${module}\n${codeMap[module]}`).join('\n\n');
}
