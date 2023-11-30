"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SectionDataset = void 0;
const Section_1 = require("./Section");
class SectionDataset {
    id;
    sections;
    kind;
    insightDataset;
    constructor(array, id, kind) {
        this.id = "";
        this.sections = [];
        this.id = id;
        this.kind = kind;
        this.insightDataset =
            { id: id, numRows: 0, kind: kind };
        this.parseSection(array);
    }
    parseSection(array) {
        for (let i of array) {
            let sectionInJson;
            try {
                sectionInJson = JSON.parse(i);
                for (let index in sectionInJson.result) {
                    let uuid = sectionInJson.result[index].id;
                    let id = sectionInJson.result[index].Course;
                    let title = sectionInJson.result[index].Title;
                    let instructor = sectionInJson.result[index].Professor;
                    let dept = sectionInJson.result[index].Subject;
                    let year = sectionInJson.result[index].Year;
                    let avg = sectionInJson.result[index].Avg;
                    let pass = sectionInJson.result[index].Pass;
                    let fail = sectionInJson.result[index].Fail;
                    let audit = sectionInJson.result[index].Audit;
                    let sec = sectionInJson.result[index].Section;
                    if (sec.toLowerCase() === "overall") {
                        year = "1900";
                    }
                    if (!("id" in sectionInJson.result[index]) || !("Course" in sectionInJson.result[index]) ||
                        !("Title" in sectionInJson.result[index]) || !("Professor" in sectionInJson.result[index]) ||
                        !("Subject" in sectionInJson.result[index]) || !("Year" in sectionInJson.result[index]) ||
                        !("Avg" in sectionInJson.result[index]) || !("Pass" in sectionInJson.result[index]) ||
                        !("Fail" in sectionInJson.result[index]) || !("Audit" in sectionInJson.result[index])) {
                        continue;
                    }
                    let section = new Section_1.Section(uuid, id, title, instructor, dept, year, avg, pass, fail, audit);
                    this.sections.push(section);
                }
            }
            catch (e) {
                continue;
            }
        }
        this.insightDataset.numRows = this.sections.length;
    }
}
exports.SectionDataset = SectionDataset;
//# sourceMappingURL=SectionDataset.js.map