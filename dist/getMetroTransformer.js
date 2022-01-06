"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAndConvert = exports.maybeTransformMetroResult = exports.getMetroTransformer = void 0;
var source_map_1 = require("source-map");
var semver = require("semver");
var composeSourceMaps_1 = require("./composeSourceMaps");
var babylon = require("@babel/parser");
var traverse_1 = require("@babel/traverse");
var generator_1 = require("@babel/generator");
function getReactNativeMinorVersion() {
    var reactNativeVersionString = require("react-native/package.json").version;
    var parseResult = semver.parse(reactNativeVersionString);
    if (!parseResult) {
        throw new Error("Can't parse react-native version string '" + reactNativeVersionString + "'");
    }
    return parseResult.minor;
}
function getMetroTransformer(reactNativeMinorVersion) {
    if (reactNativeMinorVersion === void 0) { reactNativeMinorVersion = getReactNativeMinorVersion(); }
    if (reactNativeMinorVersion >= 59) {
        return require('metro-react-native-babel-transformer/src/index');
    }
    else if (reactNativeMinorVersion >= 56) {
        return require("metro/src/reactNativeTransformer");
    }
    else if (reactNativeMinorVersion >= 52) {
        return require("metro/src/transformer");
    }
    else if (reactNativeMinorVersion >= 0.47) {
        return require("metro-bundler/src/transformer");
    }
    else if (reactNativeMinorVersion === 0.46) {
        return require("metro-bundler/build/transformer");
    }
    else {
        throw new Error("react-native-obfuscating-transformer requires react-native >= 0.46");
    }
}
exports.getMetroTransformer = getMetroTransformer;
function maybeTransformMetroResult(upstreamResult, _a, reactNativeMinorVersion) {
    var code = _a.code, map = _a.map;
    if (reactNativeMinorVersion === void 0) { reactNativeMinorVersion = getReactNativeMinorVersion(); }
    if (reactNativeMinorVersion >= 52) {
        // convert code and map to ast
        var ast = babylon.parse(code, {
            sourceType: "module",
        });
        var mapConsumer_1 = new source_map_1.SourceMapConsumer(map) // upstream types are wrong
        ;
        traverse_1.default.cheap(ast, function (node) {
            if (node.loc) {
                var originalStart = mapConsumer_1.originalPositionFor(node.loc.start);
                if (originalStart.line) {
                    node.loc.start.line = originalStart.line;
                    node.loc.start.column = originalStart.column;
                }
                var originalEnd = mapConsumer_1.originalPositionFor(node.loc.end);
                if (originalEnd.line) {
                    node.loc.end.line = originalEnd.line;
                    node.loc.end.column = originalEnd.column;
                }
            }
        });
        return { ast: ast };
    }
    else if (Array.isArray(upstreamResult.map)) {
        return { code: code, map: composeSourceMaps_1.convertStandardSourceMapToMetroRawSourceMap(map) };
    }
    else {
        return { code: code, map: map };
    }
}
exports.maybeTransformMetroResult = maybeTransformMetroResult;
function generateAndConvert(ast, filename) {
    var generatorResult = generator_1.default(ast, {
        filename: filename,
        retainLines: true,
        sourceMaps: true,
        sourceFileName: filename,
    });
    if (!generatorResult.map) {
        return { code: generatorResult.code };
    }
    var map = {
        version: generatorResult.map.version + "",
        mappings: generatorResult.map.mappings,
        names: generatorResult.map.names,
        sources: generatorResult.map.sources,
        sourcesContent: generatorResult.map.sourcesContent,
        file: generatorResult.map.file
    };
    return { code: generatorResult.code, map: map };
}
exports.generateAndConvert = generateAndConvert;
