"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryHandler = void 0;
const IInsightFacade_1 = require("../controller/IInsightFacade");
const QueryParser_1 = require("./QueryParser");
class QueryHandler {
    mField = ["avg", "pass", "fail", "audit", "year"];
    sField = ["dept", "id", "instructor", "title", "uuid"];
    mComparator = ["LT", "GT", "EQ"];
    sComparator = ["IS"];
    negation = "NOT";
    logic = ["AND", "OR"];
    idList;
    query;
    constructor(query, idList) {
        this.query = query;
        this.idList = idList;
    }
    syntaxCheck(initQuery) {
        if (initQuery.WHERE === undefined || initQuery.OPTIONS === undefined ||
            initQuery.OPTIONS["COLUMNS"] === undefined) {
            throw new IInsightFacade_1.InsightError("no WHERE, OPTIONS, Columns");
        }
        if (!this.checkID(initQuery)) {
            return false;
        }
        return this.checkWhereValue(initQuery.WHERE) && this.checkOptions(initQuery.OPTIONS);
    }
    resolveQuery(query, sections) {
        return new Promise((resolve, reject) => {
            let irList = [];
            let validSections;
            let id = this.getQueryIDByWhere(query.WHERE);
            let queryParser = new QueryParser_1.QueryParser(sections, query);
            validSections = queryParser.operateWHERE(query, sections);
            for (let section of validSections) {
                let ir = queryParser.operateOPTIONS(query, section, id);
                irList.push(ir);
            }
            if (irList.length > 5000) {
                return reject(new IInsightFacade_1.ResultTooLargeError());
                console.log("result too large");
            }
            return resolve(this.rankSections(query, irList));
        });
    }
    rankSections(query, insightResults) {
        let options = query.OPTIONS;
        let order = options["ORDER"];
        if (order === undefined) {
            return insightResults;
        }
        if (this.mField.includes(order.split("_")[1])) {
            insightResults.sort((a, b) => a[order] - b[order]);
        }
        else {
            insightResults.sort((a, b) => (a[order] < b[order] ? 0 : 1));
        }
        return insightResults;
    }
    checkID(Query) {
        let firstID;
        if (Object.keys(Query.WHERE).length !== 0) {
            firstID = this.getQueryIDByWhere(Query.WHERE);
        }
        else {
            firstID = this.getQueryIDByOptions(Query.OPTIONS);
        }
        if (!this.idList.includes(firstID)) {
            throw new IInsightFacade_1.InsightError("ID is not added in id list");
        }
        return this.checkWhereID(Query.WHERE, firstID) && this.checkOptionsID(Query.OPTIONS, firstID);
    }
    getQueryIDByOptions(Options) {
        let firstID;
        let columns = Options["COLUMNS"];
        firstID = this.parseID(columns[0]);
        return firstID;
    }
    getQueryIDByWhere(WHERE) {
        try {
            let key = "";
            let first = (Object.keys(WHERE)[0]);
            if (this.mComparator.includes(first) || this.sComparator.includes(first)) {
                let mComKey = Object.keys(WHERE)[0];
                let IDKey = Object.keys(WHERE[mComKey])[0];
                key = this.parseID(IDKey);
            }
            else if (this.logic.includes(first)) {
                if (!(WHERE[first] instanceof Array)) {
                    throw new IInsightFacade_1.InsightError("logic is not evaluating an array");
                }
                let nextObject = WHERE[first][0];
                key = this.getQueryIDByWhere(nextObject);
            }
            else if (this.negation === first) {
                let itemInNot = WHERE["NOT"];
                key = this.getQueryIDByWhere(itemInNot);
            }
            else {
                throw new IInsightFacade_1.InsightError("not in mComparator/sComparator/negation/logic");
            }
            return key;
        }
        catch (e) {
            throw new IInsightFacade_1.InsightError("cannot get key");
        }
    }
    checkWhereID(where, ID) {
        let first = (Object.keys(where)[0]);
        if (this.logic.includes(first)) {
            for (const item of where[first]) {
                if (!this.checkWhereID(item, ID)) {
                    return false;
                }
            }
        }
        else if (this.mComparator.includes(first)) {
            let IDKey = Object.keys(where[first])[0];
            return ID === this.parseID(IDKey) && this.mField.includes(this.getField(IDKey));
        }
        else if (this.sComparator.includes(first)) {
            let IDKey = Object.keys(where[first])[0];
            return ID === this.parseID(IDKey) && this.sField.includes(this.getField(IDKey));
        }
        else if (this.negation === first) {
            let itemInNot = where["NOT"];
            return this.checkWhereID(itemInNot, ID);
        }
        return true;
    }
    checkOptionsID(options, ID) {
        let columns = options["COLUMNS"];
        for (const item of columns) {
            if (!(this.parseID(item) === ID)) {
                throw new IInsightFacade_1.InsightError("ID incorrect in columns, like sections");
            }
        }
        if (options["ORDER"] !== undefined) {
            let order = options["ORDER"];
            if (!(this.parseID(order) === ID)) {
                throw new IInsightFacade_1.InsightError("ID incorrect in ORDER, like sections");
            }
        }
        return true;
    }
    checkWhereValue(where) {
        if (Object.keys(where).length !== 1) {
            return false;
        }
        let keyInWhere = (Object.keys(where)[0]);
        let valueInWhere = where[keyInWhere];
        if (this.logic.includes(keyInWhere)) {
            let numberOfItems = Object.keys(valueInWhere).length;
            if (numberOfItems < 1) {
                throw new IInsightFacade_1.InsightError("logic has no item");
            }
            for (const item1 of valueInWhere) {
                if (!this.checkWhereValue(item1)) {
                    return false;
                }
            }
        }
        else if (this.mComparator.includes(keyInWhere)) {
            let numberOfItems = Object.keys(valueInWhere).length;
            if (numberOfItems !== 1) {
                throw new IInsightFacade_1.InsightError("mComparator item number is not 1");
            }
            if (typeof (valueInWhere[Object.keys(valueInWhere)[0]]) !== "number") {
                return false;
            }
        }
        else if (this.sComparator.includes(keyInWhere)) {
            let inputString = (valueInWhere[Object.keys(valueInWhere)[0]]);
            for (let i = 0; i < inputString.length; i++) {
                if ((inputString[i] === "*") && (i !== 0) && (i !== (inputString.length - 1))) {
                    return false;
                }
            }
        }
        else if (keyInWhere === this.negation) {
            let numberOfItems = Object.keys(valueInWhere).length;
            if (numberOfItems !== 1) {
                throw new IInsightFacade_1.InsightError("wrong negation item number");
            }
            let itemInNot = where["NOT"];
            return this.checkWhereValue(itemInNot);
        }
        return true;
    }
    parseID(get) {
        try {
            let ID;
            if (get === undefined) {
                throw new IInsightFacade_1.InsightError("empty ID");
            }
            if (get.indexOf("_") === -1) {
                throw new IInsightFacade_1.InsightError("ID no underscore");
            }
            if (get.split("_").length !== 2) {
                throw new IInsightFacade_1.InsightError("no 2 components after split by underscore");
            }
            ID = get.split("_")[0];
            if (ID === "") {
                throw new IInsightFacade_1.InsightError("No valid ID");
            }
            return ID;
        }
        catch (e) {
            throw new IInsightFacade_1.InsightError("cannot get ID");
        }
    }
    getField(get) {
        let ID;
        ID = get.split("_")[1];
        return ID;
    }
    checkOptions(Options) {
        let columns = Options["COLUMNS"];
        let order = Options["ORDER"];
        return this.checkColumns(columns) && this.checkOrders(order);
    }
    checkColumns(columns) {
        for (const item of columns) {
            let fieldInColumn = this.getField(item);
            if (!this.mField.includes(fieldInColumn) &&
                !this.sField.includes(fieldInColumn)) {
                throw new IInsightFacade_1.InsightError("column listing wrong key");
            }
        }
        return true;
    }
    checkOrders(order) {
        if (order === undefined) {
            return true;
        }
        let fieldInColumn = this.getField(order);
        if (!this.mField.includes(fieldInColumn) &&
            !this.sField.includes(fieldInColumn)) {
            throw new IInsightFacade_1.InsightError("ORDER listing wrong key");
        }
        return true;
    }
}
exports.QueryHandler = QueryHandler;
//# sourceMappingURL=QueryHandler.js.map