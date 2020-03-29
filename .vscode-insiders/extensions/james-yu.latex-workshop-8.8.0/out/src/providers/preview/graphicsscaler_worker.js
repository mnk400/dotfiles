"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const workerpool = require("workerpool");
const JimpLib0 = require("jimp");
const JimpLib = JimpLib0;
async function scale(filePath, opts) {
    const image = await JimpLib.read(filePath);
    const scl = Math.min(opts.height / image.getHeight(), opts.width / image.getWidth(), 1);
    const dataUrl = await image.scale(scl).getBase64Async(image.getMIME());
    return dataUrl;
}
const workers = { scale };
workerpool.worker(workers);
//# sourceMappingURL=graphicsscaler_worker.js.map