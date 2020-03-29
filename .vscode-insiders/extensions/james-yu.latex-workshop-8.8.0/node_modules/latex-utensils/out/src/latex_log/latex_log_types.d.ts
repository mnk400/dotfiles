export declare type FileStack = {
    kind: 'file_stack';
    content: LatexLogElement[];
};
export declare function isFileStack(e: LatexLogElement): e is FileStack;
export declare type TexError = {
    kind: 'tex_error';
    message: string;
    line: number;
    command?: string;
};
export declare function isTexError(e: LatexLogElement): e is TexError;
export declare type LatexmkError = {
    kind: 'latexmk_error';
    message: string;
    path: string;
    line: number;
    command?: string;
};
export declare function isLatexmkError(e: LatexLogElement): e is LatexmkError;
export declare type LogText = {
    kind: 'text_string';
    content: string;
};
export declare function isLogText(e: LatexLogElement): e is LogText;
export declare type PageNumber = {
    kind: 'page_number';
    page: number;
    content?: string;
};
export declare function isPageNumber(e: LatexLogElement): e is PageNumber;
export declare type LatexLogElement = FileStack | TexError | LatexmkError | LogText | PageNumber;
export declare type LatexLogAst = {
    kind: 'full' | 'halt_on_error' | 'unknown';
    content: (LogText | FileStack)[];
};
