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
/**
 * ditaa API:
 *     https://github.com/stathissideris/ditaa
 */
const path = require("path");
const utility = require("./utility");
const CACHE = {};
/**
 * Render ditaa diagrams with `code` to `dest`.
 * @param code the ditaa code
 * @param args args passed to ditaa.jar
 * @param dest where to output the png file. Should be an absolute path.
 * @return the `dest`
 */
function render(code = "", args = [], dest = "") {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const info = yield utility.tempOpen({
                prefix: "mume_ditaa",
                suffix: ".ditaa",
            });
            yield utility.writeFile(info.fd, code);
            if (!dest) {
                dest = (yield utility.tempOpen({
                    prefix: "mume_ditaa",
                    suffix: ".png",
                })).path;
            }
            if (dest in CACHE &&
                CACHE[dest].code === code &&
                utility.isArrayEqual(args, CACHE[dest].args)) {
                // already rendered
                return CACHE[dest].outputDest;
            }
            yield utility.execFile("java", [
                "-Djava.awt.headless=true",
                "-jar",
                path.resolve(utility.extensionDirectoryPath, "./dependencies/ditaa/ditaa.jar"),
                info.path,
                dest,
            ].concat(args));
            const outputDest = dest + "?" + Math.random();
            // save to cache
            CACHE[dest] = { code, args, outputDest };
            return outputDest;
        }
        catch (error) {
            throw new Error(`Java is required to be installed.\n${error.toString()}`);
        }
    });
}
exports.render = render;
//# sourceMappingURL=ditaa.js.map