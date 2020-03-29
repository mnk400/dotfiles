import { MathRenderingOption } from "./markdown-engine-config";
export declare type ParseMathArgs = {
    content: string;
    openTag: string;
    closeTag: string;
    displayMode?: boolean;
    renderingOption: MathRenderingOption;
};
declare const _default: ({ content, openTag, closeTag, displayMode, renderingOption, }: ParseMathArgs) => any;
/**
 *
 * @param content the math expression
 * @param openTag the open tag, eg: '\('
 * @param closeTag the close tag, eg: '\)'
 * @param displayMode whether to be rendered in display mode
 * @param renderingOption the math engine to use: KaTeX | MathJax | None
 */
export default _default;
