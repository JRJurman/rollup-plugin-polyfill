const {rollup} = require('rollup');
const path = require('path').posix;
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
    const generated = await bundle.generate({exports: 'auto', format: 'cjs'});
    const codeMap = {};
    for (const chunk of generated.output) {
        codeMap[chunk.fileName] = chunk.code;
    }
    return codeMap;
}

function stringifyCodeMap(codeMap) {
    return Object.keys(codeMap).map(module => `===> ${module}\n${codeMap[module]}`).join('\n\n');
}
