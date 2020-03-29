import { Location } from '../pegjs/pegjs_types';
export declare type Field = {
    name: string;
    value: FieldValue;
    location: Location;
};
export declare type FieldValue = TextStringValue | NumberValue | AbbreviationValue | ConcatValue;
export declare type Entry = {
    entryType: string;
    content: Field[];
    internalKey?: string;
    location: Location;
};
export declare function isEntry(e: Entry | StringEntry | PreambleEntry): e is Entry;
export declare type StringEntry = {
    entryType: 'string';
    abbreviation: string;
    value: TextStringValue | NumberValue;
    location: Location;
};
export declare function isStringEntry(e: Entry | StringEntry | PreambleEntry): e is StringEntry;
export declare type PreambleEntry = {
    entryType: 'preamble';
    content: TextStringValue | ConcatValue;
    location: Location;
};
export declare function isPreambleEntry(e: Entry | StringEntry | PreambleEntry): e is PreambleEntry;
export declare type TextStringValue = {
    kind: 'text_string';
    content: string;
    location: Location;
};
export declare function isTextStringValue(e: FieldValue): e is TextStringValue;
export declare type NumberValue = {
    kind: 'number';
    content: string;
    location: Location;
};
export declare function isNumberValue(e: FieldValue): e is NumberValue;
export declare type AbbreviationValue = {
    kind: 'abbreviation';
    content: string;
    location: Location;
};
export declare function isAbbreviationValue(e: FieldValue): e is AbbreviationValue;
export declare type ConcatValue = {
    kind: 'concat';
    content: (TextStringValue | NumberValue | AbbreviationValue)[];
    location: Location;
};
export declare function isConcatValue(e: FieldValue): e is ConcatValue;
export declare type BibtexAst = {
    content: (Entry | StringEntry | PreambleEntry)[];
};
