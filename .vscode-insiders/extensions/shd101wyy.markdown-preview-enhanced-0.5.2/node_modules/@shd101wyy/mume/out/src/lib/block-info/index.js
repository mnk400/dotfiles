"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var normalize_1 = require("./normalize");
exports.normalizeBlockInfo = normalize_1.default;
var parse_1 = require("./parse");
exports.parseBlockInfo = parse_1.default;
exports.extractCommandFromBlockInfo = (info) => info.attributes["cmd"] === true ? info.language : info.attributes["cmd"];
//# sourceMappingURL=index.js.map