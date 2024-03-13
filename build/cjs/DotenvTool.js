"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
class DotEnvTool {
    path;
    contents;
    nextLine;
    constructor(opts) {
        this.path = opts.path ?? (0, node_path_1.join)(process.cwd(), '.env');
        this.contents = [];
        this.nextLine = 1;
    }
    async load() {
        await this.parse();
    }
    async parse() {
        const data = await (0, promises_1.readFile)(this.path, 'utf-8');
        const lines = data.split('\n');
        let isParsingMultiline = false;
        let multilineKey = null;
        const multiline = [];
        lines.forEach((line) => {
            let newLine = { type: 'blank', lineNumber: this.nextLine };
            if (isParsingMultiline) {
                if (line === '"""') {
                    // closing multiline
                    newLine = {
                        type: 'data',
                        lineNumber: this.nextLine,
                        multiline: true,
                        data: {
                            key: multilineKey,
                            value: multiline.join('\n')
                        }
                    };
                    multilineKey = null;
                    isParsingMultiline = false;
                }
                else {
                    multiline.push(line);
                }
            }
            else if (line.match(/^[a-zA-Z_]+[a-zA-Z0-9_]*/) != null) { // starts with a variable name, it's data
                const [key, value] = line.split('=');
                if (value === '"""') {
                    // multiline data parsing starts
                    isParsingMultiline = true;
                    multilineKey = key;
                }
                else {
                    newLine = {
                        type: 'data',
                        multiline: false,
                        lineNumber: this.nextLine,
                        data: { key, value }
                    };
                }
            }
            else if (line.match(/^#/) != null) { // starts with #, it's a comment
                newLine = {
                    type: 'comment',
                    lineNumber: this.nextLine,
                    value: line
                };
            }
            else if (line.trim().length === 0) {
                newLine = {
                    type: 'blank',
                    lineNumber: this.nextLine
                };
            }
            else {
                throw new Error(`Cannot parse line ${this.nextLine}: "${line}"`);
            }
            if (!isParsingMultiline) {
                this.nextLine++;
                this.contents.push(newLine);
            }
        });
    }
    addBlankLine() {
        this.contents.push({
            type: 'blank',
            lineNumber: this.nextLine++
        });
    }
    addComment(value) {
        if (!value.startsWith('#')) {
            value = `# ${value}`;
        }
        this.contents.push({
            type: 'comment',
            lineNumber: this.nextLine++,
            value
        });
    }
    addKey(key, value, multiline) {
        this.contents.push({
            type: 'data',
            multiline: multiline ?? false,
            lineNumber: this.nextLine++,
            data: { key, value }
        });
    }
    getKeys() {
        const output = [];
        this.contents
            .forEach((line) => {
            if (line.type === 'data') {
                output.push(line.data.key);
            }
        });
        return output;
    }
    getKey(key) {
        const dataLine = this.findKey(key);
        if (dataLine != null) {
            return dataLine.data.value;
        }
        return null;
    }
    hasKey(key) {
        const dataLine = this.findKey(key);
        return dataLine !== undefined;
    }
    updateKey(key, newValue) {
        const dataLine = this.findKey(key);
        if (dataLine != null) {
            dataLine.data.value = newValue;
        }
    }
    findKey(key) {
        const theKey = this.contents.find((line) => {
            return line.type === 'data' && line.data.key === key;
        });
        return theKey;
    }
    updateLine(lineNumber, newLine) {
        if (lineNumber > this.contents.length) {
            throw new Error(`Trying to update line ${lineNumber}, but the file has only ${this.contents.length} lines.`);
        }
        this.contents[lineNumber - 1] = { ...newLine, lineNumber };
    }
    async save(newPath) {
        // get array of strings
        const arr = new Array(this.nextLine - 1);
        for (const line of this.contents) {
            switch (line.type) {
                case 'comment':
                    arr[line.lineNumber - 1] = line.value;
                    break;
                case 'blank':
                    arr[line.lineNumber - 1] = '';
                    break;
                case 'data':
                    if (line.data.value !== null) {
                        const value = (line.multiline ? `"""\n${line.data.value}\n"""` : line.data.value);
                        arr[line.lineNumber - 1] = `${line.data.key}=${value}`;
                    }
                    else {
                        arr[line.lineNumber - 1] = `${line.data.key}=`;
                    }
                    break;
            }
        }
        const path = newPath ?? this.path;
        await (0, promises_1.writeFile)(path, arr.join('\n'));
    }
}
exports.default = DotEnvTool;
