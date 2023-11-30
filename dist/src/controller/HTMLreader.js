"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jszip_1 = __importDefault(require("jszip"));
const IInsightFacade_1 = require("./IInsightFacade");
const fs = __importStar(require("fs-extra"));
const parse5_1 = require("parse5");
class HTMLreader {
    attrAddress = "views-field views-field-field-building-address";
    attrShortName = "views-field views-field-field-building-code";
    attrTitle = "views-field views-field-title";
    attrImage = "views-field views-field-field-building-image";
    attrNothing = "views-field views-field-nothing";
    buildingTableAttributes = [this.attrAddress, this.attrShortName, this.attrTitle, this.attrImage,
        this.attrNothing];
    attrRoomNumber = "views-field views-field-field-room-number";
    attrRoomFurniture = "views-field views-field-field-room-furniture";
    attrRoomType = "views-field views-field-field-room-type";
    attrRoomCapacity = "views-field views-field-field-room-capacity";
    attrRoomHref = "views-field views-field-nothing";
    roomTableAttributes = [this.attrRoomNumber, this.attrRoomFurniture,
        this.attrRoomType, this.attrRoomCapacity, this.attrRoomHref];
    readIndexFile(path, isBuilding, nodeName) {
        let indexFile;
        try {
            indexFile = fs.readFileSync(path, "utf8");
        }
        catch (err) {
            return null;
        }
        const document = (0, parse5_1.parse)(indexFile);
        let html = this.dfsFindOneItem(document, "html");
        if (html === null) {
            return null;
        }
        let tables = this.dsfFindMultipleNodes(html, "table");
        let validTable;
        if (isBuilding) {
            validTable = this.getTheValidTable(tables, this.buildingTableAttributes);
        }
        else {
            validTable = this.getTheValidTable(tables, this.roomTableAttributes);
        }
        if (validTable === null) {
            return null;
        }
        let trs = this.dsfFindMultipleNodes(validTable, nodeName);
        return trs;
    }
    dsfFindMultipleNodes(node, nodeName) {
        let nodeToVisit = node.childNodes.slice();
        let result = [];
        while (nodeToVisit.length !== 0) {
            let curr = nodeToVisit.pop();
            if (curr.nodeName === nodeName) {
                result.push(curr);
            }
            else if (curr.childNodes) {
                nodeToVisit.push(...curr.childNodes);
            }
        }
        return result;
    }
    dfsFindOneItem(node, nodeName, attrName) {
        let nodeToVisit = node.childNodes.slice();
        while (nodeToVisit.length !== 0) {
            const curr = nodeToVisit.pop();
            if (curr.nodeName === nodeName) {
                return curr;
            }
            else if (curr.childNodes) {
                nodeToVisit.push(...curr.childNodes);
            }
        }
        return null;
    }
    getTheValidTable(tables, requiredAttr) {
        let validTable = null;
        let validTableCount = 0;
        tables.forEach((table) => {
            let attrValue = [];
            if (table.childNodes) {
                let thList = this.dsfFindMultipleNodes(table, "th");
                thList.forEach((th) => {
                    attrValue.push(th.attrs[0].value);
                });
                if (requiredAttr.every((attr) => attrValue.includes(attr))) {
                    validTable = table;
                    validTableCount++;
                }
            }
        });
        if (validTableCount !== 1) {
            return null;
        }
        return validTable;
    }
    ;
    async unzipHTMLFolder(zipFileContent) {
        const zip = await jszip_1.default.loadAsync(zipFileContent, { base64: true });
        const indexFile = zip.file("index.htm");
        if (!indexFile) {
            throw new IInsightFacade_1.InsightError("Could not find index.htm file in zip");
        }
        const tempIndexFilePath = "data/campus/index.htm";
        await indexFile.async("nodebuffer").then((buffer) => {
            return fs.outputFile(tempIndexFilePath, buffer);
        });
        const htmFolder = zip.folder("campus")?.folder("discover")?.folder("buildings-and-classrooms");
        if (!htmFolder) {
            throw new IInsightFacade_1.InsightError("No zip folder");
        }
        const FolderPath = "data/campus";
        await Promise.all(htmFolder.file(/\.htm$/).map(async (file) => {
            const tempFilePath = `${FolderPath}/${file.name}`;
            const fileContent = await file.async("nodebuffer");
            await fs.outputFile(tempFilePath, fileContent);
        }));
    }
    extractTextNodeValue(td) {
        for (const item of td.childNodes) {
            if (item.nodeName === "#text") {
                return item.value.trim();
            }
        }
    }
}
exports.default = HTMLreader;
//# sourceMappingURL=HTMLreader.js.map