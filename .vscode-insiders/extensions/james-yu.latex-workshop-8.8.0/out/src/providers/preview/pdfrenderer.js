"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const workerpool = require("workerpool");
class PDFRenderer {
    constructor(extension) {
        this.extension = extension;
        this.pool = workerpool.pool(path.join(__dirname, 'pdfrenderer_worker.js'), { maxWorkers: 1, workerType: 'process' });
        this.proxy = this.pool.proxy();
    }
    async renderToSVG(pdfPath, options) {
        return (await this.proxy).renderToSvg(pdfPath, options).timeout(3000);
    }
}
exports.PDFRenderer = PDFRenderer;
//# sourceMappingURL=pdfrenderer.js.map