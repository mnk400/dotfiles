"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const workerpool = require("workerpool");
class MathJaxPool {
    constructor(extension) {
        this.extension = extension;
        this.pool = workerpool.pool(path.join(__dirname, 'mathjaxpool_worker.js'), { minWorkers: 1, maxWorkers: 1, workerType: 'process' });
        this.proxy = this.pool.proxy();
    }
    async typeset(arg, opts) {
        try {
            return (await this.proxy).typeset(arg, opts).timeout(3000);
        }
        catch (e) {
            this.extension.logger.addLogMessage(`Error when MathJax is rendering ${arg.math}`);
            throw e;
        }
    }
}
exports.MathJaxPool = MathJaxPool;
//# sourceMappingURL=mathjaxpool.js.map