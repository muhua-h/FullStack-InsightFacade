import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError
} from "./IInsightFacade";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
import * as fs from "fs-extra";
import {Room, Section} from "./DatasetInterface";
import AddSections from "./AddSections";

import QuerySyntaxCheck from "./querySyntaxCheck";
import QuerySemanticsCheck from "./querySemanticsCheck";
import QueryPerform from "./queryPerfom";

import HTMLreader from "./HTMLreader";
import BuildingInfoLoader from "./BuildingInfoLoader";


export default class InsightFacade implements IInsightFacade {
	private datasets: InsightDataset[] = [];
	private ids: string[] = [];

	private path_metadata_id = "data/metadata_id.json";
	private path_metadata_dataset = "data/metadata_dataset.json";

	private addSections: AddSections;
	private htmlReader: HTMLreader;
	private buildingInfoLoader: BuildingInfoLoader;

	constructor() {

		console.log("InsightFacadeImpl::init()");

		this.addSections = new AddSections();
		this.htmlReader = new HTMLreader();
		this.buildingInfoLoader = new BuildingInfoLoader();

		if (!fs.existsSync("test/resources/archives")) {
			console.log("zip file not found");
		}

		// if no 'data' folder exists, create it
		if (!fs.existsSync("data")) {
			fs.mkdirSync("data");
			this.ids = [];
			this.datasets = [];
			fs.writeFileSync(this.path_metadata_id, JSON.stringify(this.ids));
			fs.writeFileSync(this.path_metadata_dataset, JSON.stringify(this.datasets));
		} else {
			//  if metadata_id.json or metadata_dataset.json does not exist, create them
			if (!fs.existsSync(this.path_metadata_id) || !fs.existsSync(this.path_metadata_dataset)) {
				this.ids = [];  // this code is probably not needed, but just for robustness
				this.datasets = [];
				fs.writeFileSync(this.path_metadata_id, JSON.stringify(this.ids));
				fs.writeFileSync(this.path_metadata_dataset, JSON.stringify(this.datasets));
			} else {
				fs.ensureDirSync("data");
				this.ids = JSON.parse(fs.readFileSync(this.path_metadata_id, "utf8"));
				this.datasets = JSON.parse(fs.readFileSync(this.path_metadata_dataset, "utf8"));
			}
		}
	}

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		if (!this.isIDvalid(id)) {
			return Promise.reject(new InsightError("input is invalid"));
		}

		let jsonContent: Section[] | Room[] = [];

		// get jsonContent from the files
		if (kind === InsightDatasetKind.Sections) {
			jsonContent = await this.addSections.readSectionsFromZip(content);
		} else if (kind === InsightDatasetKind.Rooms) {
			// save the html files to data folder
			await this.htmlReader.unzipHTMLFolder(content);
			jsonContent = await this.buildingInfoLoader.getBuildingAndRoomInfo();
		}

		if (jsonContent.length === 0) {
			return Promise.reject(new InsightError("no jsonContent found"));
		}

		let newDataset: InsightDataset = {
			id: id,
			kind: kind,
			numRows: jsonContent.length
		};

		if (this.ids.includes(id)) { // check if id exists in ids, if so, throw an InsightError
			return Promise.reject(new InsightError("id already exists"));
		} else {
			this.ids.push(id);
			this.datasets.push(newDataset);
		}

		try { // Save the data to disk
			await fs.writeFile("data/content_" + id + ".json", JSON.stringify(jsonContent));
			await fs.writeFile(this.path_metadata_id, JSON.stringify(this.ids));
			await fs.writeFile(this.path_metadata_dataset, JSON.stringify(this.datasets));
		} catch (error) {
			return Promise.reject(new InsightError("unable to write to disk"));
		}

		return Promise.resolve(this.ids); // return ids
	}

	public async removeDataset(id: string): Promise<string> {

		// check if id or data folder is empty
		if (!this.isIDvalid(id) || !fs.existsSync("data")) {
			return Promise.reject(new InsightError("id is empty or data folder is empty"));
		}

		if (!this.ids.includes(id)) {
			return Promise.reject(new NotFoundError("id not found"));
		}

		// get the index of the id in the array of ids
		let index: number = this.ids.indexOf(id);
		// remove index-th element from the array of ids and InsightDataset
		this.ids.splice(index, 1);
		this.datasets.splice(index, 1);

		// Save the metadata to disk
		try {
			fs.removeSync("data/content_" + id + ".json"); // remove the file corresponding to the id from the disk
			await fs.writeFile(this.path_metadata_id, JSON.stringify(this.ids));
			await fs.writeFile(this.path_metadata_dataset, JSON.stringify(this.datasets));
		} catch (error) {
			return Promise.reject(new InsightError("unable to write to disk"));
		}

		return Promise.resolve(id);
	}

	public async listDatasets(): Promise<InsightDataset[]> {
		return Promise.resolve(this.datasets);
	}

	public async performQuery(query: unknown): Promise<InsightResult[]> {
		query = query as any;
		try {
			let ids = await fs.readJSON("data/metadata_id.json");
			let datasetList = await fs.readJSON("data/metadata_dataset.json");
			// validate the query
			// 1. syntax check
			let QuerySyntaxValidator = new QuerySyntaxCheck(ids, query);
			if (!QuerySyntaxValidator.syntaxCheck()) {
				return Promise.reject(new InsightError("Query Syntax Err!"));
			}
			console.log("passed syntax validation");

			// 2. semantics check
			let QuerySemanticsValidator = new QuerySemanticsCheck(ids, query);
			let semantics = await QuerySemanticsValidator.semanticsCheck();
			if (!semantics) {
				return Promise.reject(new InsightError("Query Semantics Err!"));
			}
			console.log("passed semantics validation");

			// 3. perform query
			let PerformPerform = new QueryPerform(query);
			let result = PerformPerform.smallPerformQuery();
			return Promise.resolve(result);
		} catch (err) {
			if (err instanceof InsightError) {
				return Promise.reject(new InsightError());
			} else {
				return Promise.reject(new ResultTooLargeError());
			}
		}
	}

	private isIDvalid(id: string): boolean {
		if (id.includes("_") || id.trim() === "") { // id cannot contain "_"
			return false;
		} else if // id contains spaces
		(id.includes(" ") || id.includes("\t") || id.includes("\n") || id.includes("\r")) {
			return false;
		}
		return true;
	}
}

