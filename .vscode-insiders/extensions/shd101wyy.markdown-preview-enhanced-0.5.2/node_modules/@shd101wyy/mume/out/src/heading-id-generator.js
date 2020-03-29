"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uslug = require("uslug");
class HeadingIdGenerator {
    constructor() {
        this.table = {};
    }
    generateId(heading) {
        heading = heading.replace(/。/g, ""); // sanitize
        let slug = uslug(heading);
        if (this.table[slug] >= 0) {
            this.table[slug] = this.table[slug] + 1;
            slug += "-" + this.table[slug];
        }
        else {
            this.table[slug] = 0;
        }
        return slug;
    }
}
exports.default = HeadingIdGenerator;
//# sourceMappingURL=heading-id-generator.js.map