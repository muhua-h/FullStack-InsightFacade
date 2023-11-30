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
const Server_1 = __importDefault(require("../../src/rest/Server"));
const InsightFacade_1 = __importDefault(require("../../src/controller/InsightFacade"));
const chai_1 = require("chai");
const supertest_1 = __importDefault(require("supertest"));
const TestUtil_1 = require("../TestUtil");
const fs = __importStar(require("fs"));
describe("Server", () => {
    let facade;
    let server;
    let SERVER_URL = "http://localhost:4321";
    before(async () => {
        (0, TestUtil_1.clearDisk)();
        facade = new InsightFacade_1.default();
        server = new Server_1.default(4321);
        await server.start();
    });
    after(async () => {
        await server.stop();
    });
    beforeEach(function () {
    });
    afterEach(function () {
    });
    it("POST expect to fail: when no data is stored", async () => {
        try {
            return (0, supertest_1.default)(SERVER_URL)
                .post("/query")
                .send({ query: {} })
                .then(chai_1.expect.fail())
                .catch((err) => {
                (0, chai_1.expect)(err.status).to.be.equal(400);
            });
        }
        catch (err) {
            console.log(err);
        }
    });
    it("PUT test for courses dataset", async () => {
        try {
            let ENDPOINT_URL = "/dataset/sections/sections";
            let ZIP_FILE_DATA = fs.readFileSync("test/resources/archives/pair.zip");
            return (0, supertest_1.default)(SERVER_URL)
                .put(ENDPOINT_URL)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then((res) => {
                (0, chai_1.expect)(res.status).to.be.equal(200);
            })
                .catch((err) => {
                console.log(err);
                chai_1.expect.fail();
            });
        }
        catch (err) {
            console.log(err);
        }
    });
    it("GET test", async () => {
        try {
            return (0, supertest_1.default)(SERVER_URL)
                .get("/datasets")
                .set("Content-Type", "application/x-zip-compressed")
                .then((res) => {
                (0, chai_1.expect)(res.status).to.be.equal(200);
            })
                .catch((err) => {
                console.log(err);
                chai_1.expect.fail();
            });
        }
        catch (err) {
            console.log(err);
        }
    });
    it("POST expect to pass", async () => {
        let query = {
            WHERE: {
                OR: [
                    {
                        AND: [
                            {
                                GT: {
                                    sections_avg: 90
                                }
                            },
                            {
                                IS: {
                                    sections_dept: "adhe"
                                }
                            }
                        ]
                    },
                    {
                        EQ: {
                            sections_avg: 95
                        }
                    }
                ]
            },
            OPTIONS: {
                COLUMNS: [
                    "sections_dept",
                    "sections_id",
                    "sections_avg"
                ],
                ORDER: "sections_avg"
            }
        };
        try {
            return (0, supertest_1.default)(SERVER_URL)
                .post("/query")
                .send(query)
                .then((res) => {
                console.log(res.body);
                (0, chai_1.expect)(res.status).to.be.equal(200);
            })
                .catch((err) => {
                console.log(err);
                chai_1.expect.fail();
            });
        }
        catch (err) {
            console.log(err);
        }
    });
    it("PUT test for courses dataset: invalid InsightDatasetKind", async () => {
        try {
            let ENDPOINT_URL = "/dataset/sections/shit";
            let ZIP_FILE_DATA = fs.readFileSync("test/resources/archives/pair.zip");
            return (0, supertest_1.default)(SERVER_URL)
                .put(ENDPOINT_URL)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then((res) => {
                (0, chai_1.expect)(res.status).to.be.equal(400);
            })
                .catch((err) => {
                console.log(err);
                chai_1.expect.fail();
            });
        }
        catch (err) {
            console.log(err);
        }
    });
    it("PUT test for rooms dataset", async () => {
        try {
            let ENDPOINT_URL = "/dataset/rooms/rooms";
            let ZIP_FILE_DATA = fs.readFileSync("test/resources/archives/campus.zip");
            return (0, supertest_1.default)(SERVER_URL)
                .put(ENDPOINT_URL)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then((res) => {
                (0, chai_1.expect)(res.status).to.be.equal(200);
            })
                .catch((err) => {
                console.log(err);
                chai_1.expect.fail();
            });
        }
        catch (err) {
            console.log(err);
        }
    });
    it("DELETE test for courses dataset: 200", async () => {
        try {
            return (0, supertest_1.default)(SERVER_URL)
                .delete("/dataset/rooms")
                .then((res) => {
                (0, chai_1.expect)(res.status).to.be.equal(200);
            });
        }
        catch (err) {
            console.log(err);
            chai_1.expect.fail();
        }
    });
    it("DELETE test for courses dataset: 404", async () => {
        return (0, supertest_1.default)(SERVER_URL)
            .delete("/dataset/nonexistent")
            .then((res) => {
            (0, chai_1.expect)(res.status).to.be.equal(404);
        })
            .catch((err) => {
            console.log(err);
            chai_1.expect.fail();
        });
    });
});
//# sourceMappingURL=Server.spec.js.map