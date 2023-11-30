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
const AddSections_1 = __importDefault(require("./AddSections"));
const querySyntaxCheck_1 = __importDefault(require("./querySyntaxCheck"));
const querySemanticsCheck_1 = __importDefault(require("./querySemanticsCheck"));
const queryPerfom_1 = __importDefault(require("./queryPerfom"));
const HTMLreader_1 = __importDefault(require("./HTMLreader"));
const BuildingInfoLoader_1 = __importDefault(require("./BuildingInfoLoader"));
class InsightFacade {
    datasets = [];
    ids = [];
    path_metadata_id = "data/metadata_id.json";
    path_metadata_dataset = "data/metadata_dataset.json";
    addSections;
    htmlReader;
    buildingInfoLoader;
    constructor() {
        console.log("InsightFacadeImpl::init()");
        this.addSections = new AddSections_1.default();
        this.htmlReader = new HTMLreader_1.default();
        this.buildingInfoLoader = new BuildingInfoLoader_1.default();
        if (!fs.existsSync("test/resources/archives")) {
            console.log("zip file not found");
        }
        if (!fs.existsSync("data")) {
            fs.mkdirSync("data");
            this.ids = [];
            this.datasets = [];
            fs.writeFileSync(this.path_metadata_id, JSON.stringify(this.ids));
            fs.writeFileSync(this.path_metadata_dataset, JSON.stringify(this.datasets));
        }
        else {
            if (!fs.existsSync(this.path_metadata_id) || !fs.existsSync(this.path_metadata_dataset)) {
                this.ids = [];
                this.datasets = [];
                fs.writeFileSync(this.path_metadata_id, JSON.stringify(this.ids));
                fs.writeFileSync(this.path_metadata_dataset, JSON.stringify(this.datasets));
            }
            else {
                fs.ensureDirSync("data");
                this.ids = JSON.parse(fs.readFileSync(this.path_metadata_id, "utf8"));
                this.datasets = JSON.parse(fs.readFileSync(this.path_metadata_dataset, "utf8"));
            }
        }
    }
    async addDataset(id, content, kind) {
        if (!this.isIDvalid(id)) {
            return Promise.reject(new IInsightFacade_1.InsightError("input is invalid"));
        }
        let jsonContent = [];
        if (kind === IInsightFacade_1.InsightDatasetKind.Sections) {
            jsonContent = await this.addSections.readSectionsFromZip(content);
        }
        else if (kind === IInsightFacade_1.InsightDatasetKind.Rooms) {
            await this.htmlReader.unzipHTMLFolder(content);
            jsonContent = await this.buildingInfoLoader.getBuildingAndRoomInfo();
        }
        if (jsonContent.length === 0) {
            return Promise.reject(new IInsightFacade_1.InsightError("no jsonContent found"));
        }
        let newDataset = {
            id: id,
            kind: kind,
            numRows: jsonContent.length
        };
        if (this.ids.includes(id)) {
            return Promise.reject(new IInsightFacade_1.InsightError("id already exists"));
        }
        else {
            this.ids.push(id);
            this.datasets.push(newDataset);
        }
        try {
            await fs.writeFile("data/content_" + id + ".json", JSON.stringify(jsonContent));
            await fs.writeFile(this.path_metadata_id, JSON.stringify(this.ids));
            await fs.writeFile(this.path_metadata_dataset, JSON.stringify(this.datasets));
        }
        catch (error) {
            return Promise.reject(new IInsightFacade_1.InsightError("unable to write to disk"));
        }
        return Promise.resolve(this.ids);
    }
    async removeDataset(id) {
        if (!this.isIDvalid(id) || !fs.existsSync("data")) {
            return Promise.reject(new IInsightFacade_1.InsightError("id is empty or data folder is empty"));
        }
        if (!this.ids.includes(id)) {
            return Promise.reject(new IInsightFacade_1.NotFoundError("id not found"));
        }
        let index = this.ids.indexOf(id);
        this.ids.splice(index, 1);
        this.datasets.splice(index, 1);
        try {
            fs.removeSync("data/content_" + id + ".json");
            await fs.writeFile(this.path_metadata_id, JSON.stringify(this.ids));
            await fs.writeFile(this.path_metadata_dataset, JSON.stringify(this.datasets));
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
        query = query;
        try {
            let ids = await fs.readJSON("data/metadata_id.json");
            let datasetList = await fs.readJSON("data/metadata_dataset.json");
            let QuerySyntaxValidator = new querySyntaxCheck_1.default(ids, query);
            if (!QuerySyntaxValidator.syntaxCheck()) {
                return Promise.reject(new IInsightFacade_1.InsightError("Query Syntax Err!"));
            }
            console.log("passed syntax validation");
            let QuerySemanticsValidator = new querySemanticsCheck_1.default(ids, query);
            let semantics = await QuerySemanticsValidator.semanticsCheck();
            if (!semantics) {
                return Promise.reject(new IInsightFacade_1.InsightError("Query Semantics Err!"));
            }
            console.log("passed semantics validation");
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
    isIDvalid(id) {
        if (id.includes("_") || id.trim() === "") {
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