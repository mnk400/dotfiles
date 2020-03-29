import { Attributes } from "./lib/attributes";
export declare function compileLaTeX(content: string, fileDirectoryPath: string, normalizedAttributes: Attributes): Promise<string>;
export declare function run(content: string, fileDirectoryPath: string, cmd: string, normalizedAttributes: Attributes, latexEngine?: string): Promise<string>;
