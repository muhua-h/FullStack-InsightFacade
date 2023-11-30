"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class QuerySyntaxCheck {
    query;
    usedMKey = [];
    usedSKey = [];
    usedColKey = [];
    idstring = [];
    applyToken = ["MAX", "MIN", "AVG", "SUM", "COUNT"];
    constructor(idStr, query) {
        this.query = query;
        this.idstring = idStr;
    }
    syntaxCheck() {
        if (this.query == null) {
            return false;
        }
        if (((Object.keys(this.query)).length !== 2) && ((Object.keys(this.query)).length !== 3)) {
            return false;
        }
        if (!(Object.keys(this.query)).includes("WHERE") || !(Object.keys(this.query)).includes("OPTIONS")) {
            return false;
        }
        if ((Object.keys(this.query)).length === 3) {
            if (!(Object.keys(this.query)).includes("TRANSFORMATIONS")) {
                return false;
            }
        }
        if ((Object.keys(this.query)).length === 2) {
            return (this.bodyValidator() && this.optionsValidator());
        }
        else {
            return (this.bodyValidator() && this.optionsValidator() && this.transformationsValidator());
        }
    }
    bodyValidator() {
        let body = this.query.WHERE;
        if (!(body instanceof Object)) {
            return false;
        }
        if (Object.keys(body).length !== 1 && Object.keys(body).length !== 0) {
            return false;
        }
        if (Object.keys(body).length === 0) {
            return true;
        }
        return this.filterValidator(body);
    }
    filterValidator(filter) {
        if (Object.keys(filter).length !== 1) {
            return false;
        }
        let key = Object.keys(filter)[0];
        if (key === "AND" || key === "OR") {
            if (!(filter[key] instanceof Array)) {
                return false;
            }
            return this.logicCompareValidator(filter[key]);
        }
        if (!(filter[key] instanceof Object)) {
            return false;
        }
        if (key === "LT" || key === "GT" || key === "EQ") {
            return this.mCompareValidator(filter[key]);
        }
        if (key === "IS") {
            return this.sCompareValidator(filter[key]);
        }
        if (key === "NOT") {
            return this.negateValidator(filter[key]);
        }
        return false;
    }
    logicCompareValidator(logicCompare) {
        if ((logicCompare.length <= 0)) {
            return false;
        }
        if (!(logicCompare instanceof Object)) {
            return false;
        }
        for (let logic of logicCompare) {
            if (!(this.filterValidator(logic))) {
                return false;
            }
        }
        return true;
    }
    mCompareValidator(numCompare) {
        if (Object.keys(numCompare).length !== 1) {
            return false;
        }
        let mkey = Object.keys(numCompare)[0];
        let number = Object.values(numCompare)[0];
        if ((typeof number !== "number")) {
            return false;
        }
        this.usedMKey.push(mkey);
        return true;
    }
    sCompareValidator(strCompare) {
        if (Object.keys(strCompare).length !== 1) {
            return false;
        }
        let skey = Object.keys(strCompare)[0];
        let inputString = Object.values(strCompare)[0];
        if ((typeof inputString !== "string")) {
            return false;
        }
        if (inputString.includes("*")) {
            let size = inputString.length;
            for (let [index, char] of [...inputString].entries()) {
                if (char === "*") {
                    if ((index !== 0) && (index !== size - 1)) {
                        return false;
                    }
                }
            }
        }
        this.usedSKey.push(skey);
        return true;
    }
    negateValidator(notCompare) {
        if (Object.keys(notCompare).length <= 0 || Object.keys(notCompare).length > 1) {
            return false;
        }
        return this.filterValidator(notCompare);
    }
    optionsValidator() {
        if (Object.keys(this.query.OPTIONS).length !== 1 && Object.keys(this.query.OPTIONS).length !== 2) {
            return false;
        }
        if (!Object.keys(this.query.OPTIONS).includes("COLUMNS")) {
            return false;
        }
        if (Object.keys(this.query.OPTIONS).length === 2) {
            if (((Object.keys(this.query.OPTIONS)[1] === "ORDER" && Object.keys(this.query.OPTIONS)[0] === "COLUMNS") ||
                (Object.keys(this.query.OPTIONS)[0] === "ORDER" && Object.keys(this.query.OPTIONS)[1] === "COLUMNS"))) {
            }
            else {
                return false;
            }
        }
        let colValid = this.colValidator(this.query.OPTIONS.COLUMNS);
        let ordValid = true;
        if (Object.keys(this.query.OPTIONS).length === 2) {
            ordValid = this.orderValidator(this.query.OPTIONS.ORDER);
        }
        return (colValid && ordValid);
    }
    colValidator(colList) {
        if (!(colList instanceof Array)) {
            return false;
        }
        if (colList.length <= 0) {
            return false;
        }
        for (let col of colList) {
            if (typeof col !== "string") {
                return false;
            }
            this.usedColKey.push(col);
        }
        return true;
    }
    orderValidator(order) {
        if (order === null) {
            return false;
        }
        if (typeof order !== "string" && typeof order !== "object") {
            return false;
        }
        if (typeof order === "object") {
            if (!(order.keys instanceof Array)) {
                return false;
            }
            if (Object.keys(order).length !== 2) {
                return false;
            }
            if (!Object.keys(order).includes("dir") || !Object.keys(order).includes("keys")) {
                return false;
            }
            if (typeof order.dir !== "string") {
                return false;
            }
            if (order.dir !== "UP" && order.dir !== "DOWN") {
                return false;
            }
            if ((order.keys.length <= 0) || order.keys === null) {
                return false;
            }
        }
        return true;
    }
    transformationsValidator() {
        let trans = this.query.TRANSFORMATIONS;
        if (trans === null) {
            return false;
        }
        if (Object.keys(trans).length !== 2) {
            return false;
        }
        if (!Object.keys(trans).includes("GROUP") || !Object.keys(trans).includes("APPLY")) {
            return false;
        }
        if (!((trans.GROUP) instanceof Array)) {
            return false;
        }
        if ((Object.keys(trans.GROUP)).length <= 0) {
            return false;
        }
        let APPLYRULE_LIST = trans.APPLY;
        if (!(APPLYRULE_LIST instanceof Array)) {
            return false;
        }
        for (let applyRule of APPLYRULE_LIST) {
            let applyKey = Object.keys(applyRule);
            if (applyKey.length !== 1) {
                return false;
            }
            if (applyKey.includes("_")) {
                return false;
            }
            let applyValue = Object.values(applyRule);
            let applyTokenTemp = Object.keys(applyValue[0])[0];
            if (Object.keys(applyValue[0]).length !== 1) {
                return false;
            }
            if (!this.applyToken.includes(applyTokenTemp)) {
                return false;
            }
        }
        return true;
    }
}
exports.default = QuerySyntaxCheck;
//# sourceMappingURL=querySyntaxCheck.js.map