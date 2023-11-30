import QuerySyntaxCheck from "./querySyntaxCheck";
import {InsightDatasetKind} from "./IInsightFacade";
import * as fs from "fs-extra";
export default class QuerySemanticsCheck {
	private query: any;
	// for later key check
	private colCheckKey: string[] = [];
	private usedApplyKey: string[] = [];
	private usedMKey: string[] = [];
	private usedSKey: string[] = [];
	private usedColKey: string[] = [];
	private mfieldSec = ["avg", "pass", "fail", "audit", "year"];
	private sfieldSec = ["dept", "id", "instructor", "title", "uuid"];
	private mfieldRoo = ["lat", "lon", "seats"];
	private sfieldRoo = ["fullname", "shortname" ,"number", "name", "address", "type", "furniture", "href"];
	private idstring: string[] = [];
	private numDataset: number = 1;
	private mkeySec: string[] = [];
	private skeySec: string[] = [];
	private mkeyRoo: string[] = [];
	private skeyRoo: string[] = [];
	private SyntaxCheckInstance;
	constructor(idStr: string[], query: any) {
		this.query = query;
		this.idstring = idStr;
		this.SyntaxCheckInstance = new QuerySyntaxCheck(idStr, query);
	}

	private getDatasetID(): string {
		let idStringBeforeSplit = "";
		if((Object.keys(this.query)).length === 3){ // if there is transformation, we get id from group
			let trans = this.query.TRANSFORMATIONS;
			let groupValues = Object.values(trans.GROUP) as string[];
			idStringBeforeSplit = groupValues[0];
			return idStringBeforeSplit.split("_")[0];
		}else{ // if no transformation
			idStringBeforeSplit = this.query.OPTIONS.COLUMNS[0]; // there is no case of applykey anymore!
			return idStringBeforeSplit.split("_")[0];
		}
	}

	private getMkeys(kind: InsightDatasetKind): void {
		if(kind === "sections"){
			for (let mf of this.mfieldSec){
				this.mkeySec.push(this.getDatasetID() + "_" + mf);
			}
		}else{ // kind = rooms
			for (let mf of this.mfieldRoo){
				this.mkeyRoo.push(this.getDatasetID() + "_" + mf);
			}
		}
	}

	private getSkeys(kind: InsightDatasetKind): void {
		if(kind === "sections"){
			for (let sf of this.sfieldSec){
				this.skeySec.push(this.getDatasetID() + "_" + sf);
			}
		}else{ // kind = rooms
			for (let sf of this.sfieldRoo){
				this.skeyRoo.push(this.getDatasetID() + "_" + sf);
			}
		}
	}

	private async beforeSemanticsCheck(kind: InsightDatasetKind): Promise<void>{
		this.getMkeys(kind);
		this.getSkeys(kind);
		if (this.SyntaxCheckInstance.syntaxCheck()){ // if there is no syntax err (should be)
			this.usedMKey = this.SyntaxCheckInstance.usedMKey;
			this.usedSKey = this.SyntaxCheckInstance.usedSKey;
			this.usedColKey = this.SyntaxCheckInstance.usedColKey;
		}
	}

	private oneDatasetValidator(): boolean{ // check the query used only one dataset or not
		const allUsedKey = [...this.usedColKey, ...this.usedMKey, ...this.usedSKey];
		const allUsedID: string[] = [];
		for (let uk of allUsedKey){
			if(uk.includes("_")){ // then uk is not an applykey
				allUsedID.push(uk.split("_")[0]);// first part of a valid key is the dataset id
			}
		}
		let uid1 = allUsedID[0];
		for (let uid of allUsedID){
			if(uid !== uid1){
				this.numDataset++;
			}
		}
		if(this.numDataset !== 1){ // query can only have one dataset
			return false;
		}
		return true;
	}

	private usedKeysValidator(kind: InsightDatasetKind): boolean{
		if(kind === "sections"){
			for (let usedM of this.usedMKey){
				if(!this.mkeySec.includes(usedM)){
					return false;
				}
			}
			for (let usedS of this.usedSKey){ // if in SCOMPARISON the key is not skeySec, then invalid
				if(!this.skeySec.includes(usedS)){
					return false;
				}
			}
		}else{ // kind = rooms
			for (let usedM of this.usedMKey){
				if(!this.mkeyRoo.includes(usedM)){
					return false;
				}
			}
			for (let usedS of this.usedSKey){ // if in SCOMPARISON the key is not skeyRoo, then invalid
				if(!this.skeyRoo.includes(usedS)){
					return false;
				}
			}
		}
		return true;
	}

