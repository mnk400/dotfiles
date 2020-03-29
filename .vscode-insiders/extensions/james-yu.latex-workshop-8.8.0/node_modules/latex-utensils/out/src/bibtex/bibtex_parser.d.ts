import * as bp from './bibtex_parser_types';
import { ParserOptions } from '../pegjs/pegjs_types';
export * from './bibtex_parser_types';
export { isSyntaxError, ParserOptions, SyntaxError } from '../pegjs/pegjs_types';
export declare function parse(s: string, _option?: ParserOptions): bp.BibtexAst;
