export default class QuerySyntaxCheck {
	private query: any;
	// for later key check
	public usedMKey: string[] = [];
	public usedSKey: string[] = [];
	public usedColKey: string[] = [];
	private idstring: string[] = [];
	private applyToken: string[] = ["MAX","MIN","AVG","SUM","COUNT"];

	constructor(idStr: string[], query: any){
		this.query = query;
		this.idstring = idStr;
	}

	// main function
	public syntaxCheck(): boolean {
		if(this.query == null){
			return false;
		}
		// Either {body, options} OR {body, options, transformations}
		if(((Object.keys(this.query)).length !== 2) && ((Object.keys(this.query)).length !== 3)){
			return false;
		}
		if(!(Object.keys(this.query)).includes("WHERE") || !(Object.keys(this.query)).includes("OPTIONS")){
			return false;
		}
		if((Object.keys(this.query)).length === 3){
			if(!(Object.keys(this.query)).includes("TRANSFORMATIONS")) {
				return false;
			}
		}

		if((Object.keys(this.query)).length === 2){
			return (this.bodyValidator() && this.optionsValidator());
		}else{ // when length === 3
			return (this.bodyValidator() && this.optionsValidator() && this.transformationsValidator());
		}

	}

	// check the query BODY(WHERE) syntax, if invalid, return false; if valid, return true.
	private bodyValidator(): boolean{
		let body = this.query.WHERE;

		if(!(body instanceof Object)){
			return false;
		}

		if(Object.keys(body).length !== 1 && Object.keys(body).length !== 0){ // should only have 0 or 1 filter
			return false;
		}


		if(Object.keys(body).length === 0){ // no filter to check syntax
			return true;
		}

		return this.filterValidator(body); // checks the filter for body
	}

	// check the FILTER inside the query body, if invalid, return false; if valid, return true.
	private filterValidator(filter: any): boolean{

		if(Object.keys(filter).length !== 1){
			return false;
		}

		let key = Object.keys(filter)[0]; // there's only one FILTER: LOGICCOMPARISON | MCOMPARISON | SCOMPARISON | NEGATION
		// for LogicComparison, the value should be an array
		if(key === "AND" || key === "OR"){

			if(!(filter[key] instanceof Array)){
				return false;
			}
			return this.logicCompareValidator(filter[key]);
		}

		// for MCOMPARISON and SCOMPARISON, the value should be an object
		if(!(filter[key] instanceof Object)){
			return false;
		}
		if(key === "LT" || key === "GT" || key === "EQ") {
			return this.mCompareValidator(filter[key]);
		}
		if(key === "IS"){
			return this.sCompareValidator(filter[key]);
		}
		if(key === "NOT"){
			return this.negateValidator(filter[key]);
		}
		return false;
	}

	// check LOGICCOMPARISON in filter, if invalid, return false; if valid, return true.
	private logicCompareValidator(logicCompare: any): boolean{
		// cannot be empty or cannot have two keys in "AND" or "OR" at the same time

		if((logicCompare.length <= 0)){
			return false;
		}

		if(!(logicCompare instanceof Object)){
			return false;
		}
		for (let logic of logicCompare){
			if(!(this.filterValidator(logic))){
				return false;
			}
		}
		return true;
	}

	// check MCOMPARISON in filter, if invalid, return false; if valid, return true.
	private mCompareValidator(numCompare: any): boolean{

		if (Object.keys(numCompare).length !== 1){
			return false;
		}

		let mkey = Object.keys(numCompare)[0];
		let number = Object.values(numCompare)[0];

		if ((typeof number !== "number")){
			return false;
		}
		this.usedMKey.push(mkey);
		// console.log(mkey);
		return true;
	}

	// check SCOMPARISON in filter, if invalid, return false; if valid, return true.
	private sCompareValidator(strCompare: any): boolean{

		// cannot be empty or cannot have two keys in "IS" at the same time
		if(Object.keys(strCompare).length !== 1){
			return false;
		}
		let skey = Object.keys(strCompare)[0];
		let inputString = Object.values(strCompare)[0]; // remember to check wildcards!!

		if ((typeof inputString !== "string")){
			return false;
		}
		// remember to check wildcards!!

		if(inputString.includes("*")){
			let size = inputString.length;
			// let last = size - 1;
			for(let [index, char] of [...inputString].entries()){
				if(char === "*"){ // if we detect a wildcard char
					if((index !== 0) && (index !== size - 1)){ // and that wildcard is not at the first or the last pos
						return false;
					}
				}
			}
		}
		this.usedSKey.push(skey);
		return true;
	}

