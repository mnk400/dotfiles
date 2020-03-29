"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const latex_utensils_1 = require("latex-utensils");
const workerpool = require("workerpool");
function parseLatex(s, options) {
    return latex_utensils_1.latexParser.parse(s, options);
}
function parseLatexPreamble(s) {
    return latex_utensils_1.latexParser.parsePreamble(s);
}
function parseBibtex(s, options) {
    return latex_utensils_1.bibtexParser.parse(s, options);
}
const workers = {
    parseLatex,
    parseLatexPreamble,
    parseBibtex
};
workerpool.worker(workers);
//# sourceMappingURL=syntax_worker.js.map