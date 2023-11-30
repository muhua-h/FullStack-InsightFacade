"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Section = void 0;
class Section {
    uuid;
    id;
    title;
    instructor;
    dept;
    year;
    avg;
    pass;
    fail;
    audit;
    constructor(uuid, id, title, instructor, dept, year, avg, pass, fail, audit) {
        this.uuid = uuid;
        this.id = id;
        this.title = title;
        this.instructor = instructor;
        this.dept = dept;
        this.year = year;
        this.avg = avg;
        this.pass = pass;
        this.fail = fail;
        this.audit = audit;
        this.year = parseInt(this.year.toString(), 10);
    }
    getStr(str) {
        switch (str) {
            case "uuid":
                return this.uuid;
            case "id":
                return this.id;
            case "title":
                return this.title;
            case "instructor":
                return this.instructor;
            case "dept":
                return this.dept;
        }
        return "";
    }
    getNum(str) {
        switch (str) {
            case "year":
                return this.year;
            case "avg":
                return this.avg;
            case "pass":
                return this.pass;
            case "fail":
                return this.fail;
            case "audit":
                return this.audit;
        }
        return 0;
    }
}
exports.Section = Section;
//# sourceMappingURL=Section.js.map