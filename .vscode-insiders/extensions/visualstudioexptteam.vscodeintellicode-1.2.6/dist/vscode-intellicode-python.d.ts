/*! Copyright (c) Microsoft Corporation. All rights reserved. */
import * as vsi from "@vsintellicode/vscode-intellicode-api";
import * as semver from "semver";
export declare class PythonSupport implements vsi.IIntelliCodeLanguageSupport {
    getRequestedConfig(): vsi.IRequestedConfigSetting[];
    activate(api: vsi.IIntelliCode, logger: (str: string) => void): Promise<void>;
    getSubDirectories(rootDir: string): Promise<string[]>;
    getFolderVersion(dirName: string): semver.SemVer;
}
