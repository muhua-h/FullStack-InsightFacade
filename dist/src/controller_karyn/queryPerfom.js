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
Object.defineProperty(exports, "__esModule", { value: true });
const IInsightFacade_1 = require("./IInsightFacade");
const fs = __importStar(require("fs-extra"));
class QueryPerform {
    query;
    usedFields = [];
    usedField = "";
    constructor(query) {
        this.query = query;
        for (let col of (this.query.OPTIONS.COLUMNS)) {
            this.usedField = col.split("_")[1];
            this.usedFields.push(this.usedField);
        }
    }
    getDatasetID() {
        let idStringBeforeSplit = this.query.OPTIONS.COLUMNS[0];
        return idStringBeforeSplit.split("_")[0];
    }
    async smallPerformQuery() {
        let result = [];
        let id = this.getDatasetID();
        let dataset;
        try {
            dataset = await fs.readJSON("data/content_" + id + ".json");
        }
        catch (error) {
            console.log("no id found");
        }
        for (let data of dataset) {
            if (this.performWhere(data)) {
                result.push(data);
            }
        }
        if (result.length > 5000) {
            throw (new IInsightFacade_1.ResultTooLargeError());
        }
        result = this.performOptions(result);
        return result;
    }
    performWhere(data) {
        let body = this.query.WHERE;
        if (Object.keys(body).length === 0) {
            return true;
        }
        return this.performFilter(body, data);
    }
    performFilter(filter, data) {
        let key = Object.keys(filter)[0];
        if (key === "AND") {
            return this.performAnd(filter[key], data);
        }
        if (key === "OR") {
            return this.performOr(filter[key], data);
        }
        if (key === "GT") {
            return this.performGT(filter[key], data);
        }
        if (key === "LT") {
            return this.performLT(filter[key], data);
        }
        if (key === "EQ") {
            return this.performEQ(filter[key], data);
        }
        if (key === "NOT") {
            return this.performNot(filter[key], data);
        }
        if (key === "IS") {
            return this.performIs(filter[key], data);
        }
        return false;
    }
    performAnd(filterList, data) {
        for (let filter of filterList) {
            if (!this.performFilter(filter, data)) {
                return false;
            }
        }
        return true;
    }
    performOr(filterList, data) {
        for (let filter of filterList) {
            if (this.performFilter(filter, data)) {
                return true;
            }
        }
        return false;
    }
    performLT(filter, data) {
        let mkey = Object.keys(filter)[0];
        let mfield = mkey.split("_")[1];
        let number = Object.values(filter)[0];
        return (data[mfield] < number);
    }
    performGT(filter, data) {
        let mkey = Object.keys(filter)[0];
        let mfield = mkey.split("_")[1];
        let number = Object.values(filter)[0];
        return (data[mfield]) > number;
    }
    performEQ(filter, data) {
        let mkey = Object.keys(filter)[0];
        let mfield = mkey.split("_")[1];
        let number = Object.values(filter)[0];
        return data[mfield] === number;
    }
    performIs(filter, data) {
        let skey = Object.keys(filter)[0];
        let inputString = Object.values(filter)[0];
        let sfield = skey.split("_")[1];
        if (inputString.includes("*")) {
            let last = inputString.length - 1;
            if ((inputString.charAt(0) === "*") && (inputString.charAt(last) !== "*")) {
                inputString = "." + inputString + "$";
            }
            else if ((inputString.charAt(0) !== "*") && (inputString.charAt(last) === "*")) {
                inputString = "^" + inputString;
                last = inputString.length - 1;
                inputString = inputString.slice(0, last) + "." + inputString.slice(last);
            }
            else if ((inputString.charAt(0) === "*") && (inputString.charAt(last) === "*")) {
                inputString = "." + inputString;
                last = inputString.length - 1;
                inputString = inputString.slice(0, last) + "." + inputString.slice(last);
            }
            let regExp = new RegExp(inputString);
            return regExp.test(data[sfield]);
        }
        return data[sfield] === inputString;
    }
    performNot(filter, data) {
        return !this.performFilter(filter, data);
    }
    performOptions(oldResult) {
        let newResult = oldResult.map((obj) => {
            let newObj = {};
            this.usedFields.forEach((prop) => {
                newObj[this.getDatasetID() + "_" + prop] = obj[prop];
            });
            return newObj;
        });
        if (Object.keys(this.query.OPTIONS).length === 2) {
            newResult = this.performOrder(newResult, (this.query.OPTIONS.ORDER));
        }
        return newResult;
    }
    performOrder(notOrdered, key) {
        return notOrdered.sort((a, b) => {
            if (a[key] < b[key]) {
                return -1;
            }
            else if (a[key] > b[key]) {
                return 1;
            }
            else {
                return 0;
            }
        });
    }
}
exports.default = QueryPerform;
//# sourceMappingURL=queryPerfom.js.map