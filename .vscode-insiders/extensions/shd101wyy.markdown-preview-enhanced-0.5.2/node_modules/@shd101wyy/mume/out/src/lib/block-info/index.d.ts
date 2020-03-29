import { Attributes } from "../attributes";
export interface BlockInfo {
    attributes: Attributes;
    derivedAttributes?: Attributes;
    language: string;
}
export { default as normalizeBlockInfo } from "./normalize";
export { default as parseBlockInfo } from "./parse";
export declare const extractCommandFromBlockInfo: (info: BlockInfo) => any;
