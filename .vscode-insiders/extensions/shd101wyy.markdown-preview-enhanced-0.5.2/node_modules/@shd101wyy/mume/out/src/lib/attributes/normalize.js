"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const snakeCase = require("lodash/snakeCase");
/**
 * Walks through attribute keys and makes them snakeCase if needed
 * @param attributes
 */
function default_1(attributes) {
    if (typeof attributes !== "object") {
        return {};
    }
    let changed = false;
    const result = Object.assign({}, attributes);
    for (const key in attributes) {
        if (attributes.hasOwnProperty(key)) {
            const normalizedKey = snakeCase(key);
            if (normalizedKey !== key) {
                result[normalizedKey] = result[key];
                delete result[key];
                changed = true;
            }
        }
    }
    return changed ? result : attributes;
}
exports.default = default_1;
//# sourceMappingURL=normalize.js.map