import {Building, Room} from "./DatasetInterface";
import HTMLreader from "./HTMLreader";
import {TextNode} from "parse5/dist/tree-adapters/default";


export default class RoomReader {
	// private building;
	private HTMLreader;
	private attrRoomNumber = "views-field views-field-field-room-number";
	private attrRoomFurniture = "views-field views-field-field-room-furniture";
	private attrRoomType = "views-field views-field-field-room-type";
	private attrRoomCapacity = "views-field views-field-field-room-capacity";
	private attrRoomHref = "views-field views-field-nothing";

	private building: Building;

	constructor(building: Building) { // TODO: later pass in a building object
		// this.building = building;
		this.HTMLreader = new HTMLreader();
		this.building = building;
	}

	public getRoomInfo(): Room[] {

		let path = this.building.link;

		// replace the first "." with "data/campus"
		path = path.replace(".", "data/campus");
		let td = this.HTMLreader.readIndexFile(path,
			false, "tr");
		if (td === null) {
			return [];
		}

		return this.collectAttributes(td);
	}

	private collectAttributes(trList: any[]): Room[] {

		let roomNumbers: string[] = [], roomHrefs: string[] = [];
		let roomFurnitures: string[] = [], roomTypes: string[] = [], roomCapacities: any[] = [];

		this.getRoomAttributes(trList, roomNumbers, roomHrefs, roomFurnitures, roomTypes, roomCapacities);

		let rooms = this.createRoomObject(roomNumbers, roomHrefs, roomFurnitures, roomTypes, roomCapacities);

		return rooms;
	}

	private getRoomAttributes(trList: any[], roomNumbers: string[], roomHrefs: string[], roomFurnitures: string[],
							  roomTypes: string[], roomCapacities: any[]) {
		for (const tr of trList) {
			let roomNumber, roomHref, roomFurniture, roomType, roomCapacity;
			for (const td of tr.childNodes) {
				if (td.nodeName === "td") {
					for (const attr of td.attrs) {
						if (attr.value === this.attrRoomCapacity) {
							roomCapacity = this.HTMLreader.extractTextNodeValue(td);
						}
						if (attr.value === this.attrRoomFurniture) {
							roomFurniture = this.HTMLreader.extractTextNodeValue(td);
						}
						if (attr.value === this.attrRoomType) {
							roomType = this.HTMLreader.extractTextNodeValue(td);
						}
						if (attr.value === this.attrRoomNumber) {
							td.childNodes.forEach((child: any) => {
								if (child.nodeName === "a") {
									for (const attr2 of child.attrs) {
										if (attr2.name === "href") {
											roomHref = attr2.value;
										}
									}
									for (const item of child.childNodes) {
										if (item.nodeName === "#text") {
											roomNumber = (item as TextNode).value.trim();
										}
									}
								}
							});
						}
					}
				}
			}
			if (roomNumber === undefined || roomHref === undefined || roomFurniture === undefined ||
				roomType === undefined || roomCapacity === undefined) {
				// do nothing
			} else {
				roomNumbers.push(roomNumber);
				roomHrefs.push(roomHref);
				roomFurnitures.push(roomFurniture);
				roomTypes.push(roomType);
				roomCapacities.push(parseInt(roomCapacity, 10));
			}
		}
	}

	private createRoomObject(roomNumbers: string[], roomHrefs: string[], roomFurnitures: string[],
							 roomTypes: string[], roomCapacities: number[]): Room[] {

		if (roomNumbers.length !== roomHrefs.length || roomHrefs.length !== roomFurnitures.length ||
			roomFurnitures.length !== roomTypes.length || roomTypes.length !== roomCapacities.length) {
			console.log("something is wrong in createRoomObject in RoomReader.ts");
		}

		// reference: https://stackoverflow.com/questions/38204053/javascript-map-2-arrays-into-1-object
		const room = roomNumbers.map((value, index) => ({
			fullname: this.building.fullname,
			shortname: this.building.shortname,
			number: value,
			name: this.building.shortname + "_" + roomNumbers[index],
			address: this.building.address,
			lat: this.building.lat,
			lon: this.building.lon,
			seats: roomCapacities[index],
			furniture: roomFurnitures[index],
			type: roomTypes[index],
			href: roomHrefs[index]
		}
		));

		return room;
	}
}
