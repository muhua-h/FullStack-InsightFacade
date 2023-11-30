import {Building, Room} from "./DatasetInterface";
import {Element, TextNode} from "parse5/dist/tree-adapters/default";
import {InsightError} from "./IInsightFacade";
import HTMLreader from "./HTMLreader";
import * as http from "http";
import RoomReader from "./RoomReader";

export default class BuildingInfoLoader {
	private attrAddress = "views-field views-field-field-building-address";
	private attrShortName = "views-field views-field-field-building-code";
	private attrTitle = "views-field views-field-title";

	private buildingInfo: Building[] | null;
	private htmlReader: HTMLreader;

	constructor() {
		this.buildingInfo = null;
		this.htmlReader = new HTMLreader();
	}

	public async getBuildingAndRoomInfo(): Promise<Room[]> {

		await this.getBuildingInfo();

		if (this.buildingInfo === null) {
			console.log("building info is null");
			return [];
		}

		let rooms = [];
		for (const building of this.buildingInfo) {
			let roomReader = new RoomReader(building);

			let roomInfo = roomReader.getRoomInfo();
			if (roomInfo.length > 0) {
				rooms.push(...roomReader.getRoomInfo());
			}
		}

		if (rooms.length === 0) {
			return Promise.reject(new InsightError("no rooms found"));
		}

		return rooms;
	}

	public async getBuildingInfo() {

		let tr = this.htmlReader.readIndexFile("data/campus/index.htm", true, "tr");

		if (tr === null) {
			return Promise.reject(new InsightError("building info is problematic"));
		}

		this.buildingInfo = await this.collectAttributes(tr, this.attrAddress, this.attrTitle, this.attrShortName);

		if (this.buildingInfo === null) {
			console.log("== building info is null");
			return Promise.reject(new InsightError("building info is problematic"));
		}
	}

	private async collectAttributes(trList: any[], attrAddress: string, attrLongName: string,
		attrShortName: string): Promise<Building[] | null> {

		let inCompleteBuildingList: any[] = [];
		let geoLocationList: any[] = [];
		this.getAttributes(trList, attrLongName, attrAddress, attrShortName, inCompleteBuildingList, geoLocationList);
		const geoLocationResults = await Promise.all(geoLocationList);

		return this.combineBuildingAndGeoInfo(inCompleteBuildingList, geoLocationResults);
	}

	private getAttributes(trList: any[], attrLongName: string, attrAddress: string, attrShortName: string,
						 inCompleteBuildingList: any[], geoLocationList: any[]) {
		for (const tr of trList) {
			let longName, link, address, shortName;
			for (const td of tr.childNodes) {
				if (td.nodeName === "td") {
					for (const attr of td.attrs) {
						if (attr.value === attrLongName) {
							td.childNodes.forEach((child: Element) => {
								if (child.nodeName === "a") {
									for (const attr2 of child.attrs) {
										if (attr2.name === "href") {
											link = attr2.value;
										}
									}
									for (const item of child.childNodes) {
										if (item.nodeName === "#text") {
											let baby = item as TextNode;
											longName = baby.value.trim();
										}
									}
								}
							});
						}
						if (attr.value === attrAddress) {
							address = this.htmlReader.extractTextNodeValue(td);
						}
						if (attr.value === attrShortName) {
							shortName = this.htmlReader.extractTextNodeValue(td);
						}
					}
				}
			}
			if (!(longName === undefined || link === undefined || address === undefined || shortName === undefined)) {
				inCompleteBuildingList.push({longName: longName, shortName: shortName, address: address, link: link});
				geoLocationList.push(this.getGeoInfo(address));
			}
		}
	}

	private combineBuildingAndGeoInfo(buildingList: any[], geoLocationResults: any[]): Building[] {
		let combinedList: Building[] = [];
		for (let i = 0; i < geoLocationResults.length; i++) {
			if (Object.prototype.hasOwnProperty.call(geoLocationResults[i], "lat") &&
				Object.prototype.hasOwnProperty.call(geoLocationResults[i], "lon")) {
				combinedList.push({
					fullname: buildingList[i].longName,
					shortname: buildingList[i].shortName,
					address: buildingList[i].address,
					lat: geoLocationResults[i].lat,
					lon: geoLocationResults[i].lon,
					link: buildingList[i].link
				});
			}
		}
		return combinedList; // should return an array of building objects
	}


	// reference: https://nodejs.org/api/http.html#httpgeturl-options-callback (directly adapted from the template)
	// reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent
	private async getGeoInfo(address: string): Promise<any> {
		let encodedAddress = encodeURIComponent(address); //  reference: course website
		let url = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team112/" + encodedAddress;

		try { // use try-catch to avoid callback hell
			const parsedData = await new Promise((resolve, reject) => {
				http.get(url, (res) => {
					let rawData = "";
					res.on("data", (chunk) => {
						rawData += chunk;
					});
					res.on("end", () => {
						try {
							const data = JSON.parse(rawData);
							resolve(data);
						} catch (e) {
							// resolve(Promise<null>);
							reject(e);
						}
					});
				}).on("error", (error) => {
					reject(error);
				});
			});
			return parsedData;
		} catch (e) {
			// reject(e);
			return null;
		}
	}
}
