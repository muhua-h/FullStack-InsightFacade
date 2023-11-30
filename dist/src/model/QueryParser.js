"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryParser = void 0;
const IInsightFacade_1 = require("../controller/IInsightFacade");
class QueryParser {
    mField = ["avg", "pass", "fail", "audit", "year"];
    sField = ["dept", "id", "instructor", "title", "uuid"];
    mComparator = ["LT", "GT", "EQ"];
    sComparator = ["IS"];
    negation = "NOT";
    logic = ["AND", "OR"];
    sections;
    query;
    WHERE;
    isMatch;
    constructor(sections, query) {
        this.sections = sections;
        this.query = query;
        this.WHERE = query.WHERE;
        this.isMatch = false;
    }
    operateWHERE(Query, sections) {
        let validSections = [];
        for (let section of sections) {
            if (this.operator(this.WHERE, section)) {
                validSections.push(section);
            }
        }
        return validSections;
    }
    operator(query, section) {
        let layer2 = (Object.keys(query)[0]);
        if (this.mComparator.includes(layer2) || this.sComparator.includes(layer2)) {
            let mKey = Object.keys(query)[0];
            let mField = Object.keys(query[mKey])[0];
            let mValue = query[mKey][mField];
            if (typeof (mValue) !== "number") {
                return this.filterStr(section, mKey, mField, mValue);
            }
            else {
                return this.filterNum(section, mKey, mField, mValue);
            }
        }
        else {
            if (layer2 === "OR") {
                this.isMatch = false;
                for (const subQuery of query[layer2]) {
                    this.isMatch ||= this.operator(subQuery, section);
                }
            }
            else if (layer2 === "AND") {
                this.isMatch = true;
                for (const subQuery of query[layer2]) {
                    this.isMatch &&= this.operator(subQuery, section);
                }
            }
            else if (layer2 === "NOT") {
                let itemInNot = query["NOT"];
                this.isMatch = !this.operator(itemInNot, section);
            }
            else {
                throw new IInsightFacade_1.InsightError("unknown operator");
            }
        }
        return this.isMatch;
    }
    filterStr(section, mKey, mField, mValue) {
        let string = (section.getStr(mField.split("_")[1]));
        if ((mValue.charAt(0)) === "*" && (mValue.charAt(mValue.length - 1)) === "*") {
            return string.includes(mValue.substring(1, mValue.length - 1));
        }
        if ((mValue.charAt(mValue.length - 1) === "*")) {
            return this.startsWith(string, mValue.substring(0, mValue.length - 1));
        }
        if ((mValue.charAt(0)) === "*") {
            return this.endsWith(string, mValue.substring(1, mValue.length));
        }
        return section.getStr(mField.split("_")[1]) === mValue;
    }
    endsWith(str, end) {
        const startIndex = str.length - end.length;
        return str.indexOf(end, startIndex) === startIndex;
    }
    startsWith(str1, str2) {
        if (str2.length > str1.length) {
            return false;
        }
        for (let i = 0; i < str2.length; i++) {
            if (str1[i] !== str2[i]) {
                return false;
            }
        }
        return true;
    }
    filterNum(section, mKey, mField, mValue) {
        if (mKey === "GT") {
            if (section.getNum(mField.split("_")[1]) > mValue) {
                return true;
            }
        }
        else if (mKey === "LT") {
            if (section.getNum(mField.split("_")[1]) < mValue) {
                return true;
            }
        }
        else {
            if (section.getNum(mField.split("_")[1]) === mValue) {
                return true;
            }
        }
        return false;
    }
    operateOPTIONS(Query, section, id) {
        let options = Query.OPTIONS;
        let columns = options["COLUMNS"];
        const ir = {};
        for (let column of columns) {
            let nameIdPair = column.split("_");
            let dataSetId = nameIdPair[0];
            let attribute = nameIdPair[1];
            if (attribute === "uuid" || attribute === "id" || attribute === "title"
                || attribute === "instructor" || attribute === "dept") {
                ir[column] = section.getStr(attribute).toString();
            }
            else {
                ir[column] = section.getNum(attribute);
            }
        }
        return ir;
    }
}
exports.QueryParser = QueryParser;
//# sourceMappingURL=QueryParser.js.map