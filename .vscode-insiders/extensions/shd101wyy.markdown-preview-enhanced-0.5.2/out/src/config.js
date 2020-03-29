"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class MarkdownPreviewEnhancedConfig {
    static getCurrentConfig() {
        return new MarkdownPreviewEnhancedConfig();
    }
    constructor() {
        const config = vscode.workspace.getConfiguration("markdown-preview-enhanced");
        this.usePandocParser = config.get("usePandocParser");
        this.breakOnSingleNewLine = config.get("breakOnSingleNewLine");
        this.enableTypographer = config.get("enableTypographer");
        this.enableWikiLinkSyntax = config.get("enableWikiLinkSyntax");
        this.enableLinkify = config.get("enableLinkify");
        this.wikiLinkFileExtension = config.get("wikiLinkFileExtension");
        this.enableEmojiSyntax = config.get("enableEmojiSyntax");
        this.enableExtendedTableSyntax = config.get("enableExtendedTableSyntax");
        this.enableCriticMarkupSyntax = config.get("enableCriticMarkupSyntax");
        this.frontMatterRenderingOption = config.get("frontMatterRenderingOption");
        this.mermaidTheme = config.get("mermaidTheme");
        this.mathRenderingOption = config.get("mathRenderingOption");
        this.mathInlineDelimiters = config.get("mathInlineDelimiters");
        this.mathBlockDelimiters = config.get("mathBlockDelimiters");
        this.mathRenderingOnlineService = config.get("mathRenderingOnlineService");
        this.codeBlockTheme = config.get("codeBlockTheme");
        this.previewTheme = config.get("previewTheme");
        this.revealjsTheme = config.get("revealjsTheme");
        this.protocolsWhiteList = config.get("protocolsWhiteList");
        this.imageFolderPath = config.get("imageFolderPath");
        this.imageUploader = config.get("imageUploader");
        this.printBackground = config.get("printBackground");
        this.chromePath = config.get("chromePath");
        this.imageMagickPath = config.get("imageMagickPath");
        this.pandocPath = config.get("pandocPath");
        this.pandocMarkdownFlavor = config.get("pandocMarkdownFlavor");
        this.pandocArguments = config
            .get("pandocArguments")
            .split(",")
            .map((x) => x.trim());
        this.latexEngine = config.get("latexEngine");
        this.enableScriptExecution = config.get("enableScriptExecution");
        this.scrollSync = config.get("scrollSync");
        this.liveUpdate = config.get("liveUpdate");
        this.singlePreview = config.get("singlePreview");
        this.automaticallyShowPreviewOfMarkdownBeingEdited = config.get("automaticallyShowPreviewOfMarkdownBeingEdited");
        this.enableHTML5Embed = config.get("enableHTML5Embed");
        this.HTML5EmbedUseImageSyntax = config.get("HTML5EmbedUseImageSyntax");
        this.HTML5EmbedUseLinkSyntax = config.get("HTML5EmbedUseLinkSyntax");
        this.HTML5EmbedIsAllowedHttp = config.get("HTML5EmbedIsAllowedHttp");
        this.HTML5EmbedAudioAttributes = config.get("HTML5EmbedAudioAttributes");
        this.HTML5EmbedVideoAttributes = config.get("HTML5EmbedVideoAttributes");
        this.puppeteerWaitForTimeout = config.get("puppeteerWaitForTimeout");
        this.usePuppeteerCore = config.get("usePuppeteerCore");
        this.puppeteerArgs = config.get("puppeteerArgs");
    }
    isEqualTo(otherConfig) {
        const json1 = JSON.stringify(this);
        const json2 = JSON.stringify(otherConfig);
        return json1 === json2;
    }
}
exports.MarkdownPreviewEnhancedConfig = MarkdownPreviewEnhancedConfig;
//# sourceMappingURL=config.js.map