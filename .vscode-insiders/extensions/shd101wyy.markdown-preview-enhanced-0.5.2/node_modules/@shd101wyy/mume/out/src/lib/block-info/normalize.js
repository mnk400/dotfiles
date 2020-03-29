"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const attributes_1 = require("../attributes");
function default_1(blockInfo) {
    const normalizedAttributes = attributes_1.normalizeAttributes(blockInfo.attributes);
    const normalizedLanguage = normalizeLanguage(blockInfo.language);
    if (normalizedAttributes !== blockInfo.attributes ||
        normalizedLanguage !== blockInfo.language) {
        return {
            language: normalizedLanguage,
            attributes: normalizedAttributes,
        };
    }
    return blockInfo;
}
exports.default = default_1;
const normalizeLanguage = (language) => {
    if (typeof language === "string") {
        return language.trim().toLowerCase();
    }
    return "";
};
//# sourceMappingURL=normalize.js.map