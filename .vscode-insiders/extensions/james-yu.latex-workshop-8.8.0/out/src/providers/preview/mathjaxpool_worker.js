"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const workerpool = require("workerpool");
const mj = require("mathjax-node");
mj.config({
    MathJax: {
        jax: ['input/TeX', 'output/SVG'],
        extensions: ['tex2jax.js', 'MathZoom.js'],
        showMathMenu: false,
        showProcessingMessages: false,
        messageStyle: 'none',
        SVG: {
            useGlobalCache: false
        },
        TeX: {
            extensions: ['AMSmath.js', 'AMSsymbols.js', 'autoload-all.js', 'color.js', 'noUndefined.js']
        }
    }
});
mj.start();
function scaleSVG(data, scale) {
    const svgelm = data.svgNode;
    // w0[2] and h0[2] are units, i.e., pt, ex, em, ...
    const w0 = svgelm.getAttribute('width').match(/([.\d]+)(\w*)/);
    const h0 = svgelm.getAttribute('height').match(/([.\d]+)(\w*)/);
    const w = scale * Number(w0[1]);
    const h = scale * Number(h0[1]);
    svgelm.setAttribute('width', w + w0[2]);
    svgelm.setAttribute('height', h + h0[2]);
}
function colorSVG(svg, color) {
    const ret = svg.replace('</title>', `</title><style> * { color: ${color} }</style>`);
    return ret;
}
async function typeset(arg, opts) {
    const data = await mj.typeset(arg);
    scaleSVG(data, opts.scale);
    const xml = colorSVG(data.svgNode.outerHTML, opts.color);
    return xml;
}
exports.typeset = typeset;
const workers = { typeset };
workerpool.worker(workers);
//# sourceMappingURL=mathjaxpool_worker.js.map