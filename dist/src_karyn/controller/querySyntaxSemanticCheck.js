"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class QuerySyntaxSemanticCheck {
    query;
    usedMKey = [];
    usedSKey = [];
    usedColKey = [];
    mfield = ["avg", "pass", "fail", "audit", "year"];
    sfield = ["dept", "id", "instructor", "title", "uuid"];
    idstring = [];
    numDataset = 1;
    mkey = [];
    skey = [];
    constructor(idStr, query) {
        this.query = query;
        this.idstring = idStr;
        for (let mf of this.mfield) {
            for (let ids of this.idstring) {
                this.mkey.push(ids + "_" + mf);
            }
        }
        for (let sf of this.sfield) {
            for (let ids of this.idstring) {
                this.skey.push(ids + "_" + sf);
            }
        }
    }
    syntaxSemanticCheck() {
        if (this.query == null) {
            return false;
        }
        if ((Object.keys(this.query)).length !== 2) {
            return false;
        }
        if (!(Object.keys(this.query)).includes("WHERE") || !(Object.keys(this.query)).includes("OPTIONS")) {
            return false;
        }
        return (this.bodyValidator() && this.optionsValidator() && this.semanticValidator());
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
            this.usedColKey.push(col);
        }
        return true;
    }
    orderValidator(order) {
        return (typeof order === "string");
    }
    semanticValidator() {
        if (Object.keys(this.query.OPTIONS).length === 2) {
            if (!(this.query.OPTIONS.COLUMNS).includes(this.query.OPTIONS.ORDER)) {
                return false;
            }
            if (!(this.mkey.includes(this.query.OPTIONS.ORDER)) && !(this.skey.includes(this.query.OPTIONS.ORDER))) {
                return false;
            }
        }
        const allKey = [...this.skey, ...this.mkey];
        if (!((this.query.OPTIONS.COLUMNS).every((col) => allKey.includes(col)))) {
            return false;
        }
        for (let usedM of this.usedMKey) {
            if (!this.mkey.includes(usedM)) {
                return false;
            }
        }
        for (let usedS of this.usedSKey) {
            if (!this.skey.includes(usedS)) {
                return false;
            }
        }
        const allUsedKey = [...this.usedColKey, ...this.usedMKey, ...this.usedSKey];
        const allUsedID = [];
        for (let uk of allUsedKey) {
            allUsedID.push(uk.split("_")[0]);
        }
        let uid1 = allUsedID[0];
        for (let uid of allUsedID) {
            if (uid !== uid1) {
                this.numDataset++;
            }
        }
        return (this.numDataset === 1);
    }
}
exports.default = QuerySyntaxSemanticCheck;
//# sourceMappingURL=querySyntaxSemanticCheck.js.map