	// check NEGATION in filter, if invalid, return false; if valid, return true.
	private negateValidator( notCompare: any): boolean{
		if(Object.keys(notCompare).length <= 0 || Object.keys(notCompare).length > 1){ // there's only one filter
			return false;
		}

		return this.filterValidator(notCompare);
	}

	// check OPTIONS in query, if invalid, return false; if valid, return true.
	private optionsValidator(): boolean{
		if(Object.keys(this.query.OPTIONS).length !== 1 && Object.keys(this.query.OPTIONS).length !== 2){ // only col and order
			return false;
		}
		if(!Object.keys(this.query.OPTIONS).includes("COLUMNS") ){ // must have col
			return false;
		}

		// Allow the order of COLUMNS and ORDER to be switched
		if(Object.keys(this.query.OPTIONS).length === 2){
			if (((Object.keys(this.query.OPTIONS)[1] === "ORDER" && Object.keys(this.query.OPTIONS)[0] === "COLUMNS") ||
				(Object.keys(this.query.OPTIONS)[0] === "ORDER" && Object.keys(this.query.OPTIONS)[1] === "COLUMNS"))) {
				// do nothing
			} else {
				return false;
			}
		}

		let colValid = this.colValidator(this.query.OPTIONS.COLUMNS);
		let ordValid = true;

		if(Object.keys(this.query.OPTIONS).length === 2){
			ordValid = this.orderValidator(this.query.OPTIONS.ORDER);
		}

		return (colValid && ordValid);
	}

	// check COLUMNS in options, if invalid, return false; if valid, return true.
	private colValidator(colList: any): boolean{ // checking keys in semanticChecks
		if(!(colList instanceof Array)){
			return false;
		}
		if(colList.length <= 0){
			return false;
		}
		for (let col of colList){
			if(typeof col !== "string"){
				return false;
			}
			this.usedColKey.push(col);
		}

		return true;
	}

	private orderValidator(order: any): boolean{
		if(order === null){
			return false;
		}
		if(typeof order !== "string" && typeof order !== "object"){ // order must be Either object OR string
			return false;
		}
		if(typeof order === "object"){
			if(!(order.keys instanceof Array)){
				return false;
			}
			if(Object.keys(order).length !== 2){ // object order must have dir and keys
				return false;
			}
			if(!Object.keys(order).includes("dir") || !Object.keys(order).includes("keys")){
				return false;
			}
			if(typeof order.dir !== "string"){ // dir value must be a string
				return false;
			}
			if(order.dir !== "UP" && order.dir !== "DOWN"){ // dir value has to be either UP or DOWN
				return false;
			}
			if(((order.keys as string[]).length <= 0) || order.keys === null){ // keys must be non-empty
				return false;
			}
		}
		return true;
	}

	private transformationsValidator(): boolean{
		let trans = this.query.TRANSFORMATIONS;
		if(trans === null){
			return false;
		}
		if(Object.keys(trans).length !== 2){ // must have group and apply
			return false;
		}
		if(!Object.keys(trans).includes("GROUP") || !Object.keys(trans).includes("APPLY")){
			return false;
		}
		if(!((trans.GROUP) instanceof Array)){
			return false;
		}
		if((Object.keys(trans.GROUP)).length <= 0){ // group must be non-empty; deal with [] and {}
			return false;
		}

		// check APPLYRULE_LIST
		let APPLYRULE_LIST = trans.APPLY;
		if(!(APPLYRULE_LIST instanceof Array)){
			return false;
		}
		for(let applyRule of APPLYRULE_LIST){
			// applyRule cannot be empty
			let applyKey = Object.keys(applyRule);
			if(applyKey.length !== 1){ // applyRule should only have 1 key
				return false;
			}
			if(applyKey.includes("_")){ // One or more of any character, except underscore.
				return false;
			}
			let applyValue = Object.values(applyRule) as any[];
			let applyTokenTemp = Object.keys(applyValue[0])[0];
			if(Object.keys(applyValue[0]).length !== 1){ // there can only be one key in applyRule body
				return false;
			}
			if(!this.applyToken.includes(applyTokenTemp)){
				return false;
			}
		}
		return true;
	}
}
