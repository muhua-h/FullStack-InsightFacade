"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const HTMLreader_1 = __importDefault(require("./HTMLreader"));
class RoomReader {
    HTMLreader;
    attrRoomNumber = "views-field views-field-field-room-number";
    attrRoomFurniture = "views-field views-field-field-room-furniture";
    attrRoomType = "views-field views-field-field-room-type";
    attrRoomCapacity = "views-field views-field-field-room-capacity";
    attrRoomHref = "views-field views-field-nothing";
    building;
    constructor(building) {
        this.HTMLreader = new HTMLreader_1.default();
        this.building = building;
    }
    getRoomInfo() {
        let path = this.building.link;
        path = path.replace(".", "data/campus");
        let td = this.HTMLreader.readIndexFile(path, false, "tr");
        if (td === null) {
            return [];
        }
        return this.collectAttributes(td);
    }
    collectAttributes(trList) {
        let roomNumbers = [], roomHrefs = [];
        let roomFurnitures = [], roomTypes = [], roomCapacities = [];
        this.getRoomAttributes(trList, roomNumbers, roomHrefs, roomFurnitures, roomTypes, roomCapacities);
        let rooms = this.createRoomObject(roomNumbers, roomHrefs, roomFurnitures, roomTypes, roomCapacities);
        return rooms;
    }
    getRoomAttributes(trList, roomNumbers, roomHrefs, roomFurnitures, roomTypes, roomCapacities) {
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
                            td.childNodes.forEach((child) => {
                                if (child.nodeName === "a") {
                                    for (const attr2 of child.attrs) {
                                        if (attr2.name === "href") {
                                            roomHref = attr2.value;
                                        }
                                    }
                                    for (const item of child.childNodes) {
                                        if (item.nodeName === "#text") {
                                            roomNumber = item.value.trim();
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
            }
            else {
                roomNumbers.push(roomNumber);
                roomHrefs.push(roomHref);
                roomFurnitures.push(roomFurniture);
                roomTypes.push(roomType);
                roomCapacities.push(parseInt(roomCapacity, 10));
            }
        }
    }
    createRoomObject(roomNumbers, roomHrefs, roomFurnitures, roomTypes, roomCapacities) {
        if (roomNumbers.length !== roomHrefs.length || roomHrefs.length !== roomFurnitures.length ||
            roomFurnitures.length !== roomTypes.length || roomTypes.length !== roomCapacities.length) {
            console.log("something is wrong in createRoomObject in RoomReader.ts");
        }
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
        }));
        return room;
    }
}
exports.default = RoomReader;
//# sourceMappingURL=RoomReader.js.map