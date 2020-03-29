"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const domstubs = require("@tamuratak/domstubs");
const fs = require("fs");
const path = require("path");
const pdfjsLib = require("pdfjs-dist");
const workerpool = require("workerpool");
domstubs.setStubs(global);
class NodeCMapReaderFactory {
    constructor() {
        this.cmapDir = path.join(__dirname, '../../../../node_modules/pdfjs-dist/cmaps/');
    }
    fetch(arg) {
        const name = arg.name;
        if (!name) {
            return Promise.reject(new Error('CMap name must be specified.'));
        }
        const file = this.cmapDir + name + '.bcmap';
        const data = fs.readFileSync(file);
        return Promise.resolve({
            cMapData: new Uint8Array(data),
            compressionType: 1
        });
    }
}
async function renderToSvg(pdfPath, options) {
    const data = new Uint8Array(fs.readFileSync(pdfPath));
    const loadingTask = pdfjsLib.getDocument({
        data,
        nativeImageDecoderSupport: 'display',
        CMapReaderFactory: NodeCMapReaderFactory
    });
    const doc = await loadingTask.promise;
    const page = await doc.getPage(options.pageNumber);
    let viewport = page.getViewport({ scale: 1.0, });
    const height = options.height;
    const width = options.width;
    const scale = Math.min(height / viewport.height, width / viewport.width, 1);
    viewport = page.getViewport({ scale });
    const opList = await page.getOperatorList();
    const svgGfx = new pdfjsLib.SVGGraphics(page.commonObjs, page.objs);
    svgGfx.embedFonts = true;
    const svg = await svgGfx.getSVG(opList, viewport);
    return svg.toString();
}
const workers = { renderToSvg };
workerpool.worker(workers);
//# sourceMappingURL=pdfrenderer_worker.js.map