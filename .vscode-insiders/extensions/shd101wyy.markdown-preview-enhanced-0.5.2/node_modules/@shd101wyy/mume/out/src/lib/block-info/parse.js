"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const attributes_1 = require("../attributes");
function default_1(raw) {
    let language;
    let attributesAsString;
    let attributes;
    const trimmedParams = raw.trim();
    const match = trimmedParams.indexOf("{") !== -1
        ? trimmedParams.match(/^([^\s\{]*)\s*\{(.*?)\}/)
        : trimmedParams.match(/^([^\s]+)\s+(.+?)$/);
    if (match) {
        if (match[1].length) {
            language = match[1];
        }
        attributesAsString = match[2];
    }
    else {
        language = trimmedParams;
        attributesAsString = "";
    }
    if (attributesAsString) {
        try {
            attributes = attributes_1.parseAttributes(attributesAsString);
        }
        catch (e) {
            //
        }
    }
    else {
        attributes = {};
    }
    return { language, attributes };
}
exports.default = default_1;
//# sourceMappingURL=parse.js.map