import jsZip from "jszip";
import {InsightError} from "./IInsightFacade";
import * as fs from "fs-extra";
import {parse} from "parse5";


export default class HTMLreader {

	private attrAddress = "views-field views-field-field-building-address";
	private attrShortName = "views-field views-field-field-building-code";
	private attrTitle = "views-field views-field-title";
	private attrImage = "views-field views-field-field-building-image";
	private attrNothing = "views-field views-field-nothing";
	private buildingTableAttributes = [this.attrAddress, this.attrShortName, this.attrTitle, this.attrImage,
		this.attrNothing];

	private attrRoomNumber = "views-field views-field-field-room-number";
	private attrRoomFurniture = "views-field views-field-field-room-furniture";
	private attrRoomType = "views-field views-field-field-room-type";
	private attrRoomCapacity = "views-field views-field-field-room-capacity";
	private attrRoomHref = "views-field views-field-nothing";
	private roomTableAttributes = [this.attrRoomNumber, this.attrRoomFurniture,
		this.attrRoomType, this.attrRoomCapacity, this.attrRoomHref];

	// reference: https://piazza.com/class/lc6u8shhhn2dd/post/1007
	// read the index.htm file and extract the building names and their corresponding links
	public readIndexFile(path: string, isBuilding: boolean, nodeName: string): any[] | null {
		let indexFile;
		try {
			indexFile = fs.readFileSync(path, "utf8");
		} catch (err) {
			return null;
		}

		// reference: https://piazza.com/class/lc6u8shhhn2dd/post/928
		const document = parse(indexFile);

		// Step 1: skip the comments and get to the html
		let html = this.dfsFindOneItem(document, "html");
		if (html === null) {
			return null;
		}

		// Step 2: within the html part, get tables
		let tables = this.dsfFindMultipleNodes(html, "table");

		// Step 3: check if the td has a valid element
		let validTable;
		if (isBuilding) {
			validTable = this.getTheValidTable(tables, this.buildingTableAttributes);
		} else {
			validTable = this.getTheValidTable(tables, this.roomTableAttributes);
		}

		if (validTable === null) {
			return null;
		}

		// Step 4: read the table and store the information in an array of buildingInfo
		let trs = this.dsfFindMultipleNodes(validTable, nodeName);

		return trs;
	}

	// reference: https://medium.com/swlh/depth-first-and-breadth-first-dom-traversal-explained-for-real-86244fbf9854
	// search for the class name, and return an array of content
	private dsfFindMultipleNodes(node: any, nodeName: string): any[] {

		let nodeToVisit: any[] = node.childNodes.slice(); // todo: need to copy, not a reference
		let result: any[] = [];

		while (nodeToVisit.length !== 0) {

			let curr = nodeToVisit.pop(); // might be here

			if (curr.nodeName === nodeName) {
				result.push(curr);
			} else if (curr.childNodes) { // check if curr.childNodes is defined
				nodeToVisit.push(...curr.childNodes);
			}
		}
		return result;
	}

	private dfsFindOneItem(node: any, nodeName: string, attrName?: string): any {

		let nodeToVisit: any[] = node.childNodes.slice();

		while (nodeToVisit.length !== 0) {
			const curr = nodeToVisit.pop();

			if (curr.nodeName === nodeName) {
				return curr;
			} else if (curr.childNodes) {
				// add the children of the current node to the nodeToVisit
				nodeToVisit.push(...curr.childNodes);
			}
		}
		return null;
	}

	private getTheValidTable(tables: any[], requiredAttr: string[]): any {
		let validTable: any = null;
		let validTableCount = 0;

		tables.forEach((table: any) => {

			let attrValue: any[] = [];

			if (table.childNodes) {

				let thList = this.dsfFindMultipleNodes(table, "th");

				// attribute value of the th element in theList
				thList.forEach((th) => {
					attrValue.push(th.attrs[0].value);
				});

				// reference: https://stackoverflow.com/a/71347419
				// if thList contains all elements in necessaryAttributes
				if (requiredAttr.every((attr) => attrValue.includes(attr))) {
					validTable = table;
					validTableCount++;
				}
			}
		});

		// in case there are more than one valid tables
		if (validTableCount !== 1) {
			return null;
		}

		return validTable;
	};

	// reference: https://www.geeksforgeeks.org/node-js-fs-extra-outputfile-function/
	// reference: https://www.tabnine.com/code/javascript/functions/jszip/JSZipObject/async
	// reference: https://www.tutorialspoint.com/outputfile-function-in-fs-extra-nodejs
	public async unzipHTMLFolder(zipFileContent: string) {

		const zip = await jsZip.loadAsync(zipFileContent, {base64: true});

		// Find the index.htm file in the zip and make sure it exists
		const indexFile = zip.file("index.htm");
		if (!indexFile) {
			throw new InsightError("Could not find index.htm file in zip");
		}
		// Extract the index file
		const tempIndexFilePath = "data/campus/index.htm";
		await indexFile.async("nodebuffer").then((buffer: Buffer) => {
			return fs.outputFile(tempIndexFilePath, buffer);
		});

		// move into the folder that contains the htm files
		const htmFolder = zip.folder("campus")?.folder("discover")?.folder("buildings-and-classrooms");
		if (!htmFolder) {
			throw new InsightError("No zip folder");
		}

		const FolderPath = "data/campus";

		// copy files from htmFolder to the data/campus folder
		await Promise.all(htmFolder.file(/\.htm$/).map(async (file) => {

			const tempFilePath = `${FolderPath}/${file.name}`;
			const fileContent = await file.async("nodebuffer");

			await fs.outputFile(tempFilePath, fileContent);
		}));
	}

	public extractTextNodeValue(td: any): any {
		for (const item of td.childNodes) {
			if (item.nodeName === "#text") {
				return item.value.trim();
			}
		}
	}
}
