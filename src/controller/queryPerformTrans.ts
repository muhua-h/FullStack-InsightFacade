import {IInsightFacade, InsightDatasetKind, InsightResult} from "./IInsightFacade";
import * as console from "console";
import Decimal from "decimal.js";

export default class QueryPerformTrans{
	private query: any;
	private oldResult: InsightResult[];
	private kind: InsightDatasetKind;
	constructor(query: any, oldResult: InsightResult[], kind: InsightDatasetKind) {
		this.query = query;
		this.oldResult = oldResult;
		this.kind = kind;
	}

	// main function
	public performTrans(): InsightResult[]{
		return this.performApply(this.performGroup());
	}


	private performGroup(): Map<string, InsightResult[]>{
		let groupList = this.query.TRANSFORMATIONS.GROUP;
		let grouped = this.oldResult.reduce((map, obj) => {
			let keyMap = new Map<string, any>(); // string map to string/num
			for(let group of groupList){
				group = group.split("_")[1]; // cut off the head
				keyMap.set(group, obj[group]); // push to keyMap
			}
			const key = JSON.stringify(Object.fromEntries(keyMap));
			const collection = map.get(key);
			if (!collection) {
				map.set(key, [obj]);
			} else {
				collection.push(obj);
			}
			return map;
		}, new Map<string, InsightResult[]>());
		return grouped;
	}

	private performApply(oldGrouped: Map<string, InsightResult[]>): InsightResult[]{
		let newResult: InsightResult[] = [];
		let apply = this.query.TRANSFORMATIONS.APPLY;
		oldGrouped.forEach((realResult, key) => {
			let groupKeys = JSON.parse(key);
			let oneResult: InsightResult = {};
			for(let gkey of Object.keys(groupKeys)){
				oneResult[gkey] = groupKeys[gkey];
			}
			for(let applyRule of apply){ // if apply is empty, then skip
				let applyKey = Object.keys(applyRule)[0];
				let applyValue = Object.values(applyRule) as any[];
				let applyToken = Object.keys(applyValue[0])[0];
				let applyRuleKey = Object.values(applyValue[0])[0] as string;
				applyRuleKey = applyRuleKey.split("_")[1]; // cut off the head
				let resultNum = 0;
				switch(applyToken){
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
				oneResult[applyKey + "_"] = resultNum; // make a mark
			}
			newResult.push(oneResult);
		});
		return newResult;
	}

	private applyMAX(oldResult: InsightResult[], key: string): number{
		// console.log(key);
		let maxNum = (oldResult[0][key]) as number;
		for(let result of oldResult){
			if(maxNum < (result[key] as number)){
				maxNum = (result[key]) as number;
			}
		}
		return maxNum;
	}

	private applyMIN(oldResult: InsightResult[], key: string): number{
		let minNum = oldResult[0][key] as number;
		for(let result of oldResult){
			if(minNum > result[key]){
				minNum = result[key] as number;
			}
		}
		return minNum;
	}

	private applyAVG(oldResult: InsightResult[], key: string): number{
		let total = new Decimal(0);
		let count = oldResult.length;
		if(count === 0){
			return 0;
		}
		for(let result of oldResult){
			let toDecimal = new Decimal(result[key]);
			total = total.add(toDecimal);
		}
		let avg = total.toNumber() / count;
		return Number(avg.toFixed(2));
	}

	private applySUM(oldResult: InsightResult[], key: string): number{
		let sumNum = 0;
		for(let result of oldResult){
			sumNum = (sumNum + Number(result[key])) as number;
		}
		return Number(sumNum.toFixed(2));
	}

	private applyCOUNT(oldResult: InsightResult[], key: string): number{
		let temp: any[] = [];
		for(let result of oldResult){
			if(!temp.includes(result[key])){
				temp.push(result[key]);
			}
		}
		let count = temp.length;
		return count;
	}

}
