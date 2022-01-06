"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extendFileExtension = void 0;
function extendFileExtension(filename, extensionPart) {
    var parts = filename.split(".");
    parts.splice(1, 0, extensionPart);
    return parts.join(".");
}
exports.extendFileExtension = extendFileExtension;
