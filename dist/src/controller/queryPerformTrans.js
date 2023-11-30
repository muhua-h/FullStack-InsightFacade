"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const decimal_js_1 = __importDefault(require("decimal.js"));
class QueryPerformTrans {
    query;
    oldResult;
    kind;
    constructor(query, oldResult, kind) {
        this.query = query;
        this.oldResult = oldResult;
        this.kind = kind;
    }
    performTrans() {
        return this.performApply(this.performGroup());
    }
    performGroup() {
        let groupList = this.query.TRANSFORMATIONS.GROUP;
        let grouped = this.oldResult.reduce((map, obj) => {
            let keyMap = new Map();
            for (let group of groupList) {
                group = group.split("_")[1];
                keyMap.set(group, obj[group]);
            }
            const key = JSON.stringify(Object.fromEntries(keyMap));
            const collection = map.get(key);
            if (!collection) {
                map.set(key, [obj]);
            }
            else {
                collection.push(obj);
            }
            return map;
        }, new Map());
        return grouped;
    }
    performApply(oldGrouped) {
        let newResult = [];
        let apply = this.query.TRANSFORMATIONS.APPLY;
        oldGrouped.forEach((realResult, key) => {
            let groupKeys = JSON.parse(key);
            let oneResult = {};
            for (let gkey of Object.keys(groupKeys)) {
                oneResult[gkey] = groupKeys[gkey];
            }
            for (let applyRule of apply) {
                let applyKey = Object.keys(applyRule)[0];
                let applyValue = Object.values(applyRule);
                let applyToken = Object.keys(applyValue[0])[0];
                let applyRuleKey = Object.values(applyValue[0])[0];
                applyRuleKey = applyRuleKey.split("_")[1];
                let resultNum = 0;
                switch (applyToken) {
                    case "MAX":
                        resultNum = this.applyMAX(realResult, applyRuleKey);
                        break;
                    case "MIN":
                        resultNum = this.applyMIN(realResult, applyRuleKey);
                        break;
                    case "AVG":
                        resultNum = this.applyAVG(realResult, applyRuleKey);
                        break;
                    case "COUNT":
                        resultNum = this.applyCOUNT(realResult, applyRuleKey);
                        break;
                    case "SUM":
                        resultNum = this.applySUM(realResult, applyRuleKey);
                        break;
                }
                oneResult[applyKey + "_"] = resultNum;
            }
            newResult.push(oneResult);
        });
        return newResult;
    }
    applyMAX(oldResult, key) {
        let maxNum = (oldResult[0][key]);
        for (let result of oldResult) {
            if (maxNum < result[key]) {
                maxNum = (result[key]);
            }
        }
        return maxNum;
    }
    applyMIN(oldResult, key) {
        let minNum = oldResult[0][key];
        for (let result of oldResult) {
            if (minNum > result[key]) {
                minNum = result[key];
            }
        }
        return minNum;
    }
    applyAVG(oldResult, key) {
        let total = new decimal_js_1.default(0);
        let count = oldResult.length;
        if (count === 0) {
            return 0;
        }
        for (let result of oldResult) {
            let toDecimal = new decimal_js_1.default(result[key]);
            total = total.add(toDecimal);
        }
        let avg = total.toNumber() / count;
        return Number(avg.toFixed(2));
    }
    applySUM(oldResult, key) {
        let sumNum = 0;
        for (let result of oldResult) {
            sumNum = (sumNum + Number(result[key]));
        }
        return Number(sumNum.toFixed(2));
    }
    applyCOUNT(oldResult, key) {
        let temp = [];
        for (let result of oldResult) {
            if (!temp.includes(result[key])) {
                temp.push(result[key]);
            }
        }
        let count = temp.length;
        return count;
    }
}
exports.default = QueryPerformTrans;
//# sourceMappingURL=queryPerformTrans.js.map