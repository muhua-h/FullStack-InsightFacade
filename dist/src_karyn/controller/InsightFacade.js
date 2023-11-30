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
const IInsightFacade_1 = require("./IInsightFacade");
const fs = __importStar(require("fs-extra"));
const jszip_1 = __importDefault(require("jszip"));
const querySyntaxSemanticCheck_1 = __importDefault(require("./querySyntaxSemanticCheck"));
const queryPerfom_1 = __importDefault(require("./queryPerfom"));
class InsightFacade {
    datasets = [];
    ids = [];
    constructor() {
        console.log("InsightFacadeImpl::init()");
        if (!fs.existsSync("test/resources/archives")) {
            console.log("zip file not found");
        }
        if (!fs.existsSync("data")) {
            fs.mkdirSync("data");
            this.ids = [];
            this.datasets = [];
        }
        else {
            this.loadDataFromDisk().then(() => console.log("data loaded from disk"))
                .catch(() => console.log("failed to load data from disk"));
        }
    }
    async addDataset(id, content, kind) {
        if (!this.isInputValid(id, kind)) {
            return Promise.reject(new IInsightFacade_1.InsightError("input is invalid"));
        }
        let files = await this.readZipToFiles(content);
        let sections = this.readFileToSections(files);
        if (sections.length === 0) {
            return Promise.reject(new IInsightFacade_1.InsightError("no sections found"));
        }
        let newDataset = {
            id: id,
            kind: kind,
            numRows: sections.length
        };
        if (this.ids.includes(id)) {
            return Promise.reject(new IInsightFacade_1.InsightError("id already exists"));
        }
        else {
            this.ids.push(id);
            this.datasets.push(newDataset);
        }
        try {
            await fs.writeFile("data/content_" + id + ".json", JSON.stringify(sections));
            await fs.writeFile("data/metadata_id.json", JSON.stringify(this.ids));
            await fs.writeFile("data/metadata_dataset.json", JSON.stringify(this.datasets));
        }
        catch (error) {
            return Promise.reject(new IInsightFacade_1.InsightError("unable to write to disk"));
        }
        return Promise.resolve(this.ids);
    }
    async removeDataset(id) {
        if (!this.isIDvalid(id)) {
            return Promise.reject(new IInsightFacade_1.InsightError("id is empty"));
        }
        else if (!fs.existsSync("data")) {
            return Promise.reject(new IInsightFacade_1.NotFoundError("no data found"));
        }
        if (!this.ids.includes(id)) {
            return Promise.reject(new IInsightFacade_1.NotFoundError("id not found"));
        }
        let index = this.ids.indexOf(id);
        this.ids.splice(index, 1);
        this.datasets.splice(index, 1);
        try {
            fs.removeSync("data/content_" + id + ".json");
            await fs.writeFile("data/metadata_id.json", JSON.stringify(this.ids));
            await fs.writeFile("data/metadata_dataset.json", JSON.stringify(this.datasets));
        }
        catch (error) {
            return Promise.reject(new IInsightFacade_1.InsightError("unable to write to disk"));
        }
        return Promise.resolve(id);
    }
    async listDatasets() {
        return Promise.resolve(this.datasets);
    }
    async performQuery(query) {
        try {
            let ids = await fs.readJSON("data/metadata_id.json");
            let QueryValidator = new querySyntaxSemanticCheck_1.default(ids, query);
            if (!QueryValidator.syntaxSemanticCheck()) {
                return Promise.reject(new IInsightFacade_1.InsightError("Query Syntax and Semantics Err!"));
            }
            let PerformPerform = new queryPerfom_1.default(query);
            let result = PerformPerform.smallPerformQuery();
            return Promise.resolve(result);
        }
        catch (err) {
            if (err instanceof IInsightFacade_1.InsightError) {
                return Promise.reject(new IInsightFacade_1.InsightError());
            }
            else {
                return Promise.reject(new IInsightFacade_1.ResultTooLargeError());
            }
        }
    }
    async loadDataFromDisk() {
        this.ids = await fs.readJSON("data/metadata_id.json");
        this.datasets = await fs.readJSON("data/metadata_dataset.json");
    }
    async readZipToFiles(content) {
        const zip = new jszip_1.default();
        let readFiles = [];
        try {
            await zip.loadAsync(content, { base64: true });
        }
        catch (error) {
            return Promise.reject(new IInsightFacade_1.InsightError("invalid zip file"));
        }
        let temp = Object.keys(zip.files);
        if (!temp.includes("courses/")) {
            return Promise.reject(new IInsightFacade_1.InsightError("invalid zip file"));
        }
        zip.forEach(function (relativePath, file) {
            readFiles.push(file.async("text"));
        });
        let files = await Promise.all(readFiles);
        return Promise.resolve(files);
    }
    readFileToSections(files) {
        let sections = [];
        for (let file of files) {
            if (file.startsWith("{\"result\":[")) {
                let courseSections = JSON.parse(file).result;
                for (let temp of courseSections) {
                    let section = {
                        dept: temp.Subject,
                        id: temp.Course,
                        avg: temp.Avg,
                        instructor: temp.Professor,
                        title: temp.Title,
                        pass: temp.Pass,
                        fail: temp.Fail,
                        audit: temp.Audit,
                        uuid: temp.id.toString(),
                        year: temp.Section === "overall" ? 1900 : parseInt(temp.Year, 10)
                    };
                    if (this.isSectionValid(section)) {
                        sections.push(section);
                    }
                }
            }
        }
        if (sections.length === 0) {
            throw new IInsightFacade_1.InsightError("no valid section");
        }
        return sections;
    }
    isSectionValid(section) {
        return !(section.dept === undefined || section.id === undefined || section.avg === undefined ||
            section.instructor === undefined || section.title === undefined ||
            section.pass === undefined || section.fail === undefined || section.audit === undefined ||
            section.uuid === undefined || section.year === undefined);
    }
    isInputValid(id, kind) {
        if (kind !== IInsightFacade_1.InsightDatasetKind.Sections) {
            return false;
        }
        else if (!this.isIDvalid(id)) {
            return false;
        }
        return true;
    }
    isIDvalid(id) {
        if (id.includes("_")) {
            return false;
        }
        else if (id.trim() === "") {
            return false;
        }
        else if (id.includes(" ") || id.includes("\t") || id.includes("\n") || id.includes("\r")) {
            return false;
        }
        return true;
    }
}
exports.default = InsightFacade;
//# sourceMappingURL=InsightFacade.js.map