	private colSemanticsValidator(kind: InsightDatasetKind): boolean{
		const allSecKey = [...this.skeySec, ...this.mkeySec];
		const allRooKey = [...this.skeyRoo, ...this.mkeyRoo];
		if((Object.keys(this.query)).length === 2){ // no transformation
			if(kind === "sections"){
				if(!((this.query.OPTIONS.COLUMNS).every((col: string) => allSecKey.includes(col)))){
					return false;
				}
				return true;
			}else{ // when kind is "rooms"
				if(!((this.query.OPTIONS.COLUMNS).every((col: string) => allRooKey.includes(col)))){
					return false;
				}
				return true;
			}
		}else{ // if transformation exits
			for(let applyRule of this.query.TRANSFORMATIONS.APPLY){
				let applyKey = Object.keys(applyRule)[0];
				this.colCheckKey.push(applyKey);
			} // check whether the ANYKEY_LIST / KEY_LIST in col is valid or not
			for(let group of this.query.TRANSFORMATIONS.GROUP){
				this.colCheckKey.push(group);
			}
			if(kind === "sections"){
				for(let col of this.query.OPTIONS.COLUMNS){
					if(!this.colCheckKey.includes(col)){
						return false;
					}
					if(col.includes("_")){ // then col should either be skey or mkey
						if(!allSecKey.includes(col)){
							return false;
						}
					}
				}
				return true;
			}else{ // kind = rooms
				for(let col of this.query.OPTIONS.COLUMNS){
					if(!this.colCheckKey.includes(col)){
						return false;
					}
					if(col.includes("_")){ // then col should either be skey or mkey
						if(!allRooKey.includes(col)){
							return false;
						}
					}
				}
				return true;
			}
		}
	}

	private orderSemanticsValidator(): boolean{
		const allSecKey = [...this.skeySec, ...this.mkeySec];
		const allRooKey = [...this.skeyRoo, ...this.mkeyRoo];
		// check if the order is also in col(if order exist)
		if(Object.keys(this.query.OPTIONS).length === 2){ // options: col, sort(order)
			let order = this.query.OPTIONS.ORDER;
			if(typeof order === "object"){
				for (let key of order.keys){ // In the anykeyList, each anykey cannot have underscore
					if(key.includes("_")){ // if a key has underscore and it is an applykey
						if(!allSecKey.includes(key) && !allRooKey.includes(key)){
							return false;
						}
					}
					if(!(this.query.OPTIONS.COLUMNS).includes(key)){
						return false;
					}
				}
				return true;
			}else{ // if order is just ANYKEY (single string)
				if(order.includes("_")){ // if a key has underscore and it is an applykey
					if(!allSecKey.includes(order) && !allRooKey.includes(order)){
						return false;
					}
				}
				if(!(this.query.OPTIONS.COLUMNS).includes(order)){
					return false;
				}
				return true;
			}
		}else{ // if there is only col
			return true; // order = true
		}
	}

	private transSemanticsValidator(kind: InsightDatasetKind): boolean{
		return (this.groupSemanticsValidator(kind) && this.applySemanticsValidator(kind));
	}

	private groupSemanticsValidator(kind: InsightDatasetKind): boolean{
		// check GROUP KEY_LIST
		let trans = this.query.TRANSFORMATIONS;
		const allSecKey = [...this.skeySec, ...this.mkeySec];
		const allRooKey = [...this.skeyRoo, ...this.mkeyRoo];
		if(kind === "sections"){
			for(let key of trans.GROUP){
				if(!allSecKey.includes(key)){
					return false;
				}
			}
			return true;
		}else{ // kind = rooms
			for(let key of trans.GROUP){
				if(!allRooKey.includes(key)){
					return false;
				}
			}
			return true;
		}
		return false;
	}

	private applySemanticsValidator(kind: InsightDatasetKind): boolean{
		let trans = this.query.TRANSFORMATIONS;
		const allSecKey = [...this.skeySec, ...this.mkeySec];
		const allRooKey = [...this.skeyRoo, ...this.mkeyRoo];
		if(trans.APPLY.length !== 0){ // apply is not empty
			for(let applyRule of trans.APPLY){
				let applyKey = Object.keys(applyRule)[0];
				this.usedApplyKey.push(applyKey); // later check duplicates of applyKey
				let applyValue = Object.values(applyRule) as any[];
				let applyTokenTemp = Object.keys(applyValue[0])[0];
				let applyRuleKey = Object.values(applyValue[0])[0] as string;
				let numericalApplyToken = ["MAX","MIN","AVG","SUM"];
				if(numericalApplyToken.includes(applyTokenTemp)){
					 if(!this.mkeyRoo.includes(applyRuleKey) && !this.mkeySec.includes(applyRuleKey)){
						 return false;
					 }
				}
				if(kind === "sections"){
					if(!(allSecKey.includes(applyRuleKey))){
						return false;
					}
				}else{ // kind = rooms
					if(!(allRooKey.includes(applyRuleKey))){
						return false;
					}
				}
			}
			const hasDuplicates = new Set(this.usedApplyKey).size !== this.usedApplyKey.length; // duplicate applyKey or not
			if(hasDuplicates){
				return false;
			}
			return true;
		}else{ // apply is empty
			return true;
		}
	}

	// main function
	public async semanticsCheck(): Promise<boolean>{
		let idList, datasetList, kind: any;
		try{
			idList = await fs.readJSON("data/metadata_id.json");
			datasetList = await fs.readJSON("data/metadata_dataset.json");
			let index: number = idList.indexOf(this.getDatasetID());
			kind = datasetList[index].kind;
		}catch(err){
			console.log("No id found!");
		}
		this.beforeSemanticsCheck(kind);
		let used = this.usedKeysValidator(kind);
		let col = this.colSemanticsValidator(kind);
		let one = this.oneDatasetValidator();
		let order = this.orderSemanticsValidator();
		if((Object.keys(this.query)).length === 3){ // query has transformation
			let trans = this.transSemanticsValidator(kind);
			return (used && col && one && trans && order);
		}
		return (used && col && one && order);
	}
}
