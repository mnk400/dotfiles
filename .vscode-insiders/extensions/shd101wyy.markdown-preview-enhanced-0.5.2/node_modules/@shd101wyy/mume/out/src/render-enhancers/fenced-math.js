"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const attributes_1 = require("../lib/attributes");
const parse_math_1 = require("../parse-math");
const supportedLanguages = ["math"];
/**
 * Enhances the document with literate fenced math
 * Attributes supported:
 * - literate [=true] if false, no math rendering happens
 * - hide [=true] if set to false, both code and output are shown
 * - output_first [=false] if true, math output shows before the code block (requires hide=false)
 *
 * @param renderingOption which math engine to use
 * @param $ cheerio element containing the entire document
 */
function enhance($, renderingOption, mathBlockDelimiters) {
    return __awaiter(this, void 0, void 0, function* () {
        $('[data-role="codeBlock"]').each((i, container) => {
            const $container = $(container);
            if ($container.data("executor")) {
                return;
            }
            const normalizedInfo = $container.data("normalizedInfo");
            if (normalizedInfo.attributes["literate"] === false ||
                normalizedInfo.attributes["cmd"] === false ||
                supportedLanguages.indexOf(normalizedInfo.language) === -1) {
                return;
            }
            $container.data("executor", "math");
            if (normalizedInfo.attributes["literate"] === false) {
                return;
            }
            const code = $container.text();
            const $renderedMath = renderMath(code, normalizedInfo, renderingOption, mathBlockDelimiters);
            normalizedInfo.attributes["output_first"] === true
                ? $container.before($renderedMath)
                : $container.after($renderedMath);
            if (normalizedInfo.attributes["hide"] !== false) {
                $container.data("hiddenByEnhancer", true);
            }
        });
        return $;
    });
}
exports.default = enhance;
const renderMath = (code, normalizedInfo, renderingOption, mathBlockDelimiters) => {
    let $output = null;
    try {
        const mathHtml = parse_math_1.default({
            content: code,
            displayMode: true,
            openTag: mathBlockDelimiters.length ? mathBlockDelimiters[0][0] : "",
            closeTag: mathBlockDelimiters.length ? mathBlockDelimiters[0][1] : "",
            renderingOption,
        });
        $output = `<p ${attributes_1.stringifyAttributes(normalizedInfo.attributes)}>${mathHtml}</p>`;
    }
    catch (error) {
        $output = `<pre class="language-text">${error.toString()}</pre>`;
    }
    return $output;
};
//# sourceMappingURL=fenced-math.js.map