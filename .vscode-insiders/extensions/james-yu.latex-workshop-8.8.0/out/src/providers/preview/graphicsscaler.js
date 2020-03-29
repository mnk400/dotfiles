"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const workerpool = require("workerpool");
class GraphicsScaler {
    constructor(extension) {
        this.extension = extension;
        this.pool = workerpool.pool(path.join(__dirname, 'graphicsscaler_worker.js'), { maxWorkers: 1, workerType: 'process' });
        this.proxy = this.pool.proxy();
    }
    async scale(filePath, options) {
        return (await this.proxy).scale(filePath, options).timeout(3000);
    }
}
exports.GraphicsScaler = GraphicsScaler;
//# sourceMappingURL=graphicsscaler.js.map