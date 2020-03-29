/**
 * Render ditaa diagrams with `code` to `dest`.
 * @param code the ditaa code
 * @param args args passed to ditaa.jar
 * @param dest where to output the png file. Should be an absolute path.
 * @return the `dest`
 */
export declare function render(code?: string, args?: any[], dest?: string): Promise<string>;
