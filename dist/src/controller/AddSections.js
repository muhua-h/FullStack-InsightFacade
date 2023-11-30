"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jszip_1 = __importDefault(require("jszip"));
const IInsightFacade_1 = require("./IInsightFacade");
class AddSections {
    async readSectionsFromZip(content) {
        let files = await this.readZipToFiles(content);
        return this.readFileToSections(files);
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
}
exports.default = AddSections;
//# sourceMappingURL=AddSections.js.map