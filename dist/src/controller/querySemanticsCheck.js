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
const querySyntaxCheck_1 = __importDefault(require("./querySyntaxCheck"));
const fs = __importStar(require("fs-extra"));
class QuerySemanticsCheck {
    query;
    colCheckKey = [];
    usedApplyKey = [];
    usedMKey = [];
    usedSKey = [];
    usedColKey = [];
    mfieldSec = ["avg", "pass", "fail", "audit", "year"];
    sfieldSec = ["dept", "id", "instructor", "title", "uuid"];
    mfieldRoo = ["lat", "lon", "seats"];
    sfieldRoo = ["fullname", "shortname", "number", "name", "address", "type", "furniture", "href"];
    idstring = [];
    numDataset = 1;
    mkeySec = [];
    skeySec = [];
    mkeyRoo = [];
    skeyRoo = [];
    SyntaxCheckInstance;
    constructor(idStr, query) {
        this.query = query;
        this.idstring = idStr;
        this.SyntaxCheckInstance = new querySyntaxCheck_1.default(idStr, query);
    }
    getDatasetID() {
        let idStringBeforeSplit = "";
        if ((Object.keys(this.query)).length === 3) {
            let trans = this.query.TRANSFORMATIONS;
            let groupValues = Object.values(trans.GROUP);
            idStringBeforeSplit = groupValues[0];
            return idStringBeforeSplit.split("_")[0];
        }
        else {
            idStringBeforeSplit = this.query.OPTIONS.COLUMNS[0];
            return idStringBeforeSplit.split("_")[0];
        }
    }
    getMkeys(kind) {
        if (kind === "sections") {
            for (let mf of this.mfieldSec) {
                this.mkeySec.push(this.getDatasetID() + "_" + mf);
            }
        }
        else {
            for (let mf of this.mfieldRoo) {
                this.mkeyRoo.push(this.getDatasetID() + "_" + mf);
            }
        }
    }
    getSkeys(kind) {
        if (kind === "sections") {
            for (let sf of this.sfieldSec) {
                this.skeySec.push(this.getDatasetID() + "_" + sf);
            }
        }
        else {
            for (let sf of this.sfieldRoo) {
                this.skeyRoo.push(this.getDatasetID() + "_" + sf);
            }
        }
    }
    async beforeSemanticsCheck(kind) {
        this.getMkeys(kind);
        this.getSkeys(kind);
        if (this.SyntaxCheckInstance.syntaxCheck()) {
            this.usedMKey = this.SyntaxCheckInstance.usedMKey;
            this.usedSKey = this.SyntaxCheckInstance.usedSKey;
            this.usedColKey = this.SyntaxCheckInstance.usedColKey;
        }
    }
    oneDatasetValidator() {
        const allUsedKey = [...this.usedColKey, ...this.usedMKey, ...this.usedSKey];
        const allUsedID = [];
        for (let uk of allUsedKey) {
            if (uk.includes("_")) {
                allUsedID.push(uk.split("_")[0]);
            }
        }
        let uid1 = allUsedID[0];
        for (let uid of allUsedID) {
            if (uid !== uid1) {
                this.numDataset++;
            }
        }
        if (this.numDataset !== 1) {
            return false;
        }
        return true;
    }
    usedKeysValidator(kind) {
        if (kind === "sections") {
            for (let usedM of this.usedMKey) {
                if (!this.mkeySec.includes(usedM)) {
                    return false;
                }
            }
            for (let usedS of this.usedSKey) {
                if (!this.skeySec.includes(usedS)) {
                    return false;
                }
            }
        }
        else {
            for (let usedM of this.usedMKey) {
                if (!this.mkeyRoo.includes(usedM)) {
                    return false;
                }
            }
            for (let usedS of this.usedSKey) {
                if (!this.skeyRoo.includes(usedS)) {
                    return false;
                }
            }
        }
        return true;
    }
    colSemanticsValidator(kind) {
        const allSecKey = [...this.skeySec, ...this.mkeySec];
        const allRooKey = [...this.skeyRoo, ...this.mkeyRoo];
        if ((Object.keys(this.query)).length === 2) {
            if (kind === "sections") {
                if (!((this.query.OPTIONS.COLUMNS).every((col) => allSecKey.includes(col)))) {
                    return false;
                }
                return true;
            }
            else {
                if (!((this.query.OPTIONS.COLUMNS).every((col) => allRooKey.includes(col)))) {
                    return false;
                }
                return true;
            }
        }
        else {
            for (let applyRule of this.query.TRANSFORMATIONS.APPLY) {
                let applyKey = Object.keys(applyRule)[0];
                this.colCheckKey.push(applyKey);
            }
            for (let group of this.query.TRANSFORMATIONS.GROUP) {
                this.colCheckKey.push(group);
            }
            if (kind === "sections") {
                for (let col of this.query.OPTIONS.COLUMNS) {
                    if (!this.colCheckKey.includes(col)) {
                        return false;
                    }
                    if (col.includes("_")) {
                        if (!allSecKey.includes(col)) {
                            return false;
                        }
                    }
                }
                return true;
            }
            else {
                for (let col of this.query.OPTIONS.COLUMNS) {
                    if (!this.colCheckKey.includes(col)) {
                        return false;
                    }
                    if (col.includes("_")) {
                        if (!allRooKey.includes(col)) {
                            return false;
                        }
                    }
                }
                return true;
            }
        }
    }
    orderSemanticsValidator() {
        const allSecKey = [...this.skeySec, ...this.mkeySec];
        const allRooKey = [...this.skeyRoo, ...this.mkeyRoo];
        if (Object.keys(this.query.OPTIONS).length === 2) {
            let order = this.query.OPTIONS.ORDER;
            if (typeof order === "object") {
                for (let key of order.keys) {
                    if (key.includes("_")) {
                        if (!allSecKey.includes(key) && !allRooKey.includes(key)) {
                            return false;
                        }
                    }
                    if (!(this.query.OPTIONS.COLUMNS).includes(key)) {
                        return false;
                    }
                }
                return true;
            }
            else {
                if (order.includes("_")) {
                    if (!allSecKey.includes(order) && !allRooKey.includes(order)) {
                        return false;
                    }
                }
                if (!(this.query.OPTIONS.COLUMNS).includes(order)) {
                    return false;
                }
                return true;
            }
        }
        else {
            return true;
        }
    }
    transSemanticsValidator(kind) {
        return (this.groupSemanticsValidator(kind) && this.applySemanticsValidator(kind));
    }
    groupSemanticsValidator(kind) {
        let trans = this.query.TRANSFORMATIONS;
        const allSecKey = [...this.skeySec, ...this.mkeySec];
        const allRooKey = [...this.skeyRoo, ...this.mkeyRoo];
        if (kind === "sections") {
            for (let key of trans.GROUP) {
                if (!allSecKey.includes(key)) {
                    return false;
                }
            }
            return true;
        }
        else {
            for (let key of trans.GROUP) {
                if (!allRooKey.includes(key)) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }
    applySemanticsValidator(kind) {
        let trans = this.query.TRANSFORMATIONS;
        const allSecKey = [...this.skeySec, ...this.mkeySec];
        const allRooKey = [...this.skeyRoo, ...this.mkeyRoo];
        if (trans.APPLY.length !== 0) {
            for (let applyRule of trans.APPLY) {
                let applyKey = Object.keys(applyRule)[0];
                this.usedApplyKey.push(applyKey);
                let applyValue = Object.values(applyRule);
                let applyTokenTemp = Object.keys(applyValue[0])[0];
                let applyRuleKey = Object.values(applyValue[0])[0];
                let numericalApplyToken = ["MAX", "MIN", "AVG", "SUM"];
                if (numericalApplyToken.includes(applyTokenTemp)) {
                    if (!this.mkeyRoo.includes(applyRuleKey) && !this.mkeySec.includes(applyRuleKey)) {
                        return false;
                    }
                }
                if (kind === "sections") {
                    if (!(allSecKey.includes(applyRuleKey))) {
                        return false;
                    }
                }
                else {
                    if (!(allRooKey.includes(applyRuleKey))) {
                        return false;
                    }
                }
            }
            const hasDuplicates = new Set(this.usedApplyKey).size !== this.usedApplyKey.length;
            if (hasDuplicates) {
                return false;
            }
            return true;
        }
        else {
            return true;
        }
    }
    async semanticsCheck() {
        let idList, datasetList, kind;
        try {
            idList = await fs.readJSON("data/metadata_id.json");
            datasetList = await fs.readJSON("data/metadata_dataset.json");
            let index = idList.indexOf(this.getDatasetID());
            kind = datasetList[index].kind;
        }
        catch (err) {
            console.log("No id found!");
        }
        this.beforeSemanticsCheck(kind);
        let used = this.usedKeysValidator(kind);
        let col = this.colSemanticsValidator(kind);
        let one = this.oneDatasetValidator();
        let order = this.orderSemanticsValidator();
        if ((Object.keys(this.query)).length === 3) {
            let trans = this.transSemanticsValidator(kind);
            return (used && col && one && trans && order);
        }
        return (used && col && one && order);
    }
}
exports.default = QuerySemanticsCheck;
//# sourceMappingURL=querySemanticsCheck.js.map