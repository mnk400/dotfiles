"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sudo = require("sudo-prompt");
const child_process_1 = require("child_process");
const fs_1 = require("./fs");
const fs = require("fs");
const path = require("path");
const os = require("os");
const uuid_1 = require("./uuid");
class Script {
    constructor() {
        this.folder = path.join(os.tmpdir(), uuid_1.v4().asHex());
        this.script = "";
    }
    get isWindows() {
        return os.platform() === "win32";
    }
    begin() {
        fs.mkdirSync(this.folder);
        this.command(`cd "${this.folder}"`);
    }
    copy(pathFrom, pathTo) {
        if (this.isWindows) {
            this.command(`copy /Y "${pathFrom}" "${pathTo}"`);
        }
        else {
            this.command(`cp "${pathFrom}" "${pathTo}"`);
        }
    }
    move(pathFrom, pathTo) {
        if (this.isWindows) {
            this.command(`move "${pathFrom}" "${pathTo}"`);
        }
        else {
            this.command(`mv "${pathFrom}" "${pathTo}"`);
        }
    }
    rm(path) {
        if (this.isWindows) {
            this.command(`del "${path}"`);
        }
        else {
            this.command(`rm "${path}"`);
        }
    }
    template(pathFrom, pathTo, values) {
        let template = fs.readFileSync(pathFrom, "utf8");
        values.forEach((value, key) => {
            template = template.replace(`${key}`, value);
        });
        const tmpName = path.basename(pathFrom) + "---" + uuid_1.v4().asHex();
        fs.writeFileSync(path.join(this.folder, tmpName), template, "utf8");
        this.copy(tmpName, pathTo);
    }
    commit(asRoot) {
        return new Promise((resolve, reject) => {
            let name = this.isWindows ? "script.cmd" : "script.sh";
            let script = path.join(this.folder, name);
            fs.writeFileSync(script, this.script);
            const callback = (error, stdout, stderr) => {
                this.cleanup();
                if (error) {
                    console.error(error);
                    reject(error);
                }
                else {
                    if (stdout) {
                        console.log(stdout);
                    }
                    if (stderr) {
                        console.log(stderr);
                    }
                    resolve();
                }
            };
            if (!this.isWindows) {
                script = "/bin/sh " + script;
            }
            console.log(`** Executing "${script}", asRoot: ${asRoot}`);
            if (asRoot) {
                let options = { name: 'VSCode Monkey Patch' };
                sudo.exec(script, options, callback);
            }
            else {
                child_process_1.exec(script, callback);
            }
        });
    }
    cleanup() {
        fs_1.rimrafUnlink(this.folder);
    }
    command(line) {
        this.script += line;
        this.script += "\n";
    }
}
exports.Script = Script;
//# sourceMappingURL=script.js.map