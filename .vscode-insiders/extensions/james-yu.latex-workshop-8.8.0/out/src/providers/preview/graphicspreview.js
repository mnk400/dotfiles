"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const tmpFile = require("tmp");
const pdfrenderer_1 = require("./pdfrenderer");
const graphicsscaler_1 = require("./graphicsscaler");
class GraphicsPreview {
    constructor(e) {
        this.curCacheName = 0;
        this.extension = e;
        this.pdfRenderer = new pdfrenderer_1.PDFRenderer(e);
        this.graphicsScaler = new graphicsscaler_1.GraphicsScaler(e);
        const tmpdir = tmpFile.dirSync({ unsafeCleanup: true });
        this.cacheDir = tmpdir.name;
        this.pdfFileCacheMap = new Map();
    }
    async provideHover(document, position) {
        const pat = /\\includegraphics\s*(?:\[(.*?)\])?\s*\{(.*?)\}/;
        const range = document.getWordRangeAtPosition(position, pat);
        if (!range) {
            return undefined;
        }
        const cmdString = document.getText(range);
        const execArray = pat.exec(cmdString);
        const relPath = execArray && execArray[2];
        const includeGraphicsArgs = execArray && execArray[1];
        if (!execArray || !relPath) {
            return undefined;
        }
        const filePath = this.findFilePath(relPath);
        if (filePath === undefined) {
            return undefined;
        }
        let pageNumber = 1;
        if (includeGraphicsArgs) {
            const m = /page\s*=\s*(\d+)/.exec(includeGraphicsArgs);
            if (m && m[1]) {
                pageNumber = Number(m[1]);
            }
        }
        const dataUrl = await this.renderGraphics(filePath, { height: 230, width: 500, pageNumber });
        if (dataUrl !== undefined) {
            const md = new vscode.MarkdownString(`![graphics](${dataUrl})`);
            return new vscode.Hover(md, range);
        }
        return undefined;
    }
    newSvgCacheName() {
        const name = this.curCacheName.toString() + '.svg';
        this.curCacheName += 1;
        return name;
    }
    async renderGraphics(filePath, opts) {
        var _a, _b;
        const pageNumber = opts.pageNumber || 1;
        if (!fs.existsSync(filePath)) {
            return undefined;
        }
        if (/\.pdf$/i.exec(filePath)) {
            const cacheKey = JSON.stringify([filePath, pageNumber]);
            const cache = this.pdfFileCacheMap.get(cacheKey);
            const cacheFileName = (_b = (_a = cache) === null || _a === void 0 ? void 0 : _a.cacheFileName, (_b !== null && _b !== void 0 ? _b : this.newSvgCacheName()));
            const svgPath = path.join(this.cacheDir, cacheFileName);
            const curStat = fs.statSync(filePath);
            if (cache && fs.existsSync(svgPath) && fs.statSync(svgPath).mtimeMs >= curStat.mtimeMs && cache.inode === curStat.ino) {
                return vscode.Uri.file(svgPath);
            }
            this.pdfFileCacheMap.set(cacheKey, { cacheFileName, inode: curStat.ino });
            const svg0 = await this.pdfRenderer.renderToSVG(filePath, { height: opts.height, width: opts.width, pageNumber });
            const svg = this.setBackgroundColor(svg0);
            fs.writeFileSync(svgPath, svg);
            return vscode.Uri.file(svgPath);
        }
        if (/\.(bmp|jpg|jpeg|gif|png)$/i.exec(filePath)) {
            const dataUrl = await this.graphicsScaler.scale(filePath, opts);
            return dataUrl;
        }
        return undefined;
    }
    setBackgroundColor(svg) {
        return svg.replace(/(<\/svg:style>)/, 'svg { background-color: white };$1');
    }
    findFilePath(relPath) {
        if (path.isAbsolute(relPath)) {
            if (fs.existsSync(relPath)) {
                return relPath;
            }
            else {
                return undefined;
            }
        }
        const rootDir = this.extension.manager.rootDir;
        if (rootDir === undefined) {
            return undefined;
        }
        const fPath = path.resolve(rootDir, relPath);
        if (fs.existsSync(fPath)) {
            return fPath;
        }
        for (const dirPath of this.extension.completer.input.graphicsPath) {
            const filePath = path.resolve(rootDir, dirPath, relPath);
            if (fs.existsSync(filePath)) {
                return filePath;
            }
        }
        return undefined;
    }
}
exports.GraphicsPreview = GraphicsPreview;
//# sourceMappingURL=graphicspreview.js.map