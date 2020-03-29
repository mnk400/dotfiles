"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Sorting function for bibtex entries
 * @param keys Array of sorting keys
 */
function bibtexSort(keys, duplicates) {
    return function (a, b) {
        let r = 0;
        for (const key of keys) {
            // Select the appropriate sort function
            if (key === 'key') {
                r = bibtexSortByKey(a, b);
            }
            else if (key === 'year-desc') {
                r = -bibtexSortByField('year', a, b);
            }
            else {
                r = bibtexSortByField(key, a, b);
            }
            // Compare until different
            if (r !== 0) {
                break;
            }
        }
        if (r === 0) {
            // It seems that items earlier in the list appear as the variable b here, rather than a
            duplicates.add(a);
        }
        return r;
    };
}
exports.bibtexSort = bibtexSort;
/**
 * Handles all sorting keys that are some bibtex field name
 * @param fieldName which field name to sort by
 */
function bibtexSortByField(fieldName, a, b) {
    let fieldA = '';
    let fieldB = '';
    for (let i = 0; i < a.content.length; i++) {
        if (a.content[i].name === fieldName) {
            fieldA = fieldToString(a.content[i].value, '', '');
            break;
        }
    }
    for (let i = 0; i < b.content.length; i++) {
        if (b.content[i].name === fieldName) {
            fieldB = fieldToString(b.content[i].value, '', '');
            break;
        }
    }
    // Remove braces to sort properly
    fieldA = fieldA.replace(/{|}/, '');
    fieldB = fieldB.replace(/{|}/, '');
    return fieldA.localeCompare(fieldB);
}
function bibtexSortByKey(a, b) {
    if (!a.internalKey && !b.internalKey) {
        return 0;
    }
    else if (!a.internalKey) {
        return -1; // sort undefined keys first
    }
    else if (!b.internalKey) {
        return 1;
    }
    else {
        return a.internalKey.localeCompare(b.internalKey);
    }
}
/**
 * Creates an aligned string from a bibtexParser.Entry
 * @param entry the bibtexParser.Entry
 * @param config from `latex-workshop.bibtex-format`
 */
function bibtexFormat(entry, config) {
    let s = '';
    s += '@' + entry.entryType + '{' + (entry.internalKey ? entry.internalKey : '');
    // Find the longest field name in entry
    let maxFieldLength = 0;
    entry.content.forEach(field => {
        maxFieldLength = Math.max(maxFieldLength, field.name.length);
    });
    entry.content.forEach(field => {
        s += ',\n' + config.tab + (config.case === 'lowercase' ? field.name : field.name.toUpperCase());
        s += ' '.repeat(maxFieldLength - field.name.length) + ' = ';
        s += fieldToString(field.value, config.left, config.right);
    });
    s += '\n}';
    return s;
}
exports.bibtexFormat = bibtexFormat;
/**
 * Convert a bibtexParser.FieldValue to a string
 * @param field the bibtexParser.FieldValue to parse
 * @param left what to put before a text_string (i.e. `{` or `"`)
 * @param right what to put after a text_string (i.e. `}` or `"`)
 */
function fieldToString(field, left, right) {
    switch (field.kind) {
        case 'abbreviation':
        case 'number':
            return field.content;
        case 'text_string':
            return left + field.content + right;
        case 'concat':
            return field.content.map(value => fieldToString(value, left, right)).reduce((acc, cur) => { return acc + ' # ' + cur; });
        default:
            return '';
    }
}
//# sourceMappingURL=bibtexutils.js.map