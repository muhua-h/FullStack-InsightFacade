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
const IInsightFacade_1 = require("./IInsightFacade");
const HTMLreader_1 = __importDefault(require("./HTMLreader"));
const http = __importStar(require("http"));
const RoomReader_1 = __importDefault(require("./RoomReader"));
class BuildingInfoLoader {
    attrAddress = "views-field views-field-field-building-address";
    attrShortName = "views-field views-field-field-building-code";
    attrTitle = "views-field views-field-title";
    buildingInfo;
    htmlReader;
    constructor() {
        this.buildingInfo = null;
        this.htmlReader = new HTMLreader_1.default();
    }
    async getBuildingAndRoomInfo() {
        await this.getBuildingInfo();
        if (this.buildingInfo === null) {
            console.log("building info is null");
            return [];
        }
        let rooms = [];
        for (const building of this.buildingInfo) {
            let roomReader = new RoomReader_1.default(building);
            let roomInfo = roomReader.getRoomInfo();
            if (roomInfo.length > 0) {
                rooms.push(...roomReader.getRoomInfo());
            }
        }
        if (rooms.length === 0) {
            return Promise.reject(new IInsightFacade_1.InsightError("no rooms found"));
        }
        return rooms;
    }
    async getBuildingInfo() {
        let tr = this.htmlReader.readIndexFile("data/campus/index.htm", true, "tr");
        if (tr === null) {
            return Promise.reject(new IInsightFacade_1.InsightError("building info is problematic"));
        }
        this.buildingInfo = await this.collectAttributes(tr, this.attrAddress, this.attrTitle, this.attrShortName);
        if (this.buildingInfo === null) {
            console.log("== building info is null");
            return Promise.reject(new IInsightFacade_1.InsightError("building info is problematic"));
        }
    }
    async collectAttributes(trList, attrAddress, attrLongName, attrShortName) {
        let inCompleteBuildingList = [];
        let geoLocationList = [];
        this.getAttributes(trList, attrLongName, attrAddress, attrShortName, inCompleteBuildingList, geoLocationList);
        const geoLocationResults = await Promise.all(geoLocationList);
        return this.combineBuildingAndGeoInfo(inCompleteBuildingList, geoLocationResults);
    }
    getAttributes(trList, attrLongName, attrAddress, attrShortName, inCompleteBuildingList, geoLocationList) {
        for (const tr of trList) {
            let longName, link, address, shortName;
            for (const td of tr.childNodes) {
                if (td.nodeName === "td") {
                    for (const attr of td.attrs) {
                        if (attr.value === attrLongName) {
                            td.childNodes.forEach((child) => {
                                if (child.nodeName === "a") {
                                    for (const attr2 of child.attrs) {
                                        if (attr2.name === "href") {
                                            link = attr2.value;
                                        }
                                    }
                                    for (const item of child.childNodes) {
                                        if (item.nodeName === "#text") {
                                            let baby = item;
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
                inCompleteBuildingList.push({ longName: longName, shortName: shortName, address: address, link: link });
                geoLocationList.push(this.getGeoInfo(address));
            }
        }
    }
    combineBuildingAndGeoInfo(buildingList, geoLocationResults) {
        let combinedList = [];
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
        return combinedList;
    }
    async getGeoInfo(address) {
        let encodedAddress = encodeURIComponent(address);
        let url = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team112/" + encodedAddress;
        try {
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
                        }
                        catch (e) {
                            reject(e);
                        }
                    });
                }).on("error", (error) => {
                    reject(error);
                });
            });
            return parsedData;
        }
        catch (e) {
            return null;
        }
    }
}
exports.default = BuildingInfoLoader;
//# sourceMappingURL=BuildingInfoLoader.js.map