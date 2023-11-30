import {InsightDatasetKind, InsightResult, ResultTooLargeError} from "./IInsightFacade";
import * as fs from "fs-extra";
import QueryPerformTrans from "./queryPerformTrans";

export default class QueryPerform{
	private query: any;
	private usedFields: string[] = [];
	private usedField: string = "";
	constructor(query: any){

		this.query = query;
		for(let col of (this.query.OPTIONS.COLUMNS)){
			if(col.includes("_")){
				this.usedField = col.split("_")[1];
			}else{ // all the applyKey case;
				this.usedField = col + "_"; // match with the underscore case
			}
			this.usedFields.push(this.usedField);
		}
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

	// main func
	public async smallPerformQuery(): Promise<InsightResult[]> {
		let result: InsightResult[] = [];
		let id = this.getDatasetID();
		let dataset, idList, kind, datasetList: any;
		try {
			dataset = await fs.readJSON("data/content_" + id + ".json");
			idList = await fs.readJSON("data/metadata_id.json");
			datasetList = await fs.readJSON("data/metadata_dataset.json");
			let index: number = idList.indexOf(id);
			kind = datasetList[index].kind;
		} catch (error) {
			console.log("no id found");
		}
		// perform Body
		for (let data of dataset) {
			if (this.performWhere(data)) {
				result.push(data);
			}
		}

		// perform Transformation
		if((Object.keys(this.query)).length === 3){
			let queryTrans = new QueryPerformTrans(this.query, result, kind);
			result = queryTrans.performTrans();
		}
		// perform Options
		result = this.performOptions(result);
		// deal with result too large err here (> 5000)
		if (result.length > 5000) {
			throw (new ResultTooLargeError());
		}
		return result;
	}

	private performWhere(data: any): boolean{
		let body = this.query.WHERE;
		// if there is no filter in WHERE
		if(Object.keys(body).length === 0){
			return true;
		}
		return this.performFilter(body, data);
	}

	private performFilter(filter: any, data: any): boolean{
		let key = Object.keys(filter)[0];
		if(key === "AND"){
			return this.performAnd(filter[key], data);
		}
		if(key === "OR"){
			return this.performOr(filter[key], data);
		}
		if(key === "GT"){
			return this.performGT(filter[key], data);
		}
		if(key === "LT"){
			return this.performLT(filter[key], data);
		}
		if(key === "EQ"){
			return this.performEQ(filter[key], data);
		}
		if(key === "NOT"){
			return this.performNot(filter[key], data);
		}
		if(key === "IS"){
			return this.performIs(filter[key], data);
		}
		return false;
	}
	// In each filter

	// if any filter in AND is false, then we return false
	private performAnd(filterList: any, data: any): boolean{
		for (let filter of filterList){
			if(!this.performFilter(filter, data)){
				return false;
			}
		}
		return true;
	}

	// if any filter in OR is true, then we return true
	private performOr(filterList: any, data: any): boolean{
		for (let filter of filterList){
			if(this.performFilter(filter, data)){
				return true;
			}
		}
		return false;
	}

	private performLT(filter: any, data: any): boolean{
		// there's only one filter in LT
		let mkey = Object.keys(filter)[0];
		let mfield = mkey.split("_")[1];
		let number = Object.values(filter)[0] as number;
		return (data[mfield] < number);
	}

	private performGT(filter: any, data: any): boolean{
		// there's only one filter in GT
		let mkey = Object.keys(filter)[0];
		let mfield = mkey.split("_")[1];
		let number = Object.values(filter)[0] as number;
		return (data[mfield]) > number;
	}

	private performEQ(filter: any, data: any): boolean{
		// there's only one filter in EQ
		let mkey = Object.keys(filter)[0];
		let mfield = mkey.split("_")[1];
		let number = Object.values(filter)[0];
		return data[mfield] === number;
	}

	private performIs(filter: any, data: any): boolean{
		let skey = Object.keys(filter)[0];
		let inputString = Object.values(filter)[0] as string;
		let sfield = skey.split("_")[1];
		if (inputString.includes("*")) {
			let last = inputString.length - 1;
			// use Regexp "." to deal with wildcards in the inputstring field: https://regexr.com/
			// 4 cases:
			// 1. only "*" as the inputstring ( Zero or more of any character, except asterisk)
			if (inputString.length === 1) {
				inputString = "^[^*]*$";
				// 2. first char is "*" and only the first one
			} else if ((inputString.charAt(0) === "*") && (inputString.charAt(last) !== "*")) {
				inputString = "." + inputString + "$"; // $ expressing as the string ends here.
				// 3. last char is "*" and only the last one
			} else if ((inputString.charAt(0) !== "*") && (inputString.charAt(last) === "*")) {
				inputString = "^" + inputString; // ^ expressing as the beginning of the string starts here.
				last = inputString.length - 1;
				inputString = inputString.slice(0, last) + "." + inputString.slice(last);
				// 4. both first and last
			} else if ((inputString.charAt(0) === "*") && (inputString.charAt(last) === "*")) {
				inputString = "." + inputString;
				last = inputString.length - 1;
				inputString = inputString.slice(0, last) + "." + inputString.slice(last);
			}
			let regExp = new RegExp(inputString);
			return regExp.test(data[sfield]);
		}
		// no wildcards situation
		return data[sfield] === inputString;
	}

	private performNot(filter: any, data: any): boolean{
		return !this.performFilter(filter, data);
	}

	private performOptions(oldResult: InsightResult[]): InsightResult[]{
		// making a new returning result array that contains the desired cols based on the old result array after filtering
		let newResult = oldResult.map((obj) => {
			let newObj: any = {};
			// usedFields contains the cols we need in the final array
			this.usedFields.forEach((prop) => {
				if(prop.includes("_")){
					newObj[prop.split("_")[0]] = obj[prop];
				}else{
					newObj[this.getDatasetID() + "_" + prop] = obj[prop];
				}
			});
			return newObj;
		});

		// deal with ORDER here
		if(Object.keys(this.query.OPTIONS).length === 2){ // Sort exists
			if(typeof this.query.OPTIONS.ORDER === "object"){ // order is an object
				newResult = this.performSort(newResult);
			}else{
				newResult = this.performOrder(newResult,(this.query.OPTIONS.ORDER)); // order is one single key
			}
		}
		return newResult;
	}

	private performSort(notSorted: InsightResult[]): InsightResult[]{
		let dir = this.query.OPTIONS.ORDER.dir;
		let keys = this.query.OPTIONS.ORDER.keys as string[];
		keys.reverse(); // reverse the string array
		if(dir === "UP"){
			for(let key of keys){
				notSorted.sort((a: any, b: any) => {
					if (a[key] < b[key]) {
						return -1;
					} else if (a[key] > b[key]) {
						return 1;
					} else { // if there is a tie
						return 0; // need to go to the next key
						// continue;
					}
				});
			}
		}else{ // dir = DOWN
			for(let key of keys){
				notSorted.sort((a: any, b: any) => {
					if (a[key] < b[key]) {
						return 1;
					} else if (a[key] > b[key]) {
						return -1;
					} else { // if there is a tie
						return 0; // need to go to the next key
						// continue;
					}
				});
			}
		}
		return notSorted;

	}

	private performOrder(notOrdered: InsightResult[], key: any): InsightResult[]{
		// ascending order
		return notOrdered.sort((a: any, b: any) => {
			if (a[key] < b[key]) {
				return -1;
			} else if (a[key] > b[key]) {
				return 1;
			} else {
				return 0;
			}
		});
	}

}

