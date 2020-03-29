"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../icons/index");
const helpers = require("./../helpers");
/** Restore all configurations to default. */
exports.restoreDefaultConfig = () => {
    const defaultOptions = index_1.getDefaultIconOptions();
    helpers.setThemeConfig('activeIconPack', defaultOptions.activeIconPack, true);
    helpers.setThemeConfig('folders.theme', defaultOptions.folders.theme, true);
    helpers.setThemeConfig('folders.color', defaultOptions.folders.color, true);
    helpers.setThemeConfig('hidesExplorerArrows', defaultOptions.hidesExplorerArrows, true);
    helpers.setThemeConfig('opacity', defaultOptions.opacity, true);
    helpers.setThemeConfig('files.associations', defaultOptions.files.associations, true);
    helpers.setThemeConfig('folders.associations', defaultOptions.folders.associations, true);
    helpers.setThemeConfig('languages.associations', defaultOptions.languages.associations, true);
};
//# sourceMappingURL=restoreConfig.js.map